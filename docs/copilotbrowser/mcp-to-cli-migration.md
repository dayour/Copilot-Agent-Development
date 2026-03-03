# MCP to CLI Migration Guide

## Overview

This guide is the complete reference for migrating from Playwright MCP selector-driven browser automation to the copilotbrowser-cli ref-based workflow. It covers command-level translation, interaction model changes, session management, wait strategy replacement, error recovery, and performance characteristics.

Use this guide when you have existing Playwright MCP automation and need to move to copilotbrowser-cli without breaking existing behavior.

---

## Command Translation Table

The table below maps every commonly used Playwright MCP command to its copilotbrowser-cli equivalent. Where behavior differs, the Behavior column notes the key change.

| Playwright MCP Command | copilotbrowser-cli Equivalent | Behavior |
|---|---|---|
| `browser_navigate` | `browser_navigate` | Identical semantics; URL is the same parameter. |
| `browser_click` | `browser_click` | MCP takes a CSS selector; CLI takes a `ref` from the accessibility snapshot. |
| `browser_type` | `browser_type` | MCP targets by selector; CLI targets by `ref`. |
| `browser_fill` | `browser_fill` | CLI uses `ref` and a `value` field; no selector involvement. |
| `browser_select_option` | `browser_select_option` | Dropdown value selection is unchanged; element reference switches to `ref`. |
| `browser_check` / `browser_uncheck` | `browser_check` / `browser_uncheck` | Checkbox state control is identical; targeting uses `ref`. |
| `browser_hover` | `browser_hover` | Same action; `ref` replaces selector. |
| `browser_drag` | `browser_drag` | Source and target are both `ref` values instead of selectors. |
| `browser_press_key` | `browser_press_key` | Key name strings are unchanged. |
| `browser_screenshot` | `browser_take_screenshot` | CLI adds `filename` and `fullPage` parameters. |
| `browser_snapshot` | `browser_snapshot` | Returns accessibility tree with `ref` identifiers for all interactive elements. |
| `browser_wait_for` | `browser_wait_for` | CLI adds `text`, `textGone`, and `time` parameters; no selector-based polling. |
| `browser_close` | `browser_close` | Identical. |
| `browser_resize` | `browser_resize` | Identical. |
| `browser_handle_dialog` | `browser_handle_dialog` | Identical; `accept` boolean and optional `promptText`. |
| `browser_file_upload` | `browser_file_upload` | Identical; `paths` array. |
| `browser_evaluate` | `browser_evaluate` | CLI supports optional `ref` and `element` parameters for scoped evaluation. |
| `browser_network_requests` | `browser_network_requests` | Identical. |
| `browser_console_messages` | `browser_console_messages` | Identical. |
| `browser_tabs` | `browser_tabs` | CLI uses `action` (list, new, close, select) and optional `index`. |
| `browser_navigate_back` | `browser_navigate_back` | Identical. |

---

## Selector to Ref Migration

### How refs work

In copilotbrowser-cli, every interaction with a page element uses a `ref` -- a stable string identifier derived from the accessibility tree snapshot. The snapshot is obtained by calling `browser_snapshot`, which returns all interactive elements with their human-readable descriptions and assigned `ref` values.

The key conceptual shift:

- Playwright MCP: you author a CSS or XPath selector that targets a DOM node directly.
- copilotbrowser-cli: you call `browser_snapshot`, read the returned accessibility tree, identify the element by its description and role, and use the `ref` value in subsequent action calls.

### Step-by-step conversion

1. Call `browser_snapshot` to capture the current page accessibility tree.
2. Locate the target element in the snapshot output by its visible label, role, or description.
3. Copy the `ref` value for that element.
4. Pass the `ref` and the human-readable `element` description to the action call.

### Common CSS selector patterns and their ref-based replacements

| CSS selector pattern | Legacy MCP usage | copilotbrowser-cli approach |
|---|---|---|
| `button[type="submit"]` | `browser_click selector="button[type='submit']"` | Snapshot, find button with label "Submit" or "Save", use its `ref`. |
| `input[name="email"]` | `browser_type selector="input[name='email']" text="..."` | Snapshot, find textbox labeled "Email", use its `ref` with `browser_type`. |
| `#main-nav a.active` | `browser_click selector="#main-nav a.active"` | Snapshot, find link with matching visible text in navigation, use its `ref`. |
| `select#country` | `browser_select_option selector="select#country"` | Snapshot, find combobox labeled "Country", use its `ref` with `browser_select_option`. |
| `.modal .btn-confirm` | `browser_click selector=".modal .btn-confirm"` | Snapshot after modal opens, find the confirmation button by its label, use its `ref`. |
| `[aria-label="Close"]` | `browser_click selector="[aria-label='Close']"` | Snapshot, find button with description "Close", use its `ref` directly. |
| `table tbody tr:nth-child(2) td:first-child` | `browser_evaluate selector="..."` | Snapshot to read table structure; use `browser_evaluate` with scoped `ref` for structured data extraction. |

