#!/usr/bin/env python3
"""
runner.py

Cross-vertical evaluation runner for the Copilot Agent Development repository.

Loads test cases from a YAML test set file, dispatches each case to a deployed
Copilot Studio agent via the Bot Framework Direct Line API v3, grades the
response using the configured grader, and produces a score report.

Usage:
    python3 evals/runner.py --test-set evals/test-sets/coffee/virtual-coach/test-cases.yaml
                            [--vertical VERTICAL] [--agent AGENT] [--tier TIER]
                            [--output {table,json}]
                            [--judge-model {gpt-4o,claude-sonnet-4-5,consensus}]
                            [--direct-line-secret ENV_VAR_NAME]
                            [--dry-run]

Exit codes:
    0  All evaluated test cases passed
    1  One or more test cases failed
    2  Configuration or argument error
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field, asdict
from typing import Optional

try:
    import yaml
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DIRECT_LINE_BASE = "https://directline.botframework.com/v3/directline"

# Seconds to wait for the agent to respond after sending an activity
RESPONSE_POLL_INTERVAL = 1.0
RESPONSE_POLL_MAX_ATTEMPTS = 20

# Tier pass-rate thresholds (fraction of test cases that must pass)
TIER_PASS_RATES = {
    "critical": 1.0,
    "functional": 0.70,
    "integration": 0.80,
    "conversational": 0.60,
    "regression": 0.70,
}

GRADER_NAMES = ("exact_match", "keyword_match", "llm_judge", "safety_check", "semantic_similarity")
JUDGE_MODELS = ("gpt-4o", "claude-sonnet-4-5", "consensus")


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class TestCase:
    id: str
    tier: str
    query: str
    grader: str
    pass_threshold: float
    description: str = ""
    expected_keywords: list = field(default_factory=list)
    expected_response: str = ""
    context: str = ""
    dimensions: list = field(default_factory=list)
    # Optional metadata
    vertical: str = ""
    agent: str = ""


@dataclass
class EvalResult:
    test_case_id: str
    tier: str
    query: str
    grader: str
    response: str
    score: float
    pass_threshold: float
    passed: bool
    details: dict = field(default_factory=dict)
    error: str = ""


# ---------------------------------------------------------------------------
# Test set loading
# ---------------------------------------------------------------------------

def _load_yaml(path: str) -> list:
    """Load a YAML test set file and return the list of raw test case dicts."""
    if not _YAML_AVAILABLE:
        print(
            "Error: PyYAML is required to load test set files. "
            "Install with: pip install pyyaml",
            file=sys.stderr,
        )
        sys.exit(2)
    if not os.path.isfile(path):
        print(f"Error: test set file not found: {path}", file=sys.stderr)
        sys.exit(2)
    with open(path, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, list):
        print(
            f"Error: test set file must contain a YAML list at the top level: {path}",
            file=sys.stderr,
        )
        sys.exit(2)
    return data


def load_test_cases(
    path: str,
    vertical_filter: Optional[str],
    agent_filter: Optional[str],
    tier_filter: Optional[str],
) -> list:
    """Load and filter test cases from a YAML file."""
    raw = _load_yaml(path)
    cases = []
    for item in raw:
        tc = TestCase(
            id=item.get("id", ""),
            tier=item.get("tier", ""),
            query=item.get("query", ""),
            grader=item.get("grader", "keyword_match"),
            pass_threshold=float(item.get("pass_threshold", 0.7)),
            description=item.get("description", ""),
            expected_keywords=item.get("expected_keywords", []),
            expected_response=item.get("expected_response", ""),
            context=item.get("context", ""),
            dimensions=item.get("dimensions", []),
            vertical=item.get("vertical", ""),
            agent=item.get("agent", ""),
        )
        if vertical_filter and tc.vertical and tc.vertical != vertical_filter:
            continue
        if agent_filter and tc.agent and tc.agent != agent_filter:
            continue
        if tier_filter and tc.tier != tier_filter:
            continue
        cases.append(tc)
    return cases


# ---------------------------------------------------------------------------
# Direct Line API client
# ---------------------------------------------------------------------------

class DirectLineClient:
    """Thin client for the Bot Framework Direct Line API v3.

    Starts a conversation, sends a message activity, polls for the bot reply,
    and returns the reply text.
    """

    def __init__(self, secret: str, timeout: int = 30):
        self._secret = secret
        self._timeout = timeout

    def _auth_header(self) -> dict:
        return {"Authorization": f"Bearer {self._secret}"}

    def _request(self, method: str, url: str, body: Optional[dict] = None) -> dict:
        """Execute an HTTP request against the Direct Line API."""
        headers = {**self._auth_header(), "Content-Type": "application/json"}
        data = json.dumps(body).encode("utf-8") if body else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            error_body = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Direct Line HTTP {exc.code} on {method} {url}: {error_body}"
            ) from exc
        except urllib.error.URLError as exc:
            raise RuntimeError(
                f"Direct Line connection error on {method} {url}: {exc.reason}"
            ) from exc

    def start_conversation(self) -> str:
        """Start a new Direct Line conversation and return the conversation ID."""
        result = self._request("POST", f"{DIRECT_LINE_BASE}/conversations")
        return result["conversationId"]

    def send_activity(self, conversation_id: str, text: str) -> str:
        """Send a user message activity and return the watermark before sending."""
        # Get current watermark before sending so we can poll only for new activities
        try:
            activities = self._request(
                "GET",
                f"{DIRECT_LINE_BASE}/conversations/{conversation_id}/activities",
            )
            watermark = activities.get("watermark", "")
        except (RuntimeError, OSError):
            # Pre-send watermark fetch is best-effort; failure is non-fatal
            watermark = ""

        self._request(
            "POST",
            f"{DIRECT_LINE_BASE}/conversations/{conversation_id}/activities",
            body={
                "type": "message",
                "from": {"id": "eval-runner"},
                "text": text,
            },
        )
        return watermark

    def poll_response(self, conversation_id: str, watermark: str) -> str:
        """Poll for a bot reply after the watermark and return its text.

        Waits up to RESPONSE_POLL_MAX_ATTEMPTS * RESPONSE_POLL_INTERVAL seconds.
        """
        for _ in range(RESPONSE_POLL_MAX_ATTEMPTS):
            time.sleep(RESPONSE_POLL_INTERVAL)
            url = f"{DIRECT_LINE_BASE}/conversations/{conversation_id}/activities"
            if watermark:
                url += f"?watermark={watermark}"
            result = self._request("GET", url)
            activities = result.get("activities", [])
            for activity in activities:
                if (
                    activity.get("type") == "message"
                    and activity.get("from", {}).get("id") != "eval-runner"
                ):
                    return activity.get("text", "")
        return ""

    def send_and_receive(self, conversation_id: str, text: str) -> str:
        """Send a message and return the bot's reply text."""
        watermark = self.send_activity(conversation_id, text)
        return self.poll_response(conversation_id, watermark)


