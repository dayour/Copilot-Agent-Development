# copilotbrowser-cli Best Practices

## Overview

This guide collects operational best practices for building reliable, efficient, and maintainable browser automation workflows with copilotbrowser-cli in Copilot Studio agent contexts. It covers interaction patterns, snapshot usage, state management, error handling, and multi-tab workflows.

---

## Snapshot Usage

### Take snapshots at the right granularity

A snapshot captures the full accessibility tree of the current page state. Taking too many snapshots is wasteful (token cost, latency). Taking too few leads to stale ref errors.

The recommended rule:

- Take one snapshot per distinct page state.
- Re-snapshot after any action that modifies the DOM: navigation, form submission, dialog open/close, AJAX content load, tab switch.
- Do not re-snapshot between sequential actions on the same element when no DOM change has occurred between those actions.

### Use snapshots to verify state, not just to get refs

Before taking a destructive or consequential action (submitting a form, clicking delete, publishing), take a snapshot and verify that the page is in the expected state. Confirm visible text, element presence, and any status indicators before proceeding.

```text
browser_snapshot
-- Verify: "Are you sure you want to delete?" dialog is visible
-- Verify: confirm button ref is present
browser_click element="Confirm delete button" ref="<ref>"
```

### Read element descriptions carefully

Accessibility snapshots expose the element's accessible name, role, and state. Read these carefully to avoid targeting the wrong element. Two buttons with the label "Save" on the same page will both appear in the snapshot -- use surrounding context (parent section, order in the tree) to distinguish them.

---

## Interaction Patterns

### Always provide both `ref` and `element` parameters

Every action that accepts `ref` also accepts a human-readable `element` description. Always provide both. The `element` description serves as in-context documentation, making automation sequences readable and debuggable.

Good:
```text
browser_click element="Publish agent button" ref="e42"
```

Avoid:
```text
browser_click ref="e42"
```

### Prefer text-based waits over time-based waits

Time-based waits with `browser_wait_for time=N` are fragile and either too short (flakiness) or too long (slow workflows). Prefer text-based waiting:

```text
-- Good: wait for the page to signal readiness
browser_wait_for text="Dashboard"

-- Avoid: arbitrary time delay
browser_wait_for time=3
```

Use `time` only when there is no visible text change that reliably signals completion -- for example, after triggering a background process where the UI does not update.

### Use `textGone` for loading state transitions

When the UI shows a loading indicator (spinner, "Loading...", "Saving..."), use `textGone` to detect when the transition completes:

```text
browser_click element="Save button" ref="<ref>"
browser_wait_for textGone="Saving"
browser_snapshot
-- Verify saved state
```

### Chain actions within a single page state

For pages where you need to fill multiple fields without any DOM changes between them, snapshot once and perform all fills in sequence using the cached refs:

```text
browser_snapshot
-- Extract refs for all input fields at once
browser_type element="First name field" ref="<ref-first>" text="Jane"
browser_type element="Last name field" ref="<ref-last>" text="Smith"
browser_type element="Email field" ref="<ref-email>" text="jane.smith@example.com"
-- One final snapshot to verify before submission
browser_snapshot
browser_click element="Submit button" ref="<ref-submit>"
```

---

## State and Navigation Management

### Verify page identity before acting

Before executing a workflow step, confirm you are on the expected page. Check for a distinctive heading, breadcrumb, or landmark text:

```text
browser_snapshot
-- Verify "Topic Editor" heading is present
-- Verify agent name breadcrumb matches expected agent
```

This prevents misrouted automation from making changes on the wrong page.

### Use navigate instead of browser history for reliability

When returning to a known page, use `browser_navigate` with the full URL rather than `browser_navigate_back`. Back navigation behavior varies with SPA routing and may not produce a clean page state.

```text
-- Preferred
browser_navigate url="https://copilotstudio.microsoft.com/topics"

-- Avoid unless specifically testing back-navigation behavior
browser_navigate_back
```

### Scope multi-tab workflows carefully

When a workflow opens a new tab (for example, Copilot Studio opening Power Automate in a new tab):

1. Call `browser_tabs action="list"` to identify the new tab index.
2. Switch to the new tab with `browser_tabs action="select" index=N`.
3. Complete the task in the new tab.
4. Return to the original tab with `browser_tabs action="select" index=0` (or the correct original index).
5. Re-snapshot on the original tab before continuing.

---

## Error Handling

### Treat every action as potentially failing

Browser automation operates in an environment where timing, network conditions, and application state can change between steps. Design workflows with explicit error paths rather than assuming every action succeeds.

Minimum error handling structure:

```text
Attempt action
If error:
  Re-snapshot
  If expected page state is recoverable:
    Retry action with updated ref
  Else:
    Navigate to known-good URL
    Re-execute workflow from last checkpoint
```

### Log context on failure

When a workflow fails, capture the following for diagnostics:

