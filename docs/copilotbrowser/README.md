# CopilotBrowser UI Regression Test Suite

## Overview

This directory contains the snapshot-based UI regression test suite for Copilot Studio. The tests use `copilotbrowser-cli` to navigate to each page, capture interactive element snapshots, and assert that expected selector references are present. When a selector reference disappears after a Copilot Studio update, the test fails and reports the broken ref alongside screenshot evidence.

The suite covers seven critical pages:

| Test File | Page | Key Selectors Verified |
|---|---|---|
| `tests/test-login-page.yaml` | Login / sign-in page | Email field, password field, sign-in button, AAD redirect |
| `tests/test-agent-list.yaml` | Agent list (home) | Agent cards, create button, environment selector |
| `tests/test-agent-overview.yaml` | Agent overview | Overview, Topics, Knowledge, Tools, Settings, Channels, Analytics tabs |
| `tests/test-topic-editor.yaml` | Topic editor | Code editor toggle, YAML input area, save button, cancel button |
| `tests/test-chat-panel.yaml` | Test chat panel | Chat input, send button, response area, reset button |
| `tests/test-settings-page.yaml` | Agent settings | Model selector, generative orchestration toggle, authentication settings |
| `tests/test-publishing-page.yaml` | Publishing page | Publish button, channel toggles, publish status indicator |

## Prerequisites

- Node.js 20 or later
- `copilotbrowser-cli` installed: `npm install -g copilotbrowser-cli`
- Credentials for a Copilot Studio test environment, set as environment variables:

```text
COPILOT_STUDIO_URL      Base URL of the target Copilot Studio environment
                        Example: https://web.powerva.microsoft.com
COPILOT_STUDIO_USER     Service account email address used for sign-in
COPILOT_STUDIO_PASSWORD Service account password
COPILOT_TEST_AGENT_ID   Agent ID used for page-specific tests
                        (overview, topic editor, chat panel, settings, publishing)
```

## Running the Tests

### Run all tests

```bash
python docs/copilotbrowser/test-runner.py
```

### Run a single test

```bash
python docs/copilotbrowser/test-runner.py --test tests/test-login-page.yaml
```

### Run with a custom output directory

```bash
python docs/copilotbrowser/test-runner.py --output-dir /tmp/ui-regression-results
```

### Output format options

```bash
# Default: table + JSON report written to output directory
python docs/copilotbrowser/test-runner.py

# JSON to stdout only
python docs/copilotbrowser/test-runner.py --output json
```

## Output Artifacts

| Artifact | Description |
|---|---|
| `selector-health-report.json` | Machine-readable report of all assertion results, pass/fail status, and recommended selector updates |
| `screenshots/` | PNG screenshot taken immediately after each page snapshot; used for visual diffing |
| Console table | Human-readable pass/fail summary printed to stdout |

## Test File Format

Each test file is a YAML document with the following top-level keys:

```yaml
testName:        Human-readable name shown in reports
description:     One-sentence description of what the test validates
page:            Symbolic page identifier (see Page Identifiers below)
agentScoped:     true if the page requires a specific agent to be open (optional, default false)
navigation:
  - action: navigate | click | wait
    target: URL path or selector ref (for click actions)
    waitMs: milliseconds to wait (for wait actions)
snapshot:
  filter: interactive    # always use interactive to capture form fields and buttons
assertions:
  - ref:         Expected selector reference string returned by copilotbrowser-cli
    description: Human-readable description of the element
    required:    true (hard failure) or false (warning only); default true
```

### Page Identifiers

| Identifier | Resolved URL Pattern |
|---|---|
| `login` | `${COPILOT_STUDIO_URL}/` (unauthenticated) |
| `agent-list` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots` |
| `agent-overview` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots/${AGENT_ID}/canvas` |
| `topic-editor` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots/${AGENT_ID}/topics` |
| `chat-panel` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots/${AGENT_ID}/canvas` (test panel open) |
| `settings` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots/${AGENT_ID}/settings` |
| `publishing` | `${COPILOT_STUDIO_URL}/environments/${ENV_ID}/bots/${AGENT_ID}/channels` |

## Selector Health Report

The JSON health report written to `selector-health-report.json` follows this schema:

```json
{
  "runId": "<ISO timestamp>",
  "environment": "<COPILOT_STUDIO_URL>",
  "summary": {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "warnings": 0
  },
  "tests": [
    {
      "testName": "Login Page Structure",
      "page": "login",
      "status": "passed",
      "durationMs": 0,
      "screenshotPath": "screenshots/test-login-page.png",
      "assertions": [
        {
          "ref": "input[type=email]",
          "description": "Email input field",
          "required": true,
          "found": true,
          "status": "passed"
        }
      ],
      "recommendedUpdates": []
    }
  ]
}
```

When a required assertion fails, the `recommendedUpdates` array contains suggested replacement refs based on the closest interactive elements found in the snapshot.

## GitHub Actions Integration

The workflow `.github/workflows/ui-regression-tests.yml` runs the full suite on a weekly schedule and on manual trigger. It uploads the selector health report and screenshot archive as workflow artifacts retained for 30 days.

See the workflow file for secrets and environment variable configuration requirements.

## Selector Maintenance

When a Copilot Studio update breaks a selector:

1. Review the failed assertions in `selector-health-report.json`.
2. Open the screenshot in `screenshots/` to visually confirm the page state.
3. Check `recommendedUpdates` in the report for suggested replacement refs.
4. Update the relevant `tests/*.yaml` file with the corrected `ref` value.
5. Re-run the test to confirm the updated selector passes.
6. Commit the updated test file with a note referencing the Copilot Studio release version.

## Adding New Tests

1. Create a new YAML file in `docs/copilotbrowser/tests/` following the format above. The file name must start with `test-` and end with `.yaml` (for example, `test-my-new-page.yaml`).
2. The test runner auto-discovers all `test-*.yaml` files in the tests directory; no manual registration is required.
3. Run the test locally to confirm the selectors resolve.
4. Commit the new test file.