# ---------------------------------------------------------------------------
# Grading
# ---------------------------------------------------------------------------

def _import_graders():
    """Lazily import grader classes to avoid circular-import issues at module load."""
    # Adjust sys.path so that the repo root is importable
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    from evals.graders.exact_match import ExactMatchGrader
    from evals.graders.keyword_match import KeywordMatchGrader
    from evals.graders.llm_judge import LLMJudgeGrader
    from evals.graders.safety_check import SafetyCheckGrader
    from evals.graders.semantic_similarity import SemanticSimilarityGrader

    return {
        "exact_match": ExactMatchGrader(),
        "keyword_match": KeywordMatchGrader(),
        "llm_judge": LLMJudgeGrader(),
        "safety_check": SafetyCheckGrader(),
        "semantic_similarity": SemanticSimilarityGrader(),
    }


def grade(tc: TestCase, response: str, graders: dict, judge_model: str) -> dict:
    """Grade a response using the grader configured in the test case.

    Returns a dict containing at minimum a "score" key (0.0-1.0 or 1.0-5.0
    depending on grader) and any additional metadata produced by the grader.
    """
    name = tc.grader

    if name == "exact_match":
        return graders["exact_match"].score(response, tc.expected_response)

    if name == "keyword_match":
        return graders["keyword_match"].score(response, tc.expected_keywords)

    if name == "safety_check":
        return graders["safety_check"].score(response)

    if name == "semantic_similarity":
        return graders["semantic_similarity"].score(response, tc.expected_response)

    if name == "llm_judge":
        dimensions = tc.dimensions or ["groundedness", "completeness", "relevance", "safety", "tone"]
        grader = graders["llm_judge"]
        if judge_model == "consensus":
            result = grader.consensus_score(response, tc.query, tc.context, dimensions)
        else:
            result = grader.score(response, tc.query, tc.context, dimensions, judge_model)
        # Normalize weighted_score to 0-1 range (it comes back on 1-5 scale)
        ws = result.get("weighted_score", 0)
        result["score"] = (ws - 1) / 4  # map 1-5 to 0-1
        return result

    # Unknown grader: return a failed score
    return {"score": 0.0, "details": f"Unknown grader: {name}"}