### Snapshot-driven interaction pattern

```text
1. browser_navigate url="https://example.com/page"
2. browser_snapshot
   -- Returns accessibility tree with ref values for all interactive elements
3. Identify target element from snapshot output
   -- Example: button ref="btn-42" description="Confirm Order"
4. browser_click element="Confirm Order button" ref="btn-42"
```

### Handling dynamic content

When the page updates after an interaction, refs from the previous snapshot become stale. Always re-snapshot after navigation, form submission, modal open/close, or any action that causes DOM changes.

---

## Session Management Differences

### Playwright MCP model

Playwright MCP manages browser sessions implicitly. Each tool invocation shares a single underlying browser context unless explicitly configured otherwise. Session isolation is handled at the Playwright level with separate browser contexts or pages.

### copilotbrowser-cli model

copilotbrowser-cli uses a single implicit session per agent conversation turn. There are no named session parameters in individual commands. The browser state (current URL, cookies, local storage, DOM) persists across all calls within the same invocation context.

### Tab management

While session management is implicit, copilotbrowser-cli provides explicit tab control through `browser_tabs`:

| Operation | copilotbrowser-cli call |
|---|---|
| List all open tabs | `browser_tabs action="list"` |
| Open a new tab | `browser_tabs action="new"` |
| Switch to tab by index | `browser_tabs action="select" index=2` |
| Close specific tab | `browser_tabs action="close" index=1` |
| Close current tab | `browser_tabs action="close"` |

### Migration notes

- Remove any session-identifier parameters from migrated scripts; they are not applicable in copilotbrowser-cli.
- Use `browser_tabs` for workflows that previously managed multiple browser contexts or windows.
- If your Playwright MCP scripts relied on browser context isolation for test independence, implement logical separation through sequential navigation and state verification steps instead.

---

## Wait Strategy Changes

### Playwright MCP approach

Playwright MCP exposes Playwright's rich waiting primitives directly:

- `waitForSelector` -- waits until a CSS selector matches a visible or attached element.
- `waitForNavigation` -- waits for page load events.
- `waitForFunction` -- waits until an arbitrary JavaScript predicate returns truthy.
- `waitForTimeout` -- unconditional time-based wait.

### copilotbrowser-cli approach

copilotbrowser-cli replaces selector-based waiting with three higher-level parameters in `browser_wait_for`:

| Parameter | Type | Description |
|---|---|---|
| `text` | string | Waits until the specified text appears anywhere on the page. |
| `textGone` | string | Waits until the specified text disappears from the page. |
| `time` | number | Waits unconditionally for the specified number of seconds. |

### Migration mapping

The `text` and `textGone` parameters in `browser_wait_for` match against any visible text anywhere on the page, not scoped to a specific element. Choose text values that are unique to the expected page state to avoid false positives.

| Playwright MCP wait pattern | copilotbrowser-cli replacement |
|---|---|
| `waitForSelector(".success-banner")` | `browser_wait_for text="Your order was confirmed"` |
| `waitForSelector(".spinner", {state: "hidden"})` | `browser_wait_for textGone="Loading"` |
| `waitForNavigation()` | `browser_wait_for text="<landmark text on destination page>"` |
| `waitForTimeout(2000)` | `browser_wait_for time=2` |
| `waitForFunction(() => document.readyState === "complete")` | `browser_wait_for text="<reliable visible text when page is ready>"` |

### Snapshot-polling as a wait pattern

For cases where neither text appearance nor disappearance maps cleanly, use a snapshot-poll loop:

```text
Repeat up to N times:
  browser_snapshot
  If target element ref is present in snapshot:
    Proceed
  Else:
    browser_wait_for time=1
Raise error if element not found after N attempts
```

This replaces Playwright's `waitForSelector` with a series of accessibility snapshots, which also validates element interactability rather than only DOM presence.

---

## Error Recovery Patterns

### Stale ref handling

A ref obtained from a previous snapshot becomes invalid when the DOM changes. Stale ref errors occur when an action is called with a ref that no longer exists in the current accessibility tree.

