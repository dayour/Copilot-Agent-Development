#!/usr/bin/env python3
"""
connector-health-check.py

Portable command-line tool for checking the health of connectors registered
across all verticals in the Copilot Agent Development repository.

Usage:
    python connector-health-check.py [--config CONFIG] [--vertical VERTICAL]
                                     [--connector CONNECTOR] [--output {table,json}]
                                     [--timeout TIMEOUT]

The tool reads a connector inventory from a YAML config file (default:
connector-health-config.yaml in the same directory), probes each registered
endpoint, and reports status, latency, and any auth or rate-limit signals.

Exit codes:
    0  All connectors healthy
    1  One or more connectors degraded or failed
    2  Configuration or argument error
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from typing import Optional
import os

try:
    import yaml
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Rate limit warning threshold (fraction). Connectors above this utilization
# are marked degraded and an alert fires. Must match health-monitoring.md.
RATE_LIMIT_WARNING_THRESHOLD = 0.80

# Maximum characters stored in cr_errormessage. Must match the schema in
# docs/connectors/health-monitoring.md (maxLength: 500 for probe writes).
ERROR_MESSAGE_MAX_LENGTH = 500


# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class ConnectorProbe:
    vertical: str
    agent: str
    connector: str
    probe_url: str
    auth_type: str = "none"
    auth_header: str = ""
    auth_value_env: str = ""
    expected_status: int = 200
    timeout_seconds: int = 10


@dataclass
class HealthResult:
    vertical: str
    agent: str
    connector: str
    probe_url: str
    status: str = "unknown"
    http_status_code: int = 0
    latency_ms: int = 0
    connection_status: str = "unknown"
    error_rate_signal: str = ""
    rate_limit_remaining: Optional[int] = None
    rate_limit_total: Optional[int] = None
    rate_limit_utilization_pct: Optional[float] = None
    error_message: str = ""


# ---------------------------------------------------------------------------
# Default connector inventory (used when no config file is present)
# ---------------------------------------------------------------------------

DEFAULT_INVENTORY = [
    {
        "vertical": "coffee",
        "agent": "virtual-coach",
        "connector": "sharepoint_online",
        "probe_url": "https://graph.microsoft.com/v1.0/sites?$top=1",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "COFFEE_SHAREPOINT_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "coffee",
        "agent": "virtual-coach",
        "connector": "custom_pos_api",
        "probe_url": "${COFFEE_POS_API_BASE_URL}/health",
        "auth_type": "api_key",
        "auth_header": "X-Api-Key",
        "auth_value_env": "COFFEE_POS_API_KEY",
        "expected_status": 200,
    },
    {
        "vertical": "clothing",
        "agent": "power-analysis",
        "connector": "erp_api",
        "probe_url": "${CLOTHING_ERP_API_BASE_URL}/health",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "CLOTHING_ERP_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "clothing",
        "agent": "power-analysis",
        "connector": "pos_api",
        "probe_url": "${CLOTHING_POS_API_BASE_URL}/health",
        "auth_type": "api_key",
        "auth_header": "X-Api-Key",
        "auth_value_env": "CLOTHING_POS_API_KEY",
        "expected_status": 200,
    },
    {
        "vertical": "clothing",
        "agent": "power-analysis",
        "connector": "power_bi",
        "probe_url": "https://api.powerbi.com/v1.0/myorg/groups",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "CLOTHING_POWERBI_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "insurance",
        "agent": "claims-assistant",
        "connector": "claims_management_api",
        "probe_url": "${INSURANCE_CLAIMS_API_BASE_URL}/health",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "INSURANCE_CLAIMS_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "insurance",
        "agent": "claims-assistant",
        "connector": "actuarial_api",
        "probe_url": "${INSURANCE_ACTUARIAL_API_BASE_URL}/health",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "INSURANCE_ACTUARIAL_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "insurance",
        "agent": "claims-assistant",
        "connector": "compliance_api",
        "probe_url": "${INSURANCE_COMPLIANCE_API_BASE_URL}/health",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "INSURANCE_COMPLIANCE_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "tech",
        "agent": "it-help-desk",
        "connector": "servicenow",
        "probe_url": "${TECH_SERVICENOW_BASE_URL}/api/now/table/sys_user?sysparm_limit=1",
        "auth_type": "basic",
        "auth_header": "Authorization",
        "auth_value_env": "TECH_SERVICENOW_BASIC_AUTH",
        "expected_status": 200,
    },
    {
        "vertical": "tech",
        "agent": "it-help-desk",
        "connector": "microsoft_graph",
        "probe_url": "https://graph.microsoft.com/v1.0/users?$top=1",
        "auth_type": "bearer",
        "auth_header": "Authorization",
        "auth_value_env": "TECH_GRAPH_TOKEN",
        "expected_status": 200,
    },
    {
        "vertical": "transportation",
        "agent": "fleet-coordinator",
        "connector": "telematics_api",
        "probe_url": "${TRANSPORT_TELEMATICS_BASE_URL}/health",
        "auth_type": "api_key",
        "auth_header": "X-Api-Key",
        "auth_value_env": "TRANSPORT_TELEMATICS_API_KEY",
        "expected_status": 200,
    },
    {
        "vertical": "transportation",
        "agent": "fuel-tracking",
        "connector": "fuel_card_api",
        "probe_url": "${TRANSPORT_FUEL_CARD_API_BASE_URL}/health",
        "auth_type": "api_key",
        "auth_header": "X-Api-Key",
        "auth_value_env": "TRANSPORT_FUEL_CARD_API_KEY",
        "expected_status": 200,
    },
    {
        "vertical": "transportation",
        "agent": "route-optimizer",
        "connector": "routing_api",
        "probe_url": "${TRANSPORT_ROUTING_API_BASE_URL}/health",
        "auth_type": "api_key",
        "auth_header": "X-Api-Key",
        "auth_value_env": "TRANSPORT_ROUTING_API_KEY",
        "expected_status": 200,
    },
]


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def _expand_env_vars(value: str) -> str:
    """Expand ${ENV_VAR} placeholders using environment variables."""
    import re
    def replacer(match):
        var_name = match.group(1)
        return os.environ.get(var_name, match.group(0))
    return re.sub(r"\$\{([^}]+)\}", replacer, value)


def load_inventory(config_path: Optional[str]) -> list:
    """Load connector inventory from config file or fall back to built-in defaults."""
    if config_path:
        if not os.path.isfile(config_path):
            print(f"Error: config file not found: {config_path}", file=sys.stderr)
            sys.exit(2)
        if not _YAML_AVAILABLE:
            print("Error: PyYAML is required to load a config file. Install with: pip install pyyaml",
                  file=sys.stderr)
            sys.exit(2)
        with open(config_path, "r", encoding="utf-8") as fh:
            data = yaml.safe_load(fh)
        return data.get("connectors", [])
    return DEFAULT_INVENTORY


def build_probes(inventory: list, vertical_filter: Optional[str],
                 connector_filter: Optional[str], default_timeout: int) -> list:
    """Convert raw inventory dicts into ConnectorProbe objects, applying filters."""
    probes = []
    for item in inventory:
        if vertical_filter and item.get("vertical") != vertical_filter:
            continue
        if connector_filter and item.get("connector") != connector_filter:
            continue
        url = _expand_env_vars(item.get("probe_url", ""))
        probes.append(ConnectorProbe(
            vertical=item.get("vertical", ""),
            agent=item.get("agent", ""),
            connector=item.get("connector", ""),
            probe_url=url,
            auth_type=item.get("auth_type", "none"),
            auth_header=item.get("auth_header", ""),
            auth_value_env=item.get("auth_value_env", ""),
            expected_status=item.get("expected_status", 200),
            timeout_seconds=item.get("timeout_seconds", default_timeout),
        ))
    return probes


# ---------------------------------------------------------------------------
# Health check execution
# ---------------------------------------------------------------------------

def _resolve_auth_value(probe: ConnectorProbe) -> str:
    """Return the auth header value, reading from the environment if needed.

    For bearer auth, a 'Bearer ' prefix is automatically prepended when the
    environment variable value does not already start with 'bearer ' (case-
    insensitive). This allows callers to store raw tokens without the prefix.
    """
    if not probe.auth_value_env:
        return ""
    raw = os.environ.get(probe.auth_value_env, "")
    if probe.auth_type == "bearer" and raw and not raw.lower().startswith("bearer "):
        return f"Bearer {raw}"
    return raw


def _parse_rate_limit(headers) -> tuple:
    """Extract rate-limit-remaining and rate-limit-total from response headers."""
    remaining = None
    total = None
    for key in headers:
        key_lower = key.lower()
        if key_lower in ("x-ratelimit-remaining", "ratelimit-remaining", "x-rate-limit-remaining"):
            try:
                remaining = int(headers[key])
            except (ValueError, TypeError):
                pass
        if key_lower in ("x-ratelimit-limit", "ratelimit-limit", "x-rate-limit-limit"):
            try:
                total = int(headers[key])
            except (ValueError, TypeError):
                pass
    return remaining, total


def probe_connector(probe: ConnectorProbe) -> HealthResult:
    """Execute a single connector health probe and return a HealthResult."""
    result = HealthResult(
        vertical=probe.vertical,
        agent=probe.agent,
        connector=probe.connector,
        probe_url=probe.probe_url,
    )

    if not probe.probe_url or probe.probe_url.startswith("${"):
        result.status = "skipped"
        result.error_message = "Probe URL not configured (environment variable not set)."
        return result

    headers = {}
    auth_value = _resolve_auth_value(probe)
    if probe.auth_header and auth_value:
        headers[probe.auth_header] = auth_value

    request = urllib.request.Request(probe.probe_url, headers=headers, method="GET")

    start_ns = time.monotonic_ns()
    try:
        with urllib.request.urlopen(request, timeout=probe.timeout_seconds) as response:
            elapsed_ms = (time.monotonic_ns() - start_ns) // 1_000_000
            result.http_status_code = response.status
            result.latency_ms = elapsed_ms
            result.rate_limit_remaining, result.rate_limit_total = _parse_rate_limit(response.headers)
    except urllib.error.HTTPError as exc:
        elapsed_ms = (time.monotonic_ns() - start_ns) // 1_000_000
        result.http_status_code = exc.code
        result.latency_ms = elapsed_ms
        result.rate_limit_remaining, result.rate_limit_total = _parse_rate_limit(exc.headers)
        result.error_message = str(exc.reason)
    except urllib.error.URLError as exc:
        elapsed_ms = (time.monotonic_ns() - start_ns) // 1_000_000
        result.latency_ms = elapsed_ms
        result.error_message = str(exc.reason)
    except Exception as exc:  # noqa: BLE001 - broad catch intentional: probe must never crash the caller
        elapsed_ms = (time.monotonic_ns() - start_ns) // 1_000_000
        result.latency_ms = elapsed_ms
        result.error_message = str(exc)

    # Truncate error_message to the documented schema maximum length
    if result.error_message:
        result.error_message = result.error_message[:ERROR_MESSAGE_MAX_LENGTH]

    # Derive connection status from HTTP status code
    if result.http_status_code == 0:
        result.connection_status = "unreachable"
        result.status = "failed"
    elif result.http_status_code in (401, 403):
        result.connection_status = "expired_or_revoked"
        result.status = "failed"
    elif result.http_status_code == 429:
        result.connection_status = "authenticated"
        result.error_rate_signal = "rate_limited"
        result.status = "degraded"
    elif result.http_status_code >= 500:
        result.connection_status = "authenticated"
        result.status = "failed"
    elif result.http_status_code == probe.expected_status:
        result.connection_status = "authenticated"
        result.status = "healthy"
    else:
        result.connection_status = "authenticated"
        result.status = "degraded"

    # Calculate rate limit utilization percentage
    if result.rate_limit_total and result.rate_limit_total > 0 and result.rate_limit_remaining is not None:
        consumed = result.rate_limit_total - result.rate_limit_remaining
        result.rate_limit_utilization_pct = round(consumed / result.rate_limit_total * 100, 1)
        if result.rate_limit_utilization_pct >= RATE_LIMIT_WARNING_THRESHOLD * 100 and result.status == "healthy":
            result.status = "degraded"
            result.error_rate_signal = "rate_limit_approaching"

    return result


def run_checks(probes: list) -> list:
    """Run all probes sequentially and return a list of HealthResult objects."""
    results = []
    for probe in probes:
        result = probe_connector(probe)
        results.append(result)
    return results


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------

_STATUS_SYMBOL = {
    "healthy": "OK ",
    "degraded": "DGR",
    "failed": "ERR",
    "skipped": "SKP",
    "unknown": "???",
}

_STATUS_WIDTHS = {
    "vertical": 16,
    "agent": 22,
    "connector": 28,
    "status": 8,
    "http": 6,
    "latency": 10,
    "conn_status": 22,
    "rate_util": 12,
    "error": 40,
}


def _truncate(value: str, width: int) -> str:
    return value[:width] if len(value) > width else value


def print_table(results: list) -> None:
    """Print results as a fixed-width ASCII table."""
    w = _STATUS_WIDTHS
    header = (
        f"{'Vertical':<{w['vertical']}} "
        f"{'Agent':<{w['agent']}} "
        f"{'Connector':<{w['connector']}} "
        f"{'Status':<{w['status']}} "
        f"{'HTTP':<{w['http']}} "
        f"{'LatencyMs':<{w['latency']}} "
        f"{'ConnStatus':<{w['conn_status']}} "
        f"{'RateUtil%':<{w['rate_util']}} "
        f"{'Error':<{w['error']}}"
    )
    separator = "-" * len(header)
    print(separator)
    print(header)
    print(separator)
    for r in results:
        symbol = _STATUS_SYMBOL.get(r.status, "???")
        rate_util = f"{r.rate_limit_utilization_pct:.1f}" if r.rate_limit_utilization_pct is not None else "-"
        error_col = _truncate(r.error_message or r.error_rate_signal or "-", w["error"])
        print(
            f"{_truncate(r.vertical, w['vertical']):<{w['vertical']}} "
            f"{_truncate(r.agent, w['agent']):<{w['agent']}} "
            f"{_truncate(r.connector, w['connector']):<{w['connector']}} "
            f"{symbol + ' ' + r.status:<{w['status']}} "
            f"{str(r.http_status_code):<{w['http']}} "
            f"{str(r.latency_ms) + ' ms':<{w['latency']}} "
            f"{_truncate(r.connection_status, w['conn_status']):<{w['conn_status']}} "
            f"{rate_util:<{w['rate_util']}} "
            f"{error_col:<{w['error']}}"
        )
    print(separator)


def print_json(results: list) -> None:
    """Print results as a JSON array."""
    output = [asdict(r) for r in results]
    print(json.dumps(output, indent=2))


def print_summary(results: list) -> None:
    """Print a one-line summary of overall fleet health."""
    total = len(results)
    healthy = sum(1 for r in results if r.status == "healthy")
    degraded = sum(1 for r in results if r.status == "degraded")
    failed = sum(1 for r in results if r.status == "failed")
    skipped = sum(1 for r in results if r.status == "skipped")
    print(
        f"\nSummary: {total} connectors | "
        f"{healthy} healthy | {degraded} degraded | {failed} failed | {skipped} skipped"
    )


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Check connector health for all Copilot Agent Development verticals.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--config",
        metavar="CONFIG",
        default=None,
        help="Path to a YAML connector inventory config file. Defaults to built-in inventory.",
    )
    parser.add_argument(
        "--vertical",
        metavar="VERTICAL",
        default=None,
        help="Filter checks to a specific vertical (coffee, clothing, insurance, tech, transportation).",
    )
    parser.add_argument(
        "--connector",
        metavar="CONNECTOR",
        default=None,
        help="Filter checks to a specific connector name.",
    )
    parser.add_argument(
        "--output",
        choices=["table", "json"],
        default="table",
        help="Output format: table (default) or json.",
    )
    parser.add_argument(
        "--timeout",
        metavar="SECONDS",
        type=int,
        default=10,
        help="HTTP probe timeout in seconds (default: 10).",
    )
    return parser


def main(argv=None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    inventory = load_inventory(args.config)
    probes = build_probes(inventory, args.vertical, args.connector, args.timeout)

    if not probes:
        print("No connectors matched the specified filters.", file=sys.stderr)
        return 2

    results = run_checks(probes)

    if args.output == "json":
        print_json(results)
    else:
        print_table(results)
        print_summary(results)

    any_failed = any(r.status in ("failed", "degraded") for r in results)
    return 1 if any_failed else 0


if __name__ == "__main__":
    sys.exit(main())
