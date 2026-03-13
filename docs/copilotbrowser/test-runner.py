#!/usr/bin/env python3
"""
test-runner.py

Snapshot-based UI regression test runner for Copilot Studio.

Reads test definitions from YAML files in docs/copilotbrowser/tests/,
invokes copilotbrowser-cli to navigate to each page and capture an
interactive-element snapshot, then asserts that all expected selector
references are present in the snapshot output.

Produces:
  - selector-health-report.json  Machine-readable assertion results
  - screenshots/                 PNG screenshots taken after each snapshot
  - Console table                Human-readable pass/fail summary

Usage:
    python docs/copilotbrowser/test-runner.py [options]

Options:
    --test FILE        Run a single test file instead of all discovered tests.
    --tests-dir DIR    Directory containing test YAML files
                       (default: docs/copilotbrowser/tests/ relative to repo root).
    --output-dir DIR   Directory for report and screenshot output
                       (default: ./ui-regression-results).
    --output FORMAT    Console output format: table (default) or json.
    --cli-path PATH    Path to copilotbrowser-cli executable
                       (default: copilotbrowser-cli on PATH).
    --timeout SECS     Timeout in seconds per CLI invocation (default: 60).
    --dry-run          Parse and validate test files without invoking the CLI.

Environment variables:
    COPILOT_STUDIO_URL          Base URL for Copilot Studio
    COPILOT_ENV_ID              Power Platform environment ID
    COPILOT_STUDIO_USER         Service account email
    COPILOT_STUDIO_PASSWORD     Service account password
    COPILOT_TEST_AGENT_ID       Agent ID for agent-scoped tests

Exit codes:
    0  All required assertions passed
    1  One or more required assertions failed
    2  Configuration or argument error
    3  CLI invocation error (copilotbrowser-cli not found or crashed)
"""

import argparse
import datetime
import json
import os
import re
import subprocess
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

try:
    import yaml
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TESTS_DIR_DEFAULT = Path(__file__).parent / "tests"
OUTPUT_DIR_DEFAULT = Path("ui-regression-results")
CLI_DEFAULT = "copilotbrowser-cli"
CLI_TIMEOUT_DEFAULT = 60

# Copilot Studio URL patterns used to resolve symbolic page identifiers
PAGE_URL_TEMPLATES = {
    "login": "{COPILOT_STUDIO_URL}/",
    "agent-list": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots",
    "agent-overview": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots/{COPILOT_TEST_AGENT_ID}/canvas",
    "topic-editor": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots/{COPILOT_TEST_AGENT_ID}/topics",
    "chat-panel": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots/{COPILOT_TEST_AGENT_ID}/canvas",
    "settings": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots/{COPILOT_TEST_AGENT_ID}/settings",
    "publishing": "{COPILOT_STUDIO_URL}/environments/{COPILOT_ENV_ID}/bots/{COPILOT_TEST_AGENT_ID}/channels",
}


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class AssertionSpec:
    ref: str
    description: str
    required: bool = True


@dataclass
class NavigationStep:
    action: str          # navigate | click | wait
    target: str = ""     # URL or selector (for navigate/click)
    wait_ms: int = 0     # milliseconds (for wait)


@dataclass
class TestSpec:
    test_name: str
    description: str
    page: str
    agent_scoped: bool
    navigation: list
    snapshot_filter: str
    assertions: list
    source_file: str


@dataclass
class AssertionResult:
    ref: str
    description: str
    required: bool
    found: bool
    status: str = "unknown"    # passed | failed | warning


@dataclass
class TestResult:
    test_name: str
    page: str
    status: str = "unknown"    # passed | failed | error | skipped
    duration_ms: int = 0
    screenshot_path: str = ""
    error_message: str = ""
    assertions: list = field(default_factory=list)
    recommended_updates: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# Config and environment helpers
# ---------------------------------------------------------------------------

def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default)