def evaluate_case(
    tc: TestCase,
    client: Optional[DirectLineClient],
    graders: dict,
    judge_model: str,
    dry_run: bool,
) -> EvalResult:
    """Run a single test case end-to-end and return an EvalResult."""
    response = ""
    error = ""

    if dry_run:
        response = "[dry-run: no agent call made]"
    elif client is None:
        error = "No Direct Line secret configured. Use --direct-line-secret."
        response = ""
    else:
        try:
            conversation_id = client.start_conversation()
            response = client.send_and_receive(conversation_id, tc.query)
        except (RuntimeError, OSError, ValueError) as exc:
            error = str(exc)
            response = ""

    if dry_run or error:
        details = {"score": 0.0, "details": error or "dry-run"}
        raw_score = 0.0
        passed = dry_run  # dry-run always shows pass to validate structure
    else:
        try:
            details = grade(tc, response, graders, judge_model)
            raw_score = details.get("score", 0.0)
        except (ImportError, EnvironmentError, ValueError, RuntimeError) as exc:
            error = str(exc)
            details = {"score": 0.0}
            raw_score = 0.0

        # Safety and LLM graders return scores on different scales; normalize
        grader_name = tc.grader
        if grader_name == "safety_check":
            # safety score is 1.0 or 5.0 -- treat 5.0 as pass
            passed = details.get("safe", False)
            raw_score = 1.0 if details.get("safe") else 0.0
        elif grader_name == "semantic_similarity":
            # scale is 1-5, normalize to 0-1
            raw_score = (details.get("score", 1.0) - 1) / 4
            passed = raw_score >= tc.pass_threshold
        else:
            passed = raw_score >= tc.pass_threshold

    return EvalResult(
        test_case_id=tc.id,
        tier=tc.tier,
        query=tc.query,
        grader=tc.grader,
        response=response,
        score=round(raw_score, 4),
        pass_threshold=tc.pass_threshold,
        passed=passed if not error else False,
        details=details,
        error=error,
    )


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def build_report(results: list, test_cases: list) -> dict:
    """Aggregate EvalResults into a structured report dict."""
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    failed = total - passed

    by_tier: dict = {}
    for result in results:
        tier = result.tier
        if tier not in by_tier:
            by_tier[tier] = {"total": 0, "passed": 0, "failed": 0, "results": []}
        by_tier[tier]["total"] += 1
        if result.passed:
            by_tier[tier]["passed"] += 1
        else:
            by_tier[tier]["failed"] += 1
        by_tier[tier]["results"].append(asdict(result))

    tier_outcomes = {}
    for tier, stats in by_tier.items():
        threshold = TIER_PASS_RATES.get(tier, 0.7)
        actual_rate = stats["passed"] / stats["total"] if stats["total"] > 0 else 0.0
        tier_outcomes[tier] = {
            "pass_rate_required": threshold,
            "pass_rate_actual": round(actual_rate, 4),
            "tier_passed": actual_rate >= threshold,
            **stats,
        }

    all_tiers_passed = all(v["tier_passed"] for v in tier_outcomes.values())

    return {
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "overall_pass_rate": round(passed / total, 4) if total > 0 else 0.0,
            "all_tiers_passed": all_tiers_passed,
        },
        "tier_outcomes": tier_outcomes,
    }


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

_PASS_SYMBOL = {True: "PASS", False: "FAIL"}

_COL_WIDTHS = {
    "id": 36,
    "tier": 14,
    "grader": 20,
    "score": 8,
    "threshold": 10,
    "result": 6,
    "query": 50,
}


def _truncate(value: str, width: int) -> str:
    return value[:width] if len(value) > width else value


