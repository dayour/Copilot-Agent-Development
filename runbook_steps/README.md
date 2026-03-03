# Copilot Studio Browser Automation Runbook Library

> A comprehensive library of browser-automation runbooks for operating Microsoft Copilot Studio via copilotbrowser-cli. Each runbook is independently executable and covers an operation that has no stable API surface.

## Session Setup

All runbooks share the following copilotbrowser-cli session configuration.

Start the browser session once before executing any runbook:

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

| Flag | Value | Purpose |
|---|---|---|
| `--session-name` | `mcs` | Shared session name so every runbook can attach to the same browser context |
| `--headed` | (flag) | Visible browser window required for initial auth and MFA flows |
| `--filter=interactive` | (flag) | Restricts snapshots to interactive elements, reducing token cost |

The `-s=mcs` shorthand is accepted wherever the full `--session-name=mcs` appears.

## Snapshot and Verify Conventions

- `[SNAPSHOT]` -- Take a `browser_snapshot` immediately after any navigation or state change. Capture the `ref` values needed for the next click or type action.
- `[VERIFY]` -- Confirm the expected outcome is visible in the snapshot before proceeding. Stop and investigate if the expected element or text is absent.

## Runbook Index

### Core Operations

| File | Title | Description |
|---|---|---|
| [01-agent-creation.md](01-agent-creation.md) | Agent Creation | Navigate to copilotstudio.microsoft.com, create a new agent, set name, description, and model |
| [02-model-selection.md](02-model-selection.md) | Model Selection | Switch between GPT-4o, GPT-4o-mini, and other available models |
| [03-instructions-authoring.md](03-instructions-authoring.md) | Instructions Authoring | Set agent instructions via the UI (Dataverse API primary path also documented) |
| [04-knowledge-source-management.md](04-knowledge-source-management.md) | Knowledge Source Management | Add and remove SharePoint, file, website, and Dataverse knowledge sources |
| [05-tool-and-action-management.md](05-tool-and-action-management.md) | Tool and Action Management | Add MCP servers, connectors, and Power Automate flows as actions |

### Topic Operations

| File | Title | Description |
|---|---|---|
| [06-topic-creation-yaml.md](06-topic-creation-yaml.md) | Topic Creation via YAML Code Editor | Open code editor, paste validated YAML, save and verify |
| [07-topic-trigger-phrase-updates.md](07-topic-trigger-phrase-updates.md) | Topic Trigger Phrase Updates | Modify trigger phrases for existing topics |
| [08-topic-testing.md](08-topic-testing.md) | Topic Testing | Drive the test chat panel, send utterances, capture responses |

### Publishing and Channels

| File | Title | Description |
|---|---|---|
| [09-publish-agent.md](09-publish-agent.md) | Publish Agent | Publish via UI (PAC CLI primary path also documented) |
| [10-enable-teams-channel.md](10-enable-teams-channel.md) | Enable Teams Channel | Turn on the Microsoft Teams channel and submit for admin approval |
| [11-enable-web-chat.md](11-enable-web-chat.md) | Enable Web Chat | Configure and embed the web chat widget |

### Session Management

| File | Title | Description |
|---|---|---|
| [12-environment-switching.md](12-environment-switching.md) | Environment Switching | Switch between dev, test, and prod environments |
| [13-authentication-verification.md](13-authentication-verification.md) | Authentication Verification | Verify the logged-in account and environment match expectations |

## Selector Guidance

UI selectors can shift between Copilot Studio preview and production releases. Before using any hardcoded `ref` value, consult:

- [knowledge/ui-automation/selectors.md](knowledge/ui-automation/selectors.md) -- Landmark element patterns, stable aria labels, and fallback strategies

## Fallback Strategy

When a UI selector stops working:

1. Run `browser_snapshot` and scan the accessibility tree for elements with matching text or role.
2. Use the element's `aria-label`, `role`, or visible text as the `element` parameter in `browser_click` or `browser_type`.
3. If the target element does not appear, navigate directly to the deep link URL documented in each runbook step.
4. If deep links are also unavailable, check the Copilot Studio release notes for navigation changes and update the runbook selector.

## Notes

- Each runbook opens with a Prerequisites section listing what must be true before execution.
- All placeholder values (environment IDs, agent IDs, SharePoint URLs) are marked with `[REPLACE]` and must be substituted before execution.
- Commands and parameters in each runbook are copy-pasteable with no pseudo-code.