def _expand_env(value: str) -> str:
    """Expand ${VAR} and {VAR} placeholders using environment variables."""
    def replacer(match):
        var_name = match.group(1)
        return os.environ.get(var_name, match.group(0))
    value = re.sub(r"\$\{([^}]+)\}", replacer, value)
    value = re.sub(r"\{([A-Z_][A-Z0-9_]*)\}", replacer, value)
    return value


def resolve_page_url(page: str) -> str:
    """Resolve a symbolic page identifier to a concrete URL."""
    template = PAGE_URL_TEMPLATES.get(page, "")
    if not template:
        return ""
    return _expand_env(template)


# ---------------------------------------------------------------------------
# Test file loading
# ---------------------------------------------------------------------------

_VALID_ACTIONS = {"navigate", "click", "wait"}


def _parse_navigation(raw: list) -> list:
    steps = []
    for item in (raw or []):
        action = item.get("action", "navigate")
        if action not in _VALID_ACTIONS:
            raise ValueError(
                f"Invalid navigation action '{action}'. "
                f"Valid actions: {sorted(_VALID_ACTIONS)}"
            )
        steps.append(NavigationStep(
            action=action,
            target=_expand_env(item.get("target", "")),
            wait_ms=item.get("waitMs", 0),
        ))
    return steps


def _parse_assertions(raw: list) -> list:
    specs = []
    for item in (raw or []):
        specs.append(AssertionSpec(
            ref=item.get("ref", ""),
            description=item.get("description", ""),
            required=item.get("required", True),
        ))
    return specs


def load_test_file(path: Path) -> TestSpec:
    """Load and parse a single test YAML file."""
    if not _YAML_AVAILABLE:
        raise RuntimeError("PyYAML is required. Install with: pip install pyyaml")
    with open(path, "r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    return TestSpec(
        test_name=data.get("testName", path.stem),
        description=data.get("description", ""),
        page=data.get("page", ""),
        agent_scoped=data.get("agentScoped", False),
        navigation=_parse_navigation(data.get("navigation", [])),
        snapshot_filter=data.get("snapshot", {}).get("filter", "interactive"),
        assertions=_parse_assertions(data.get("assertions", [])),
        source_file=str(path),
    )


def discover_tests(tests_dir: Path) -> list:
    """Return all test YAML files in tests_dir, sorted by file name."""
    return sorted(tests_dir.glob("test-*.yaml"))


# ---------------------------------------------------------------------------
# CLI invocation
# ---------------------------------------------------------------------------

def _build_cli_args(step: NavigationStep, snapshot_filter: str, cli_path: str) -> list:
    """Build the copilotbrowser-cli command for a navigate-and-snapshot operation."""
    # copilotbrowser-cli navigate <url> --snapshot --filter=<filter> --output=json
    if step.action == "navigate":
        return [
            cli_path,
            "navigate", step.target,
            "--snapshot",
            f"--filter={snapshot_filter}",
            "--output=json",
        ]
    if step.action == "click":
        return [cli_path, "click", step.target]
    if step.action == "wait":
        return [cli_path, "wait", str(step.wait_ms)]
    return []


def _build_screenshot_args(cli_path: str, output_path: str) -> list:
    return [cli_path, "screenshot", f"--output={output_path}"]


def _run_cli(args: list, timeout: int, env: dict) -> tuple:
    """Run a CLI command and return (stdout, stderr, returncode)."""
    try:
        proc = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
        )
        return proc.stdout, proc.stderr, proc.returncode
    except FileNotFoundError:
        return "", f"CLI executable not found: {args[0]}", 3
    except subprocess.TimeoutExpired:
        return "", f"CLI invocation timed out after {timeout}s", 3
    except (subprocess.SubprocessError, OSError) as exc:
        return "", str(exc), 3


