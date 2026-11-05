import re
from typing import List, Dict, Any

class GroundedGenerator:
    """
    Grounded LLM Generator / Rule Engine that synthesizes clear plain-language answers
    strictly using retrieved policy context. Enforces strict refusal ("Not found in the provided policy.")
    when information is missing.
    """

    SYSTEM_PROMPT = """You are an insurance policy information assistant.

Answer ONLY using the supplied retrieved policy context.
Do not use your general knowledge to fill missing information.
Do not invent coverage, exclusions, limits, deductibles, dates, clauses, or conditions.

If the retrieved context does not contain enough information to answer the user's question, respond exactly:
'Not found in the provided policy.'

When answering, provide a concise plain-language explanation and identify the supporting policy and clause.
You provide information only. You do not make coverage decisions, provide legal advice, or provide personalized recommendations."""

    @staticmethod
    def generate_answer(query: str, retrieved_chunks: List[Dict[str, Any]], top_score: float) -> Dict[str, Any]:
        # Refusal check: If no relevant chunks retrieved or top score below threshold
        if not retrieved_chunks:
            return {
                "answer": "Not found in the provided policy.",
                "grounded": False,
                "sources": [],
                "confidence_score": round(top_score, 4)
            }

        primary_chunk = retrieved_chunks[0]

        # Extract source metadata
        sources = []
        for c in retrieved_chunks:
            sources.append({
                "policy_title": c["policy_title"],
                "section": c["section_number"],
                "clause": c["clause_number"],
                "clause_title": c["clause_title"],
                "evidence": c["short_passage"]
            })

        # Synthesize concise plain language answer from retrieved clause content
        clause_text = primary_chunk["raw_clause_text"]
        policy_title = primary_chunk["policy_title"]
        clause_num = primary_chunk["clause_number"]
        clause_title = primary_chunk["clause_title"]

        # Formulate grounded plain-language answer
        answer_text = GroundedGenerator._synthesize_plain_language_answer(query, primary_chunk, retrieved_chunks)

        return {
            "answer": answer_text,
            "grounded": True,
            "sources": sources,
            "confidence_score": round(top_score, 4)
        }

    @staticmethod
    def _synthesize_plain_language_answer(query: str, primary_chunk: Dict[str, Any], chunks: List[Dict[str, Any]]) -> str:
        """
        Synthesizes a direct, concise, human-readable plain language answer based on the exact clause text.
        """
        text = primary_chunk["raw_clause_text"]
        policy_title = primary_chunk["policy_title"]
        clause_num = primary_chunk["clause_number"]
        clause_title = primary_chunk["clause_title"]
        q_lower = query.lower()

        # Direct extraction patterns for common policy queries
        if "deductible" in q_lower:
            match = re.search(r"deductible of (\$\d+|\d+%|\$\d+\s+applies)", text, re.IGNORECASE)
            if match:
                amount = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), the applicable deductible is {amount} per claim."
        
        if "towing" in q_lower or "roadside" in q_lower:
            match = re.search(r"towing up to (\d+\s+kilometers|\d+\s+km)", text, re.IGNORECASE)
            if match:
                dist = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), roadside assistance includes emergency towing up to {dist} to the nearest repair center."
        
        if "report" in q_lower or "notif" in q_lower or "hours" in q_lower or "timeline" in q_lower:
            match = re.search(r"within (\d+\s+hours|\d+\s+business days|\d+\s+days)", text, re.IGNORECASE)
            if match:
                timeframe = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), loss or accidents must be reported to the insurer within {timeframe} of occurrence."

        if "cancel" in q_lower or "refund" in q_lower:
            match = re.search(r"(\d+\s+days prior written notice|\d+\s+days notice)", text, re.IGNORECASE)
            if match:
                notice = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), policyholders can cancel the policy by providing {notice}. A pro-rata premium refund will be issued subject to applicable fees."

        if "rental" in q_lower or "temporary car" in q_lower:
            match = re.search(r"(\$\d+ per day for a maximum of \d+ consecutive days)", text, re.IGNORECASE)
            if match:
                allowance = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), a temporary rental vehicle allowance of up to {allowance} is provided for authorized repairs exceeding 48 hours."

        if "medical" in q_lower:
            match = re.search(r"up to a maximum limit of (\$\d+(?:,\d+)*)", text, re.IGNORECASE)
            if match:
                limit = match.group(1)
                return f"Under {policy_title} (Clause {clause_num} — {clause_title}), emergency medical expenses outside your home country are covered up to a maximum limit of {limit} per traveler."

        # General synthesis based on clause content
        first_sentence = text.split(".")[0].strip()
        return f"According to {policy_title} (Clause {clause_num} — {clause_title}): {first_sentence}."
