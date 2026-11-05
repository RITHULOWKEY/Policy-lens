import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.config import POLICIES_DIR, EVALUATION_DATASET_PATH
from backend.ingestion.parser import PolicyParser
from backend.ingestion.chunker import PolicyChunker
from backend.rag.vector_store import VectorStore
from backend.rag.retriever import PolicyRetriever
from backend.rag.generator import GroundedGenerator
from backend.rag.comparator import ClauseComparator
from backend.database import db

router = APIRouter()

# Global in-memory RAG instances initialized on app startup
vector_store = VectorStore()
retriever = PolicyRetriever(vector_store)
indexed_policies: List[Dict[str, Any]] = []
indexed_chunks: List[Dict[str, Any]] = []
questions_answered_counter = 0

def load_and_index_policies():
    global indexed_policies, indexed_chunks, vector_store, retriever
    indexed_policies.clear()
    indexed_chunks.clear()

    if not POLICIES_DIR.exists():
        return

    for policy_file in POLICIES_DIR.glob("*.txt"):
        parsed = PolicyParser.parse_policy_file(policy_file)
        chunks = PolicyChunker.create_chunks_from_parsed_policy(parsed)
        
        parsed["chunk_count"] = len(chunks)
        parsed["section_count"] = len(parsed["sections"])
        indexed_policies.append(parsed)
        indexed_chunks.extend(chunks)

    vector_store.index_chunks(indexed_chunks)

# Pydantic Schemas
class ChatRequest(BaseModel):
    query: str
    policy_filter: Optional[str] = None

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    source: Optional[str] = ""
    rating: str  # 'helpful' or 'not_helpful'

class CompareRequest(BaseModel):
    policy_a_id: str
    clause_a_num: str
    policy_b_id: str
    clause_b_num: str

# API Endpoints

@router.get("/stats")
def get_stats():
    feedback_count = db.get_feedback_count()
    return {
        "policies_indexed": len(indexed_policies),
        "clauses_indexed": len(indexed_chunks),
        "questions_answered": questions_answered_counter,
        "feedback_received": feedback_count
    }

@router.get("/policies")
def get_policies():
    # Return policy summaries
    summaries = []
    for p in indexed_policies:
        summaries.append({
            "policy_id": p["policy_id"],
            "policy_title": p["policy_title"],
            "policy_number": p["policy_number"],
            "effective_date": p["effective_date"],
            "document_name": p["document_name"],
            "section_count": p["section_count"],
            "chunk_count": p["chunk_count"],
            "status": "Ready"
        })
    return {"policies": summaries}

@router.get("/policies/{policy_id}")
def get_policy_detail(policy_id: str):
    for p in indexed_policies:
        if p["policy_id"] == policy_id:
            return p
    raise HTTPException(status_code=404, detail="Policy not found")

@router.post("/chat")
def chat(req: ChatRequest):
    global questions_answered_counter
    questions_answered_counter += 1

    if not indexed_chunks:
        return {
            "answer": "No policy documents have been indexed yet.",
            "grounded": False,
            "sources": []
        }

    chunks, top_score = retriever.retrieve(req.query, policy_filter=req.policy_filter)
    response = GroundedGenerator.generate_answer(req.query, chunks, top_score)
    return response

@router.post("/compare")
def compare(req: CompareRequest):
    chunk_a = None
    chunk_b = None

    for c in indexed_chunks:
        if c["policy_id"] == req.policy_a_id and c["clause_number"] == req.clause_a_num:
            chunk_a = c
        if c["policy_id"] == req.policy_b_id and c["clause_number"] == req.clause_b_num:
            chunk_b = c

    if not chunk_a or not chunk_b:
        raise HTTPException(status_code=400, detail="Selected clauses not found in index")

    comparison_result = ClauseComparator.compare_clauses(chunk_a, chunk_b)
    return comparison_result

@router.post("/feedback")
def record_feedback(req: FeedbackRequest):
    res = db.save_feedback(req.question, req.answer, req.source, req.rating)
    return {"status": "success", "message": "Thanks — your feedback has been recorded.", "data": res}

