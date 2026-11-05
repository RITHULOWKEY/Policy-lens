import os
import pytest
from pathlib import Path
from backend.ingestion.parser import PolicyParser
from backend.ingestion.chunker import PolicyChunker
from backend.rag.vector_store import VectorStore
from backend.rag.retriever import PolicyRetriever
from backend.rag.generator import GroundedGenerator
from backend.database.db import init_db, save_feedback, get_all_feedback

@pytest.fixture(scope="module")
def setup_rag():
    init_db()
    data_dir = Path(__file__).resolve().parent.parent.parent / "data" / "policies"
    chunks = []
    for policy_file in data_dir.glob("*.txt"):
        parsed = PolicyParser.parse_policy_file(policy_file)
        c_list = PolicyChunker.create_chunks_from_parsed_policy(parsed)
        chunks.extend(c_list)
    
    vs = VectorStore()
    vs.index_chunks(chunks)
    retriever = PolicyRetriever(vs)
    return retriever

def test_direct_query_retrieval(setup_rag):
    retriever = setup_rag
    query = "What is the collision deductible under SecureDrive?"
    chunks, score = retriever.retrieve(query)
    
    assert len(chunks) > 0
    assert "SecureDrive" in chunks[0]["policy_title"]
    assert "4.2" in chunks[0]["clause_number"] or "Deductible" in chunks[0]["clause_title"]

def test_grounded_answer_generation(setup_rag):
    retriever = setup_rag
    query = "What is the collision deductible under SecureDrive?"
    chunks, score = retriever.retrieve(query)
    answer = GroundedGenerator.generate_answer(query, chunks, score)
    
    assert answer["grounded"] is True
    assert "$500" in answer["answer"]
    assert len(answer["sources"]) > 0
    assert answer["sources"][0]["policy_title"] == "SecureDrive Motor Insurance"

def test_unsupported_question_refusal(setup_rag):
    retriever = setup_rag
    query = "Does the policy cover damage caused by a volcanic eruption?"
    chunks, score = retriever.retrieve(query)
    answer = GroundedGenerator.generate_answer(query, chunks, score)
    
    assert answer["grounded"] is False
    assert answer["answer"] == "Not found in the provided policy."
    assert len(answer["sources"]) == 0

def test_feedback_storage():
    fb = save_feedback("What is deductible?", "It is $500.", "SecureDrive Clause 4.2", "helpful")
    assert fb["id"] is not None
    all_fb = get_all_feedback()
    assert len(all_fb) > 0
    assert all_fb[0]["rating"] == "helpful"