def _parse_snapshot_output(stdout: str) -> list:
    """Parse the JSON array of refs emitted by copilotbrowser-cli --output=json."""
    stdout = stdout.strip()
    if not stdout:
        return []
    try:
        data = json.loads(stdout)
        if isinstance(data, list):
            return [str(item.get("ref", item)) if isinstance(item, dict) else str(item) for item in data]
        if isinstance(data, dict):
            refs = data.get("refs", data.get("elements", []))
            return [str(r.get("ref", r)) if isinstance(r, dict) else str(r) for r in refs]
    except json.JSONDecodeError:
        # Fall back: extract quoted strings that look like CSS selectors
        return re.findall(r'"([^"]{3,})"', stdout)
    return []


def _ref_is_present(expected_ref: str, found_refs: list) -> bool:
    """
    Check whether any of the comma-separated selector alternatives in
    expected_ref match a ref in the found_refs list.

    copilotbrowser-cli returns exact ref strings. The test YAML may specify
    multiple comma-separated alternatives to handle Copilot Studio UI
    variations across releases. Matching uses exact equality first, then
    checks whether the found ref starts with or ends with the alternative
    to handle attribute-selector suffix variations. This avoids false
    positives from unrelated selectors that share a common substring.
    """
    alternatives = [a.strip() for a in expected_ref.split(",")]
    for alt in alternatives:
        for found_ref in found_refs:
            if alt == found_ref:
                return True
            # Allow suffix: e.g. alt="button[aria-label*='Save']" matches
            # a found_ref that is exactly that string or a more-specific
            # compound selector that ends with it.
            if found_ref.endswith(alt) or found_ref.startswith(alt):
                return True
    return False


# ---------------------------------------------------------------------------
# Test execution
# ---------------------------------------------------------------------------

def execute_test(spec: TestSpec, cli_path: str, timeout: int,
                 output_dir: Path, dry_run: bool) -> TestResult:
    """Execute a single test and return its result."""
    result = TestResult(test_name=spec.test_name, page=spec.page)
    start_ns = time.monotonic_ns()

    if dry_run:
        result.status = "skipped"
        result.error_message = "Dry run: CLI not invoked."
        for assertion in spec.assertions:
            result.assertions.append(AssertionResult(
                ref=assertion.ref,
                description=assertion.description,
                required=assertion.required,
                found=False,
                status="skipped",
            ))
        result.duration_ms = (time.monotonic_ns() - start_ns) // 1_000_000
        return result

    # Build process environment: pass all current env vars plus auth credentials
    proc_env = os.environ.copy()

    found_refs = []
    cli_error = ""

    # Execute navigation steps sequentially; snapshot on the final navigate step
    for i, step in enumerate(spec.navigation):
        args = _build_cli_args(step, spec.snapshot_filter, cli_path)
        if not args:
            continue

        # Only request snapshot output on the last navigate step
        is_last_navigate = (
            step.action == "navigate"
            and all(s.action != "navigate" for s in spec.navigation[i + 1:])
        )
        if step.action == "navigate" and not is_last_navigate:
            # Execute without snapshot output
            args = [cli_path, "navigate", step.target]

        stdout, stderr, returncode = _run_cli(args, timeout, proc_env)

        if returncode == 3:
            result.status = "error"
            result.error_message = stderr
            result.duration_ms = (time.monotonic_ns() - start_ns) // 1_000_000
            return result

        if step.action == "navigate" and is_last_navigate and stdout:
            found_refs = _parse_snapshot_output(stdout)

        if returncode != 0 and step.action not in ("wait",):
            cli_error = stderr or f"CLI returned exit code {returncode}"

    # Take screenshot after navigation sequence completes
    screenshots_dir = output_dir / "screenshots"
    screenshots_dir.mkdir(parents=True, exist_ok=True)
    screenshot_file = screenshots_dir / f"{Path(spec.source_file).stem}.png"
    shot_args = _build_screenshot_args(cli_path, str(screenshot_file))
    _run_cli(shot_args, timeout, proc_env)
    if screenshot_file.exists():
        result.screenshot_path = str(screenshot_file)

    # Evaluate assertions
    any_required_failed = False
    for assertion in spec.assertions:
        found = _ref_is_present(assertion.ref, found_refs)
        if found:
            status = "passed"
        elif assertion.required:
            status = "failed"
            any_required_failed = True
        else:
            status = "warning"
        result.assertions.append(AssertionResult(
            ref=assertion.ref,
            description=assertion.description,
            required=assertion.required,
            found=found,
            status=status,
        ))

    # Build recommended updates for failed assertions
    if any_required_failed and found_refs:
        for ar in result.assertions:
            if ar.status == "failed" and found_refs:
                # Suggest the first few found refs as candidates
                candidates = found_refs[:5]
                result.recommended_updates.append({
                    "broken_ref": ar.ref,
                    "description": ar.description,
                    "candidate_replacements": candidates,
                    "note": (
                        "Review the screenshot and the candidate refs above. "
                        "Update the test YAML with the correct selector."
                    ),
                })

    if cli_error and not found_refs:
        result.status = "error"
        result.error_message = cli_error
    elif any_required_failed:
        result.status = "failed"
    else:
        result.status = "passed"

    result.duration_ms = (time.monotonic_ns() - start_ns) // 1_000_000
    return result


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def build_report(results: list, environment: str) -> dict:
    """Build the selector health report dict from test results."""
    total = len(results)
    passed = sum(1 for r in results if r.status == "passed")
    failed = sum(1 for r in results if r.status == "failed")
    errors = sum(1 for r in results if r.status == "error")
    warnings = sum(
        1 for r in results
        for a in r.assertions
        if a.status == "warning"
    )
    return {
        "runId": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
        "environment": environment,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "warnings": warnings,
        },
        "tests": [
            {
                "testName": r.test_name,
                "page": r.page,
                "status": r.status,
                "durationMs": r.duration_ms,
                "screenshotPath": r.screenshot_path,
                "errorMessage": r.error_message,
                "assertions": [asdict(a) for a in r.assertions],
                "recommendedUpdates": r.recommended_updates,
            }
            for r in results
        ],
    }