@router.get("/feedback")
def list_feedback():
    feedback_items = db.get_all_feedback()
    return {"feedback": feedback_items}

@router.post("/evaluate")
def run_evaluation():
    if not EVALUATION_DATASET_PATH.exists():
        raise HTTPException(status_code=404, detail="Evaluation dataset file not found")

    with open(EVALUATION_DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    total_questions = len(dataset)
    grounded_count = 0
    declined_count = 0
    correct_attribution_count = 0
    results = []

    for item in dataset:
        q_id = item["id"]
        q_text = item["question"]
        is_answerable = item["answerable"]
        expected_policy = item["expected_policy"]
        expected_clause = item["expected_clause"]

        # Run retriever & generator
        chunks, top_score = retriever.retrieve(q_text)
        gen_res = GroundedGenerator.generate_answer(q_text, chunks, top_score)

        is_grounded = gen_res["grounded"]
        answer = gen_res["answer"]
        sources = gen_res["sources"]

        passed = False
        status_note = ""

        if is_answerable:
            if is_grounded:
                grounded_count += 1
                # Check source match
                if sources and (expected_clause in sources[0]["clause"] or expected_policy in sources[0]["policy_title"]):
                    correct_attribution_count += 1
                passed = True
                status_note = "Correctly Grounded Answer"
            else:
                passed = False
                status_note = "Failed: Expected grounded answer but got refusal"
        else:
            if not is_grounded and answer == "Not found in the provided policy.":
                declined_count += 1
                passed = True
                status_note = "Correctly Declined Unsupported Question"
            else:
                passed = False
                status_note = "Failed: Answered unanswerable question"

        results.append({
            "id": q_id,
            "category": item["category"],
            "question": q_text,
            "answerable": is_answerable,
            "expected_policy": expected_policy,
            "expected_clause": expected_clause,
            "answer": answer,
            "grounded": is_grounded,
            "passed": passed,
            "status_note": status_note,
            "sources": sources
        })

    accuracy_score = round(((grounded_count + declined_count) / total_questions) * 100, 1)

    db.save_evaluation_run(total_questions, grounded_count, declined_count, accuracy_score, results)

    return {
        "total_questions": total_questions,
        "grounded_count": grounded_count,
        "declined_count": declined_count,
        "source_attribution_accuracy": round((correct_attribution_count / max(grounded_count, 1)) * 100, 1),
        "accuracy_score": accuracy_score,
        "results": results
    }

@router.get("/glossary")
def get_glossary():
    terms = [
        {
            "term": "Deductible",
            "definition": "The specific out-of-pocket amount you must pay toward a covered loss before the insurer pays the remaining claim balance.",
            "category": "Financial"
        },
        {
            "term": "Exclusion",
            "definition": "A specific condition, situation, peril, or type of damage that is explicitly not covered by the insurance policy.",
            "category": "Coverage"
        },
        {
            "term": "Waiting Period",
            "definition": "A designated period of time after policy issuance during which certain coverage benefits are not yet active.",
            "category": "Policy Terms"
        },
        {
            "term": "Claim Notification Timeline",
            "definition": "The mandatory maximum time window within which an accident or loss must be formally reported to the insurer.",
            "category": "Claims"
        },
        {
            "term": "Third-Party Liability",
            "definition": "Legal and financial responsibility coverage for accidental bodily injury, death, or property damage caused to another person.",
            "category": "Liability"
        },
        {
            "term": "Constructive Total Loss",
            "definition": "A loss condition where the estimated repair cost of the insured asset exceeds a specified percentage (usually 75%) of its market value.",
            "category": "Claims"
        },
        {
            "term": "Pro-Rata Refund",
            "definition": "A proportional refund of unearned insurance premium calculated for the exact remaining days left in the policy term upon cancellation.",
            "category": "Financial"
        },
        {
            "term": "Pre-Existing Condition",
            "definition": "A medical condition, illness, or injury for which diagnosis or treatment was received prior to the policy start date.",
            "category": "Travel / Health"
        }
    ]
    return {"terms": terms}
