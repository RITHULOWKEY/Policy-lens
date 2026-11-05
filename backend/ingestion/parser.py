import re
from pathlib import Path
from typing import List, Dict, Any

class PolicyParser:
    """
    Parses plain-text fictional policy documents into structured section & clause objects,
    preserving policy metadata (title, effective date, section numbers, clause numbers, titles).
    """

    @staticmethod
    def parse_policy_file(filepath: Path) -> Dict[str, Any]:
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        filename = filepath.name
        
        # Extract header metadata
        policy_title = "Insurance Policy"
        policy_number = ""
        effective_date = ""

        header_lines = text.split("\n\n")[0].split("\n")
        for line in header_lines:
            line_clean = line.strip("= ").strip()
            if "POLICY" in line_clean.upper():
                policy_title = line_clean
            elif "Policy Number:" in line:
                policy_number = line.split("Policy Number:")[1].strip()
            elif "Effective Date:" in line:
                effective_date = line.split("Effective Date:")[1].strip()

        # Fallback title if header didn't catch clean name
        if "SECUREDRIVE" in text.upper():
            policy_title = "SecureDrive Motor Insurance"
        elif "ROADGUARD" in text.upper():
            policy_title = "RoadGuard Motor Insurance"
        elif "TRAVELSHIELD" in text.upper():
            policy_title = "TravelShield International Travel Insurance"

        # Policy ID mapping
        policy_id = filename.replace(".txt", "")

        # Section and clause parsing regex patterns
        # Sections look like: "1. GENERAL INFORMATION & DEFINITIONS"
        # Clauses look like: "1.1 Policy Effective Date & Scope"
        sections = []
        current_section = None
        current_clause = None

        lines = text.split("\n")
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip decorative headers
            if not line or line.startswith("===") or "Policy Number:" in line or "Effective Date:" in line or "Document Type:" in line:
                i += 1
                continue

            # Section Header Match (e.g. "1. GENERAL INFORMATION", "2. COVERAGE")
            sec_match = re.match(r"^(\d+)\.\s+([A-Z0-9\s&,/\-]+)$", line)
            if sec_match:
                sec_num = sec_match.group(1)
                sec_title = sec_match.group(2).strip()
                current_section = {
                    "section_number": sec_num,
                    "section_title": sec_title,
                    "clauses": []
                }
                sections.append(current_section)
                current_clause = None
                i += 1
                continue

            # Clause Match (e.g. "1.1 Policy Effective Date", "2.3 Third-Party Property")
            clause_match = re.match(r"^(\d+\.\d+)\s+(.+)$", line)
            if clause_match:
                clause_num = clause_match.group(1)
                clause_title = clause_match.group(2).strip()
                
                # Read content lines until next clause or section
                content_lines = []
                i += 1
                while i < len(lines):
                    next_line = lines[i].strip()
                    if not next_line:
                        content_lines.append("")
                        i += 1
                        continue
                    if re.match(r"^(\d+)\.\s+[A-Z0-9\s&,/\-]+$", next_line) or re.match(r"^(\d+\.\d+)\s+.+$", next_line):
                        break
                    content_lines.append(lines[i])
                    i += 1

                clause_content = "\n".join(content_lines).strip()
                
                sec_num = current_section["section_number"] if current_section else clause_num.split(".")[0]
                sec_title = current_section["section_title"] if current_section else "General"

                clause_obj = {
                    "clause_number": clause_num,
                    "clause_title": clause_title,
                    "section_number": sec_num,
                    "section_title": sec_title,
                    "content": clause_content
                }
                
                if current_section:
                    current_section["clauses"].append(clause_obj)
                else:
                    sections.append({
                        "section_number": sec_num,
                        "section_title": sec_title,
                        "clauses": [clause_obj]
                    })
                continue

            i += 1

        return {
            "policy_id": policy_id,
            "policy_title": policy_title,
            "policy_number": policy_number,
            "effective_date": effective_date,
            "document_name": filename,
            "sections": sections
        }
