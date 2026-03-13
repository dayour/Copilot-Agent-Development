"""
keyword_match.py

KeywordMatchGrader for the cross-vertical evaluation framework.

Grades an agent response by checking what fraction of a required keyword list
appears in the response (case-insensitive).  The score is the ratio of matched
keywords to the total keyword list length, suitable for use as a 0-1 float or
scaled to the 1-5 dimension scale.

Usage:
    from evals.graders.keyword_match import KeywordMatchGrader

    grader = KeywordMatchGrader()
    result = grader.score(
        response="The espresso shot is pulled at 9 bars of pressure.",
        keywords=["espresso", "pressure", "milk"],
    )
    # {"score": 0.667, "dimension": "keyword_match", "matched": [...], "missing": [...]}
"""

import re


class KeywordMatchGrader:
    """Grades agent responses by measuring keyword coverage.

    Each keyword is searched as a whole-word match (case-insensitive) inside
    the response text.  Multi-word keywords are matched as literal substrings.
    """

    DIMENSION = "keyword_match"

    def _normalize(self, text: str) -> str:
        """Return a lowercase version of text for matching."""
        return text.lower()

    def _keyword_present(self, keyword: str, normalized_response: str) -> bool:
        """Return True if keyword appears as a whole word (or phrase) in the response.

        Single-word keywords use word-boundary anchors.  Multi-word keywords are
        matched as literal substrings after normalization, because inter-word
        boundaries are already constrained by the spaces in the phrase.
        """
        kw = keyword.lower().strip()
        if not kw:
            return False
        if " " in kw:
            return kw in normalized_response
        pattern = r"\b" + re.escape(kw) + r"\b"
        return bool(re.search(pattern, normalized_response))

    def score(self, response: str, keywords: list) -> dict:
        """Compute keyword coverage of the response.

        Parameters
        ----------
        response:
            The agent response string to evaluate.
        keywords:
            List of keyword strings that should appear in the response.

        Returns
        -------
        dict with keys:
            score      -- fraction of keywords found (0.0 to 1.0)
            dimension  -- always "keyword_match"
            matched    -- list of keywords that were found
            missing    -- list of keywords that were not found
        """
        if not keywords:
            return {
                "score": 1.0,
                "dimension": self.DIMENSION,
                "matched": [],
                "missing": [],
            }

        norm_response = self._normalize(response)
        matched = []
        missing = []

        for kw in keywords:
            if self._keyword_present(kw, norm_response):
                matched.append(kw)
            else:
                missing.append(kw)

        score = len(matched) / len(keywords)
        return {
            "score": round(score, 4),
            "dimension": self.DIMENSION,
            "matched": matched,
            "missing": missing,
        }
