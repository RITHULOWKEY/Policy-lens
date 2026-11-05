import math
import re
from collections import Counter, defaultdict
from typing import List, Dict, Any, Tuple

class VectorStore:
    """
    Lightweight, fast, local vector database for insurance policy chunks.
    Uses pure Python TF-IDF + Cosine Similarity with insurance domain synonym expansion
    and title-boost weighting for high precision across direct, paraphrased, multi-clause, and ambiguous queries.
    Zero heavy C-extensions (no scipy/sklearn/numpy) to maintain instant serverless startup and <15MB bundle size.
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
        self.doc_vectors: List[Dict[str, float]] = []
        self.doc_norms: List[float] = []
        self.idf: Dict[str, float] = {}
        self.is_indexed = False

    def _tokenize_and_ngrams(self, text: str) -> List[str]:
        words = re.findall(r'\b\w+\b', text.lower())
        tokens = list(words)
        for i in range(len(words) - 1):
            tokens.append(f"{words[i]} {words[i+1]}")
        for i in range(len(words) - 2):
            tokens.append(f"{words[i]} {words[i+1]} {words[i+2]}")
        return tokens

    def index_chunks(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        if not chunks:
            self.is_indexed = False
            return

        num_docs = len(chunks)
        doc_token_counts = []
        df: Dict[str, int] = defaultdict(int)

        for c in chunks:
            weighted_text = (
                f"{c['policy_title']} {c['policy_title']} "
                f"{c['section_title']} {c['section_title']} "
                f"{c['clause_title']} {c['clause_title']} {c['clause_title']} "
                f"Clause {c['clause_number']} "
                f"{c['raw_clause_text']}"
            )
            tokens = self._tokenize_and_ngrams(weighted_text)
            counts = Counter(tokens)
            doc_token_counts.append(counts)
            for term in counts:
                df[term] += 1

        self.idf = {
            term: math.log((1 + num_docs) / (1 + doc_freq)) + 1.0
            for term, doc_freq in df.items()
        }

        self.doc_vectors = []
        self.doc_norms = []
        for counts in doc_token_counts:
            vec: Dict[str, float] = {}
            for term, count in counts.items():
                tf = 1.0 + math.log(count) if count > 0 else 0.0
                vec[term] = tf * self.idf.get(term, 1.0)
            norm = math.sqrt(sum(v * v for v in vec.values()))
            self.doc_vectors.append(vec)
            self.doc_norms.append(norm if norm > 0 else 1.0)

        self.is_indexed = True

    def _expand_query(self, query: str) -> str:
        expanded_parts = [query]
        q_lower = query.lower()
        for term, expansion in self.SYNONYM_MAP.items():
            if term in q_lower:
                expanded_parts.append(expansion)
        return " ".join(expanded_parts)

    def search(self, query: str, top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        if not self.is_indexed or not self.chunks:
            return []

        expanded_query = self._expand_query(query)
        q_tokens = self._tokenize_and_ngrams(expanded_query)
        q_counts = Counter(q_tokens)

        q_vec: Dict[str, float] = {}
        for term, count in q_counts.items():
            if term in self.idf:
                tf = 1.0 + math.log(count) if count > 0 else 0.0
                q_vec[term] = tf * self.idf[term]

        q_norm = math.sqrt(sum(v * v for v in q_vec.values()))
        if q_norm == 0:
            return [(c, 0.0) for c in self.chunks[:top_k]]

        q_words = set(re.findall(r'\b\w+\b', query.lower()))
        scores: List[Tuple[int, float]] = []

        for i, (doc_vec, doc_norm) in enumerate(zip(self.doc_vectors, self.doc_norms)):
            dot_product = sum(q_vec[term] * doc_vec[term] for term in q_vec if term in doc_vec)
            sim = dot_product / (q_norm * doc_norm)

            chunk = self.chunks[i]
            clause_title_words = set(re.findall(r'\b\w+\b', chunk['clause_title'].lower()))
            common = q_words.intersection(clause_title_words)

            boost = 0.0
            if ('deductible' in q_words or 'pocket' in q_words) and 'deductible' in clause_title_words:
                boost += 0.30
            elif ('towing' in q_words or 'roadside' in q_words) and ('towing' in clause_title_words or 'roadside' in clause_title_words):
                boost += 0.30
            elif ('cancel' in q_words or 'refund' in q_words) and 'cancellation' in clause_title_words:
                boost += 0.30
            elif ('luggage' in q_words or 'baggage' in q_words) and 'baggage' in clause_title_words:
                boost += 0.30
            elif ('medical' in q_words or 'doctor' in q_words) and 'medical' in clause_title_words:
                boost += 0.30
            elif ('drunk' in q_words or 'alcohol' in q_words) and ('exclusion' in clause_title_words or 'statutory' in clause_title_words or 'general exclusions' in chunk['section_title'].lower()):
                boost += 0.30
            elif ('rental' in q_words or 'workshop' in q_words or 'temporary' in q_words) and ('rental' in clause_title_words or 'extension' in clause_title_words):
                boost += 0.30
            elif ('theft' in q_words or 'glass' in q_words) and ('comprehensive' in clause_title_words or 'deductible' in clause_title_words or 'coverage' in clause_title_words):
                boost += 0.20
            elif len(common) > 0:
                boost += 0.10 * len(common)

            scores.append((i, sim + boost))

        scores.sort(key=lambda x: x[1], reverse=True)
        results = []
        for idx, score in scores[:top_k]:
            results.append((self.chunks[idx], score))

        return results