def write_report(report: dict, output_dir: Path) -> Path:
    """Write the report JSON to the output directory and return the path."""
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "selector-health-report.json"
    with open(report_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2)
    return report_path


# ---------------------------------------------------------------------------
# Console output
# ---------------------------------------------------------------------------

_STATUS_SYMBOL = {
    "passed": "PASS",
    "failed": "FAIL",
    "error": "ERR ",
    "skipped": "SKIP",
    "unknown": "??? ",
}

_COL = {
    "test": 34,
    "page": 18,
    "status": 6,
    "assertions": 20,
    "duration": 12,
}


def _truncate(value: str, width: int) -> str:
    return value[:width] if len(value) > width else value


def print_table(results: list) -> None:
    w = _COL
    header = (
        f"{'Test':<{w['test']}} "
        f"{'Page':<{w['page']}} "
        f"{'Status':<{w['status']}} "
        f"{'Assertions':<{w['assertions']}} "
        f"{'Duration':<{w['duration']}}"
    )
    sep = "-" * len(header)
    print(sep)
    print(header)
    print(sep)
    for r in results:
        sym = _STATUS_SYMBOL.get(r.status, "????")
        total_a = len(r.assertions)
        passed_a = sum(1 for a in r.assertions if a.status == "passed")
        failed_a = sum(1 for a in r.assertions if a.status == "failed")
        warn_a = sum(1 for a in r.assertions if a.status == "warning")
        assertion_str = f"{passed_a}/{total_a} pass"
        if failed_a:
            assertion_str += f", {failed_a} fail"
        if warn_a:
            assertion_str += f", {warn_a} warn"
        print(
            f"{_truncate(r.test_name, w['test']):<{w['test']}} "
            f"{_truncate(r.page, w['page']):<{w['page']}} "
            f"{sym:<{w['status']}} "
            f"{_truncate(assertion_str, w['assertions']):<{w['assertions']}} "
            f"{str(r.duration_ms) + ' ms':<{w['duration']}}"
        )
    print(sep)


