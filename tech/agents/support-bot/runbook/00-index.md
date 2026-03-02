# SupportBot Browser Automation Runbook

> Browser-automated configuration of SupportBot agent in Microsoft Copilot Studio via MCP copilotbrowser tools.

## Environment

| Property | Value |
|---|---|
| Environment | DYdev26 |
| Environment ID | e2bd2cb1-3e05-e886-81d2-16aa081a3e04 |
| Bot ID | 276dcc5a-3d47-f011-877a-7c1e52698560 |
| Connected Agent | WarrantyGuard |
| URL Base | `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/` |

## Prerequisites

- Browser MCP server (copilotbrowser) is connected and running
- User is authenticated to Microsoft Copilot Studio with sufficient permissions
- Target environment DYdev26 is accessible
- WarrantyGuard agent exists and is published in the same environment

## Execution Order

Each file is a self-contained runbook that can be executed independently if the browser is already on the correct page. For a full initial setup, execute in the order listed below.

| Order | File | Purpose |
|---|---|---|
| 1 | [01-navigate-and-authenticate.md](01-navigate-and-authenticate.md) | Navigate to SupportBot agent and confirm authentication |
| 2 | [02-generative-ai-settings.md](02-generative-ai-settings.md) | Configure generative AI orchestration, model selection, and content moderation |
| 3 | [03-connected-agents.md](03-connected-agents.md) | Enable connected agents toggle for multi-agent orchestration |
| 4 | [04-security-and-allowlist.md](04-security-and-allowlist.md) | Configure security settings and skill allowlist |
| 5 | [05-skills-management.md](05-skills-management.md) | Add WarrantyGuard as a connected skill |
| 6 | [06-agent-details.md](06-agent-details.md) | Verify agent identity, solution association, and channel configuration |
| 7 | [07-advanced-settings.md](07-advanced-settings.md) | Enable Application Insights telemetry and enhanced transcripts |
| 8 | [08-validation.md](08-validation.md) | Post-configuration validation sweep across all settings |

## Notes

- NOTE: Each step includes a `browser_snapshot` call to capture page state before and after changes.
- NOTE: The `ref` parameter for `browser_click` calls must be determined at runtime from the preceding `browser_snapshot` output. Placeholder values are marked with `[from snapshot]`.
- NOTE: If a login prompt appears at any point, refer to the authentication handling section in `01-navigate-and-authenticate.md`.
- WARNING: Always run `08-validation.md` after completing configuration to confirm all settings persisted correctly.
