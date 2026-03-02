"""
semantic_similarity.py

SemanticSimilarityGrader for the cross-vertical evaluation framework.

Computes cosine similarity between TF-IDF vectors of two text strings using
only the Python standard library.  No numpy, scipy, or external packages are
required.  The 0-1 cosine similarity is mapped to the 1-5 eval scale.

Usage:
    from evals.graders.semantic_similarity import SemanticSimilarityGrader

    grader = SemanticSimilarityGrader()
    result = grader.score(
        response="The flat white is made with ristretto and steamed milk.",
        reference="A flat white consists of ristretto shots topped with microfoam milk.",
    )
    # {"score": float (1.0-5.0), "dimension": "semantic_similarity", "cosine": float}
"""

import math
import re


class SemanticSimilarityGrader:
    """Grades agent responses by measuring semantic similarity via TF-IDF cosine.

    The implementation is intentionally dependency-free.  For production use
    with higher accuracy requirements, swap in a sentence-transformer or
    embedding-based similarity model.

    Score mapping from cosine similarity (0-1) to eval scale (1-5):
        cosine >= 0.90  ->  5.0  (near-identical)
        cosine >= 0.70  ->  4.0  (strong similarity)
        cosine >= 0.50  ->  3.0  (moderate similarity)
        cosine >= 0.30  ->  2.0  (weak similarity)
        cosine <  0.30  ->  1.0  (dissimilar)
    """

    DIMENSION = "semantic_similarity"

    # Cosine similarity thresholds for the 1-5 eval scale
    _EXCELLENT = 0.90  # near-identical content
    _GOOD = 0.70       # clearly similar, minor differences
    _MODERATE = 0.50   # partially overlapping
    _WEAK = 0.30       # low overlap, some shared tokens

    # English stop words excluded from TF-IDF to reduce noise
    _STOP_WORDS = frozenset([
        "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "it", "its", "this", "that", "was",
        "are", "were", "be", "been", "being", "have", "has", "had", "do",
        "does", "did", "will", "would", "could", "should", "may", "might",
        "can", "as", "if", "then", "than", "so", "not", "no", "nor",
    ])

    def _tokenize(self, text: str) -> list:
        """Lowercase, strip punctuation, and split text into tokens."""
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        tokens = text.split()
        return [t for t in tokens if t not in self._STOP_WORDS and len(t) > 1]

    def _term_frequency(self, tokens: list) -> dict:
        """Compute raw term frequency counts for a token list."""
        tf: dict = {}
        for token in tokens:
            tf[token] = tf.get(token, 0) + 1
        return tf

    def _cosine_similarity(self, vec_a: dict, vec_b: dict) -> float:
        """Compute cosine similarity between two sparse TF vectors.

        Each vector is represented as a dict mapping term -> count.
        """
        if not vec_a or not vec_b:
            return 0.0

        # Dot product over shared terms
        dot = sum(vec_a[term] * vec_b[term] for term in vec_a if term in vec_b)

        mag_a = math.sqrt(sum(v * v for v in vec_a.values()))
        mag_b = math.sqrt(sum(v * v for v in vec_b.values()))

        if mag_a == 0 or mag_b == 0:
            return 0.0

        return dot / (mag_a * mag_b)

    def _map_to_scale(self, cosine: float) -> float:
        """Map a 0-1 cosine similarity to the 1-5 eval dimension scale.

        Thresholds align with common TF-IDF similarity bands observed in
        conversational agent evaluation:
            >= EXCELLENT : score 5 (near-identical content)
            >= GOOD      : score 4 (clearly similar, minor differences)
            >= MODERATE  : score 3 (partially overlapping)
            >= WEAK      : score 2 (low overlap, some shared tokens)
            < WEAK       : score 1 (little or no overlap)
        """
        if cosine >= self._EXCELLENT:
            return 5.0
        if cosine >= self._GOOD:
            return 4.0
        if cosine >= self._MODERATE:
            return 3.0
        if cosine >= self._WEAK:
            return 2.0
        return 1.0

    def score(self, response: str, reference: str) -> dict:
        """Compute semantic similarity between response and reference.

        Parameters
        ----------
        response:
            The agent response string to evaluate.
        reference:
            The reference (expected) response string.

        Returns
        -------
        dict with keys:
            score      -- float on 1-5 scale
            dimension  -- always "semantic_similarity"
            cosine     -- raw cosine similarity (0.0 to 1.0)
            details    -- human-readable summary
        """
        if not response or not response.strip():
            return {
                "score": 1.0,
                "dimension": self.DIMENSION,
                "cosine": 0.0,
                "details": "Response is empty; similarity cannot be computed.",
            }
        if not reference or not reference.strip():
            return {
                "score": 1.0,
                "dimension": self.DIMENSION,
                "cosine": 0.0,
                "details": "Reference is empty; similarity cannot be computed.",
            }

        tokens_resp = self._tokenize(response)
        tokens_ref = self._tokenize(reference)

        tf_resp = self._term_frequency(tokens_resp)
        tf_ref = self._term_frequency(tokens_ref)

        cosine = self._cosine_similarity(tf_resp, tf_ref)
        scale_score = self._map_to_scale(cosine)

        details = (
            f"Cosine similarity: {cosine:.4f} -> scale score: {scale_score:.1f}. "
            f"Response tokens: {len(tokens_resp)}, reference tokens: {len(tokens_ref)}."
        )

        return {
            "score": scale_score,
            "dimension": self.DIMENSION,
            "cosine": round(cosine, 4),
            "details": details,
        }