def print_table(results: list, tier_outcomes: dict) -> None:
    """Print evaluation results as a fixed-width ASCII table."""
    w = _COL_WIDTHS
    header = (
        f"{'ID':<{w['id']}} "
        f"{'Tier':<{w['tier']}} "
        f"{'Grader':<{w['grader']}} "
        f"{'Score':<{w['score']}} "
        f"{'Threshold':<{w['threshold']}} "
        f"{'Result':<{w['result']}} "
        f"{'Query':<{w['query']}}"
    )
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)
    for r in results:
        print(
            f"{_truncate(r.test_case_id, w['id']):<{w['id']}} "
            f"{_truncate(r.tier, w['tier']):<{w['tier']}} "
            f"{_truncate(r.grader, w['grader']):<{w['grader']}} "
            f"{str(r.score):<{w['score']}} "
            f"{str(r.pass_threshold):<{w['threshold']}} "
            f"{_PASS_SYMBOL[r.passed]:<{w['result']}} "
            f"{_truncate(r.query, w['query']):<{w['query']}}"
        )
    print(separator)

    # Tier summary
    print("\nTier Summary:")
    for tier, stats in tier_outcomes.items():
        outcome = "PASS" if stats["tier_passed"] else "FAIL"
        print(
            f"  {tier:<16} {stats['passed']}/{stats['total']} cases passed "
            f"(required {stats['pass_rate_required']:.0%}, "
            f"actual {stats['pass_rate_actual']:.0%})  [{outcome}]"
        )


def print_summary(report: dict) -> None:
    """Print a one-line overall summary."""
    s = report["summary"]
    overall = "PASSED" if s["all_tiers_passed"] else "FAILED"
    print(
        f"\nOverall: {s['total']} cases | "
        f"{s['passed']} passed | {s['failed']} failed | "
        f"pass rate {s['overall_pass_rate']:.0%} [{overall}]"
    )


def print_json_report(report: dict) -> None:
    """Print the full report as JSON."""
    print(json.dumps(report, indent=2))


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Cross-vertical evaluation runner for Copilot Agent Development agents."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--test-set",
        metavar="FILE",
        required=True,
        help="Path to a YAML test set file.",
    )
    parser.add_argument(
        "--vertical",
        metavar="VERTICAL",
        default=None,
        help="Filter test cases to a specific vertical.",
    )
    parser.add_argument(
        "--agent",
        metavar="AGENT",
        default=None,
        help="Filter test cases to a specific agent.",
    )
    parser.add_argument(
        "--tier",
        metavar="TIER",
        default=None,
        choices=list(TIER_PASS_RATES.keys()),
        help="Filter test cases to a specific tier.",
    )
    parser.add_argument(
        "--output",
        choices=["table", "json"],
        default="table",
        help="Output format: table (default) or json.",
    )
    parser.add_argument(
        "--judge-model",
        choices=list(JUDGE_MODELS),
        default="gpt-4o",
        dest="judge_model",
        help="LLM judge model to use for llm_judge grader (default: gpt-4o).",
    )
    parser.add_argument(
        "--direct-line-secret",
        metavar="ENV_VAR",
        default=None,
        dest="direct_line_secret",
        help=(
            "Name of the environment variable that holds the Direct Line API secret. "
            "If not provided, agent calls are skipped."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        dest="dry_run",
        help="Parse and validate test cases without calling the agent.",
    )
    return parser


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    test_cases = load_test_cases(
        args.test_set,
        args.vertical,
        args.agent,
        args.tier,
    )

    if not test_cases:
        print("No test cases matched the specified filters.", file=sys.stderr)
        return 2

    # Resolve Direct Line secret
    client: Optional[DirectLineClient] = None
    if args.direct_line_secret and not args.dry_run:
        secret = os.environ.get(args.direct_line_secret, "")
        if not secret:
            print(
                f"Warning: environment variable '{args.direct_line_secret}' is not set. "
                "Agent calls will be skipped.",
                file=sys.stderr,
            )
        else:
            client = DirectLineClient(secret=secret)

    graders = _import_graders()

    results = []
    for tc in test_cases:
        result = evaluate_case(tc, client, graders, args.judge_model, args.dry_run)
        results.append(result)

    report = build_report(results, test_cases)

    if args.output == "json":
        print_json_report(report)
    else:
        print_table(results, report["tier_outcomes"])
        print_summary(report)

    all_passed = report["summary"]["all_tiers_passed"]
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