Recovery pattern:

```text
Attempt action with existing ref
If error indicates stale or missing ref:
  browser_snapshot
  Re-identify target element in new snapshot
  Retry action with updated ref
```

Recommendation: always re-snapshot immediately after any of the following:

- Page navigation
- Form submission
- Modal or dialog open/close
- AJAX-driven content updates
- Tab switch

### Retry loop for transient failures

For actions susceptible to timing issues or transient network failures:

```text
maxAttempts = 3
attempt = 0
While attempt < maxAttempts:
  browser_snapshot
  If target element present:
    Attempt action
    If action succeeds:
      Break
    Else:
      attempt += 1
      browser_wait_for time=2
  Else:
    attempt += 1
    browser_wait_for time=2
If attempt == maxAttempts:
  Log failure and escalate
```

### Page reload recovery

When the page enters an unrecoverable state (blank page, error page, broken partial render):

```text
browser_snapshot
If error page indicator text present OR page is blank:
  browser_navigate url="<last known good URL>"
  browser_wait_for text="<reliable landmark text>"
  Re-execute workflow from last known good step
```

### Dialog and alert interception

Unexpected dialogs block further interaction. Always include dialog handling in automation sequences where dialogs may appear:

```text
browser_handle_dialog accept=true
-- or --
browser_handle_dialog accept=false promptText="cancel reason"
```

If a dialog is not expected but appears, the unhandled dialog will block the next action. Implement dialog handling as a recovery step when an action unexpectedly fails.

### Navigation timeout recovery

If a navigation action does not reach the expected page within a reasonable time:

```text
browser_navigate url="<target URL>"
browser_wait_for text="<expected landmark>" time=30
If text not found after wait:
  browser_navigate_back
  browser_wait_for time=2
  browser_navigate url="<target URL>"
  browser_wait_for text="<expected landmark>" time=30
```

---

## Performance Comparison

The table below summarizes observed differences between Playwright MCP and copilotbrowser-cli across the primary operational dimensions relevant to Copilot Studio agent workflows.

| Dimension | Playwright MCP | copilotbrowser-cli | Notes |
|---|---|---|---|
| Token usage per interaction | Higher -- selector strings, raw DOM content, and verbose API responses contribute to large context payloads | Lower -- accessibility snapshots are compact; refs replace verbose selector strings | Token reduction is most pronounced on pages with complex DOM structures. |
| Latency per action | Lower for direct selector actions (no snapshot step required) | Slightly higher when snapshot-first pattern is used; comparable for actions where snapshot is already cached | Net latency difference is typically under 500ms per action in steady-state flows. |
| Reliability on dynamic pages | Moderate -- selector fragility increases with dynamically generated class names or attribute values | High -- accessibility tree-based refs are stable against CSS and class name changes | Ref-based targeting reduces flakiness caused by build-time CSS hash changes. |
| Reliability on accessible pages | Moderate -- depends on DOM structure | High -- accessibility roles and labels are first-class identifiers | Pages with strong accessibility compliance yield the most reliable refs. |
| Reliability on inaccessible pages | High -- CSS selectors can target any DOM node regardless of accessibility | Lower -- elements without accessible roles or labels may not surface in snapshots | For Copilot Studio and Power Platform pages, accessibility compliance is high; this gap is minimal in practice. |
| Error verbosity | High -- Playwright errors include stack traces and selector context | Medium -- CLI errors are action-level; stale ref errors require a re-snapshot cycle | Add explicit snapshot-before-action steps in production automation for self-documenting error context. |
| ALM and portability | Tightly coupled to Playwright API version | Decoupled from browser engine specifics; ref format is stable across CLI versions | CLI tooling is better suited to long-lived agent workflows that must survive platform updates. |
| Copilot Studio integration | Requires MCP tool registration and Playwright runtime in environment | Native integration; CLI commands map directly to copilotbrowser tool schema | copilotbrowser-cli is the recommended path for new Copilot Studio agent browser automation. |

### Token usage guidance

To minimize token usage in copilotbrowser-cli workflows:

1. Call `browser_snapshot` once per logical page state, not before every individual action.
2. Cache the ref value for an element and reuse it for multiple sequential actions on the same element without re-snapshotting, as long as no DOM changes have occurred.
3. Use `browser_wait_for text=` instead of polling snapshots in a tight loop when the completion signal is a visible text change.
4. Use `browser_take_screenshot` sparingly; screenshots carry higher token cost than snapshots.