def print_summary(results: list, report_path: Optional[Path]) -> None:
    total = len(results)
    passed = sum(1 for r in results if r.status == "passed")
    failed = sum(1 for r in results if r.status == "failed")
    errors = sum(1 for r in results if r.status == "error")
    skipped = sum(1 for r in results if r.status == "skipped")
    print(
        f"\nSummary: {total} tests | "
        f"{passed} passed | {failed} failed | {errors} errors | {skipped} skipped"
    )
    if report_path:
        print(f"Report:  {report_path}")


def print_json_output(report: dict) -> None:
    print(json.dumps(report, indent=2))


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run Copilot Studio UI regression tests using copilotbrowser-cli.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--test",
        metavar="FILE",
        default=None,
        help="Run a single test file. Defaults to all tests in --tests-dir.",
    )
    parser.add_argument(
        "--tests-dir",
        metavar="DIR",
        default=str(TESTS_DIR_DEFAULT),
        help=f"Directory containing test YAML files (default: {TESTS_DIR_DEFAULT}).",
    )
    parser.add_argument(
        "--output-dir",
        metavar="DIR",
        default=str(OUTPUT_DIR_DEFAULT),
        help=f"Output directory for report and screenshots (default: {OUTPUT_DIR_DEFAULT}).",
    )
    parser.add_argument(
        "--output",
        choices=["table", "json"],
        default="table",
        help="Console output format: table (default) or json.",
    )
    parser.add_argument(
        "--cli-path",
        metavar="PATH",
        default=CLI_DEFAULT,
        help=f"Path to copilotbrowser-cli executable (default: {CLI_DEFAULT}).",
    )
    parser.add_argument(
        "--timeout",
        metavar="SECS",
        type=int,
        default=CLI_TIMEOUT_DEFAULT,
        help=f"Timeout in seconds per CLI invocation (default: {CLI_TIMEOUT_DEFAULT}).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate test files without invoking the CLI.",
    )
    return parser


def main(argv=None) -> int:
    if not _YAML_AVAILABLE:
        print(
            "Error: PyYAML is required. Install with: pip install pyyaml",
            file=sys.stderr,
        )
        return 2

    parser = build_parser()
    args = parser.parse_args(argv)

    tests_dir = Path(args.tests_dir)
    output_dir = Path(args.output_dir)

    # Collect test files
    if args.test:
        test_path = Path(args.test)
        if not test_path.exists():
            print(f"Error: test file not found: {test_path}", file=sys.stderr)
            return 2
        test_files = [test_path]
    else:
        if not tests_dir.exists():
            print(f"Error: tests directory not found: {tests_dir}", file=sys.stderr)
            return 2
        test_files = discover_tests(tests_dir)
        if not test_files:
            print(f"No test files found in {tests_dir}", file=sys.stderr)
            return 2

    # Load test specs
    specs = []
    for tf in test_files:
        try:
            specs.append(load_test_file(tf))
        except (yaml.YAMLError, FileNotFoundError, OSError, ValueError, KeyError) as exc:
            print(f"Error loading {tf}: {exc}", file=sys.stderr)
            return 2

    environment = _env("COPILOT_STUDIO_URL", "(COPILOT_STUDIO_URL not set)")

    # Execute tests
    results = []
    for spec in specs:
        result = execute_test(
            spec=spec,
            cli_path=args.cli_path,
            timeout=args.timeout,
            output_dir=output_dir,
            dry_run=args.dry_run,
        )
        results.append(result)

    # Build and write report
    report = build_report(results, environment)
    report_path = None
    if not args.dry_run or args.output == "table":
        report_path = write_report(report, output_dir)

    # Console output
    if args.output == "json":
        print_json_output(report)
    else:
        print_table(results)
        print_summary(results, report_path)

    # Exit code
    any_failed = any(r.status in ("failed", "error") for r in results)
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
