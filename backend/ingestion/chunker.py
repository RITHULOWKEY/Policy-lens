from typing import List, Dict, Any

class PolicyChunker:
    """
    Semantic section/clause-aware chunker that retains rich metadata for source attribution.
    """

    @staticmethod
    def create_chunks_from_parsed_policy(parsed_policy: Dict[str, Any]) -> List[Dict[str, Any]]:
        chunks = []
        policy_id = parsed_policy["policy_id"]
        policy_title = parsed_policy["policy_title"]
        effective_date = parsed_policy["effective_date"]
        document_name = parsed_policy["document_name"]

        for sec in parsed_policy["sections"]:
            sec_num = sec["section_number"]
            sec_title = sec["section_title"]

            for clause in sec["clauses"]:
                clause_num = clause["clause_number"]
                clause_title = clause["clause_title"]
                clause_content = clause["content"]

                # Extract concise short passage for visual evidence (first 1-2 sentences)
                sentences = [s.strip() for s in clause_content.replace("\n", " ").split(".") if s.strip()]
                short_passage = ". ".join(sentences[:2]) + ("." if len(sentences) > 0 else "")
                if len(short_passage) > 220:
                    short_passage = short_passage[:217] + "..."

                chunk = {
                    "chunk_id": f"{policy_id}_sec{sec_num}_cl{clause_num.replace('.', '_')}",
                    "policy_id": policy_id,
                    "policy_title": policy_title,
                    "section_number": sec_num,
                    "section_title": sec_title,
                    "clause_number": clause_num,
                    "clause_title": clause_title,
                    "effective_date": effective_date,
                    "document_name": document_name,
                    "content": f"Policy: {policy_title}\nSection {sec_num}: {sec_title}\nClause {clause_num} - {clause_title}\n\n{clause_content}",
                    "raw_clause_text": clause_content,
                    "short_passage": short_passage
                }
                chunks.append(chunk)

        return chunks