- Last known URL (from `browser_network_requests` or from state tracking in the workflow)
- Last snapshot output
- Screenshot at point of failure (`browser_take_screenshot`)
- Action that failed and its parameters

```text
-- On failure:
browser_take_screenshot filename="failure-state.png"
browser_snapshot
-- Log snapshot output for debugging
```

### Handle authentication timeouts

Long-running automation sessions may encounter session expiry in Power Platform portals. Signs include redirect to a login page or appearance of "Sign in" UI. Include an authentication state check at the start of any workflow or at regular checkpoints:

```text
browser_snapshot
If "Sign in" button or "Session expired" text is present:
  Re-authenticate using established credential flow
  browser_wait_for text="<expected post-login landmark>"
  Resume workflow from last checkpoint
```

---

## Performance Optimization

### Minimize screenshot frequency

Screenshots (`browser_take_screenshot`) carry significantly higher token cost than accessibility snapshots (`browser_snapshot`). Use screenshots only when visual verification is explicitly required:

- Capturing final state for human review.
- Diagnosing visual rendering bugs.
- Generating evidence for compliance or audit workflows.

For all programmatic element targeting, use `browser_snapshot` instead.

### Batch element reads from a single snapshot

When a workflow needs information from multiple elements on the same page, extract all values from a single snapshot rather than taking multiple snapshots:

```text
-- One snapshot, read all required values
browser_snapshot
-- Extract: page heading ref, status field text, action button refs
-- Proceed with all reads and actions using the single snapshot's refs
```

### Prefer direct navigation over UI traversal for known URLs

When the target page has a deterministic URL, navigate directly rather than clicking through menu hierarchies:

```text
-- Preferred: direct navigation to known URL
-- Replace {env-id} and {topic-id} with actual GUIDs from your environment
browser_navigate url="https://copilotstudio.microsoft.com/environments/{env-id}/topics/{topic-id}"

-- Avoid: multi-step menu click traversal when URL is known
```

Direct navigation reduces the number of snapshot-click-wait cycles and lowers overall latency.

### Cache refs for repeated use within a stable DOM context

Within a workflow step where the DOM does not change, a `ref` obtained from a snapshot is valid for multiple actions. Store and reuse the ref rather than re-snapshotting.

---

## Security Considerations

### Do not embed credentials in automation scripts

Authentication credentials, API keys, and tokens must not be hardcoded in automation workflows. Use environment variables, Azure Key Vault references, or the Power Platform environment variable mechanism to supply secrets at runtime.

### Limit automation account permissions

The account used to drive copilotbrowser-cli automation in Copilot Studio should hold the minimum permissions required for the task:

- Use a dedicated service account, not a personal user account.
- Assign only the Copilot Studio roles and Power Platform roles needed for the specific workflows being automated.
- Do not use a Global Administrator or Power Platform Administrator account for routine automation.

### Avoid logging sensitive page content

Snapshots and screenshots may contain sensitive data visible in the UI (for example, policy numbers, customer information, agent secrets). Log snapshots and screenshots only to secured, access-controlled storage. Do not include raw snapshot output in uncontrolled logging pipelines.

---

## Code Organization

### Structure workflows as declarative step sequences

Organize automation workflows as a linear sequence of named steps, each with a clear description of what it does and what state it expects:

```text
Step 1: Navigate to Copilot Studio
Step 2: Select target agent
Step 3: Open topic editor for "Order Status"
Step 4: Add trigger phrase "Where is my order?"
Step 5: Save topic
Step 6: Publish agent
Step 7: Verify published state
```

This structure makes the workflow readable, auditable, and easier to debug.

### Name elements descriptively in action calls

The `element` parameter in every action call is documentation. Use a description that communicates both what the element is and why it is being targeted:

```text
-- Good
browser_click element="Publish button in agent editor header" ref="<ref>"

-- Less useful
browser_click element="button" ref="<ref>"
```

### Group snapshot-action pairs

Keep snapshots and the actions that depend on them logically adjacent. Avoid interleaving unrelated operations between a snapshot and the actions that use its refs.

---

## Testing and Validation

### Validate automation in a non-production environment first

Always execute and validate automation workflows in a development or test Power Platform environment before running them against production. Copilot Studio agent state, published content, and channel configurations are environment-specific.

### Use test chat validation as a workflow checkpoint

After publishing an agent or modifying a topic, include a test chat interaction in the automation workflow to validate that the change produces the expected conversational behavior:

```text
browser_click element="Test your agent button" ref="<ref>"
browser_wait_for text="Type a message"
browser_snapshot
browser_type element="Test message input" ref="<ref>" text="<test phrase>"
browser_click element="Send button" ref="<ref>"
browser_wait_for text="<expected response text>"
```

### Verify idempotency

Where possible, design workflows to be safely re-runnable. Before creating a resource, check whether it already exists. Before publishing, verify the current published state. This prevents duplicate entities and unintended overwrites when workflows are retried.
