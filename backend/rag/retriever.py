from typing import List, Dict, Any, Tuple
from backend.config import SIMILARITY_THRESHOLD, TOP_K_RETRIEVAL
from backend.rag.vector_store import VectorStore

class PolicyRetriever:
    """
    RAG Retriever that processes queries, executes vector similarity search,
    filters by threshold, and returns relevant grounded policy chunks.
    """

    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def retrieve(self, query: str, policy_filter: str = None, top_k: int = TOP_K_RETRIEVAL) -> Tuple[List[Dict[str, Any]], float]:
        if not query.strip():
            return [], 0.0

        normalized_query = query.strip()
        raw_results = self.vector_store.search(normalized_query, top_k=top_k * 2)

        if not raw_results:
            return [], 0.0

        # Filter by specific policy if requested by UI
        filtered_results = []
        for chunk, score in raw_results:
            if policy_filter and policy_filter.strip():
                if policy_filter.lower() not in chunk["policy_title"].lower() and policy_filter.lower() not in chunk["policy_id"].lower():
                    continue
            filtered_results.append((chunk, score))

        if not filtered_results:
            return [], 0.0

        top_score = filtered_results[0][1]

        # Apply similarity threshold for refusal detection
        if top_score < SIMILARITY_THRESHOLD:
            return [], top_score

        # Select top-k grounded chunks above threshold
        grounded_chunks = []
        for chunk, score in filtered_results[:top_k]:
            if score >= SIMILARITY_THRESHOLD:
                grounded_chunks.append(chunk)

        return grounded_chunks, top_score
