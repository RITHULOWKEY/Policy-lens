from typing import Dict, Any, List

class ClauseComparator:
    """
    Compares two selected policy clauses side-by-side, producing structured feature breakdown tables
    and plain-language differences strictly based on the selected clauses.
    """

    @staticmethod
    def compare_clauses(clause_a: Dict[str, Any], clause_b: Dict[str, Any]) -> Dict[str, Any]:
        policy_a_title = clause_a.get("policy_title", "Policy A")
        policy_b_title = clause_b.get("policy_title", "Policy B")
        
        clause_a_num = clause_a.get("clause_number", "")
        clause_b_num = clause_b.get("clause_number", "")
        
        clause_a_title = clause_a.get("clause_title", "")
        clause_b_title = clause_b.get("clause_title", "")

        text_a = clause_a.get("raw_clause_text", "")
        text_b = clause_b.get("raw_clause_text", "")

        # Extract features for comparison table
        table_rows = [
            {
                "feature": "Clause Name & Number",
                "policy_a": f"Clause {clause_a_num} — {clause_a_title}",
                "policy_b": f"Clause {clause_b_num} — {clause_b_title}"
            },
            {
                "feature": "Effective Date",
                "policy_a": clause_a.get("effective_date", "N/A"),
                "policy_b": clause_b.get("effective_date", "N/A")
            }
        ]

        # Financial / deductible comparison if present
        deductible_a = ClauseComparator._extract_keyword_value(text_a, r"deductible of (\$\d+)") or "N/A"
        deductible_b = ClauseComparator._extract_keyword_value(text_b, r"deductible of (\$\d+)") or "N/A"
        if deductible_a != "N/A" or deductible_b != "N/A":
            table_rows.append({
                "feature": "Compulsory Deductible",
                "policy_a": deductible_a,
                "policy_b": deductible_b
            })

        # Notice timeframe comparison if present
        notice_a = ClauseComparator._extract_keyword_value(text_a, r"within (\d+\s+(?:hours|days))") or "N/A"
        notice_b = ClauseComparator._extract_keyword_value(text_b, r"within (\d+\s+(?:hours|days))") or "N/A"
        if notice_a != "N/A" or notice_b != "N/A":
            table_rows.append({
                "feature": "Claim Notification Timeline",
                "policy_a": notice_a,
                "policy_b": notice_b
            })

        # Coverage limits comparison if present
        limit_a = ClauseComparator._extract_keyword_value(text_a, r"up to (\$\d+(?:,\d+)*)") or "N/A"
        limit_b = ClauseComparator._extract_keyword_value(text_b, r"up to (\$\d+(?:,\d+)*)") or "N/A"
        if limit_a != "N/A" or limit_b != "N/A":
            table_rows.append({
                "feature": "Coverage Limit",
                "policy_a": limit_a,
                "policy_b": limit_b
            })

        # Plain language summary of differences
        diff_summary = []
        if deductible_a != "N/A" and deductible_b != "N/A":
            if deductible_a != deductible_b:
                diff_summary.append(f"{policy_a_title} requires a {deductible_a} deductible, whereas {policy_b_title} requires {deductible_b}.")
        
        if notice_a != "N/A" and notice_b != "N/A":
            if notice_a != notice_b:
                diff_summary.append(f"{policy_a_title} requires notification within {notice_a}, while {policy_b_title} allows up to {notice_b}.")

        if not diff_summary:
            diff_summary.append(f"Comparing {clause_a_title} ({policy_a_title}) and {clause_b_title} ({policy_b_title}). Please review the clause passages below for detailed term variations.")

        return {
            "policy_a_name": policy_a_title,
            "policy_b_name": policy_b_title,
            "clause_a": clause_a,
            "clause_b": clause_b,
            "comparison_table": table_rows,
            "plain_language_difference": " ".join(diff_summary)
        }

    @staticmethod
    def _extract_keyword_value(text: str, regex_pattern: str) -> str:
        import re
        match = re.search(regex_pattern, text, re.IGNORECASE)
        return match.group(1) if match else ""
