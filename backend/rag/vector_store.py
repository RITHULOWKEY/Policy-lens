import numpy as np
import re
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class VectorStore:
    """
    Lightweight, fast, local vector database for insurance policy chunks.
    Uses TF-IDF + Cosine Similarity with insurance domain synonym expansion
    and title-boost weighting for high precision across direct, paraphrased, multi-clause, and ambiguous queries.
    """

    SYNONYM_MAP = {
        "pocket": "deductible out-of-pocket",
        "crash": "collision accident",
        "luggage": "baggage delay loss",
        "drunk": "alcohol intoxicated narcotics influence",
        "temporary car": "rental vehicle allowance",
        "car": "vehicle automobile",
        "workshop": "repair center garage",
        "theft": "theft stolen comprehensive",
        "glass": "glass repair comprehensive deductible",
        "reported": "notification report timeline hours",
        "doctor": "medical emergency hospital",
        "flight": "trip travel delay",
        "cancel": "cancellation refund"
    }

    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            sublinear_tf=True,
            strip_accents='unicode',
            token_pattern=r'(?u)\b\w+\b'
        )
        self.tfidf_matrix = None
        self.is_indexed = False

    def index_chunks(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        if not chunks:
            self.is_indexed = False
            return

        # Prepare corpus giving extra weight to policy, section, and clause titles
        corpus = []
        for c in chunks:
            weighted_text = (
                f"{c['policy_title']} {c['policy_title']} "
                f"{c['section_title']} {c['section_title']} "
                f"{c['clause_title']} {c['clause_title']} {c['clause_title']} "
                f"Clause {c['clause_number']} "
                f"{c['raw_clause_text']}"
            )
            corpus.append(weighted_text)

        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self.is_indexed = True

    def _expand_query(self, query: str) -> str:
        expanded_parts = [query]
        q_lower = query.lower()
        for term, expansion in self.SYNONYM_MAP.items():
            if term in q_lower:
                expanded_parts.append(expansion)
        return " ".join(expanded_parts)

    def search(self, query: str, top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        if not self.is_indexed or self.tfidf_matrix is None or len(self.chunks) == 0:
            return []

        expanded_query = self._expand_query(query)
        query_vec = self.vectorizer.transform([expanded_query])
        similarities = cosine_similarity(query_vec, self.tfidf_matrix)[0]

        q_words = set(re.findall(r'\b\w+\b', query.lower()))
        
        boosted_scores = np.copy(similarities)
        for i, chunk in enumerate(self.chunks):
            clause_title_words = set(re.findall(r'\b\w+\b', chunk['clause_title'].lower()))
            common = q_words.intersection(clause_title_words)
            
            # Additional domain boosts
            if ('deductible' in q_words or 'pocket' in q_words) and 'deductible' in clause_title_words:
                boosted_scores[i] += 0.30
            elif ('towing' in q_words or 'roadside' in q_words) and ('towing' in clause_title_words or 'roadside' in clause_title_words):
                boosted_scores[i] += 0.30
            elif ('cancel' in q_words or 'refund' in q_words) and 'cancellation' in clause_title_words:
                boosted_scores[i] += 0.30
            elif ('luggage' in q_words or 'baggage' in q_words) and 'baggage' in clause_title_words:
                boosted_scores[i] += 0.30
            elif ('medical' in q_words or 'doctor' in q_words) and 'medical' in clause_title_words:
                boosted_scores[i] += 0.30
            elif ('drunk' in q_words or 'alcohol' in q_words) and ('exclusion' in clause_title_words or 'statutory' in clause_title_words or 'general exclusions' in chunk['section_title'].lower()):
                boosted_scores[i] += 0.30
            elif ('rental' in q_words or 'workshop' in q_words or 'temporary' in q_words) and ('rental' in clause_title_words or 'extension' in clause_title_words):
                boosted_scores[i] += 0.30
            elif ('theft' in q_words or 'glass' in q_words) and ('comprehensive' in clause_title_words or 'deductible' in clause_title_words or 'coverage' in clause_title_words):
                boosted_scores[i] += 0.20
            elif len(common) > 0:
                boosted_scores[i] += 0.10 * len(common)

        top_indices = np.argsort(boosted_scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(boosted_scores[idx])
            results.append((self.chunks[idx], score))

        return results
