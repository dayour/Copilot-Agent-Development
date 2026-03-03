"""
exact_match.py

ExactMatchGrader for the cross-vertical evaluation framework.

Grades an agent response by comparing it character-for-character against an
expected string after normalizing whitespace and case.  Returns a binary score
of 1.0 (pass) or 0.0 (fail).

Usage:
    from evals.graders.exact_match import ExactMatchGrader

    grader = ExactMatchGrader()
    result = grader.score(response="Hello world", expected="hello world")
    # {"score": 1.0, "dimension": "exact_match", "details": "..."}
"""

import re


class ExactMatchGrader:
    """Grades agent responses using normalized exact-string comparison.

    Normalization steps applied to both response and expected strings before
    comparison:
      - Convert to lowercase
      - Collapse all whitespace sequences (spaces, tabs, newlines) to a single
        space
      - Strip leading and trailing whitespace
    """

    DIMENSION = "exact_match"

    def _normalize(self, text: str) -> str:
        """Return a lowercase, whitespace-collapsed version of text."""
        text = text.lower()
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def score(self, response: str, expected: str) -> dict:
        """Compare response to expected after normalization.

        Parameters
        ----------
        response:
            The agent response string to evaluate.
        expected:
            The ground-truth string to compare against.

        Returns
        -------
        dict with keys:
            score      -- 1.0 if normalized strings match, 0.0 otherwise
            dimension  -- always "exact_match"
            details    -- human-readable explanation of the result
        """
        norm_response = self._normalize(response)
        norm_expected = self._normalize(expected)

        if norm_response == norm_expected:
            return {
                "score": 1.0,
                "dimension": self.DIMENSION,
                "details": "Response matches expected output after normalization.",
            }

        # Produce a brief diff hint to help with debugging failures
        resp_preview = norm_response[:120]
        exp_preview = norm_expected[:120]
        details = (
            f"Mismatch. Response (normalized, truncated): '{resp_preview}' | "
            f"Expected (normalized, truncated): '{exp_preview}'"
        )
        return {
            "score": 0.0,
            "dimension": self.DIMENSION,
            "details": details,
        }
