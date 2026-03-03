# UI Automation Selector Guidance

> Reference guide for locating and targeting Copilot Studio UI elements during browser automation. Use this document when a runbook step requires a `ref` value and you need to understand how to find the correct element in a snapshot.

## How Snapshots Work

`browser_snapshot` returns an accessibility tree of the current page. Each interactive element has:

- `ref` -- Unique runtime identifier. Must be obtained fresh from each snapshot; refs do not persist across page loads.
- `role` -- Accessibility role (button, textbox, link, checkbox, combobox, tab, etc.).
- `name` or `aria-label` -- Human-readable label for the element.

Use `role` and `name` to identify the correct element, then use its `ref` in the `browser_click` or `browser_type` call.

## Copilot Studio Navigation Landmarks

### Top Navigation Bar

| Element | Role | Expected Text or Label |
|---|---|---|
| Home link | link | "Home" |
| Agents list link | link | "Agents" |
| Environment switcher | button | Current environment name |
| Account/profile menu | button | User display name or initials |
| Publish button | button | "Publish" |

### Agent Configuration Left Navigation

| Element | Role | Expected Text or Label |
|---|---|---|
| Overview tab | tab or link | "Overview" |
| Knowledge tab | tab or link | "Knowledge" |
| Topics tab | tab or link | "Topics" |
| Actions tab | tab or link | "Actions" |
| Channels tab | tab or link | "Channels" |
| Settings tab | tab or link | "Settings" |

### Overview Page

| Element | Role | Expected Text or Label |
|---|---|---|
| Agent name heading | heading | Agent name text |
| Instructions text area | textbox or region | "Instructions" label visible nearby |
| Edit instructions button | button | "Edit" near the Instructions section |
| Model selector | combobox or button | Current model name (e.g., "GPT-4o") |
| Test your agent button | button | "Test your agent" or "Test" |

### Topics Page

| Element | Role | Expected Text or Label |
|---|---|---|
| Add topic button | button | "Add a topic" or "New topic" |
| Topic list rows | row or listitem | Topic name text |
| Topic three-dot menu | button | "More options" or "..." per topic row |
| Code editor toggle | button or tab | "Code editor" or "</>" |

### Knowledge Page

| Element | Role | Expected Text or Label |
|---|---|---|
| Add knowledge button | button | "Add knowledge" or "+ Add knowledge" |
| Knowledge source rows | row or listitem | Source name text |
| Remove source button | button | "Remove" or "Delete" in source row overflow menu |

### Channels Page

| Element | Role | Expected Text or Label |
|---|---|---|
| Microsoft Teams channel | listitem or row | "Microsoft Teams" |
| Teams enable toggle | switch or checkbox | "Microsoft Teams" toggle within the row |
| Web Chat channel | listitem or row | "Web chat" or "Custom website" |
| Web Chat embed code section | region | "Embed code" or "Copy embed code" |

### Publish Dialog

| Element | Role | Expected Text or Label |
|---|---|---|
| Publish confirmation button | button | "Publish" in the modal |
| Cancel button | button | "Cancel" |

### Environment Switcher

| Element | Role | Expected Text or Label |
|---|---|---|
| Environment dropdown | button | Current environment name (top navigation) |
| Environment search input | textbox | "Search environments" or placeholder text |
| Environment list item | option or listitem | Target environment name |

## Stable Selector Patterns

When the `ref` from a snapshot does not match any expected element, use these fallback patterns in the `element` parameter of `browser_click` or `browser_type`:

```
element: "button with text 'Publish'"
element: "tab labeled 'Knowledge'"
element: "textbox near label 'Instructions'"
element: "toggle for Microsoft Teams channel"
element: "Add knowledge button"
```

The MCP browser tools resolve `element` descriptions against visible text and aria labels, making them more resilient to layout changes than hardcoded `ref` values.

## Deep Link URL Patterns

Direct navigation is always more reliable than clicking through the UI. Use these URL patterns when selectors are unreliable:

| Target Page | URL Pattern |
|---|---|
| Agent overview | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/` |
| Topics | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/topics` |
| Knowledge | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/knowledge` |
| Actions | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/actions` |
| Channels | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels` |
| Settings | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/settings` |
| Generative AI settings | `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/manage/advancedSettings` |

Replace `[ENV_ID]` and `[BOT_ID]` with the values from your target environment and agent.

## Known Selector Fragility Points

| Area | Risk | Mitigation |
|---|---|---|
| Code editor toggle | Moves between preview and production UI | Look for role="tab" with text containing "Code" or "</>" |
| Model selector | Label changes with model availability updates | Use combobox role or look for the current model name text |
| Environment switcher | Can appear in top bar or sidebar | Look for a button containing the current environment name |
| Add knowledge button | Button text varies by UI language | Use role="button" and visible text "Add" near the Knowledge heading |
| Publish button | Can be disabled before all checklist items complete | Verify button is not aria-disabled before clicking |

## Copilot Studio Preview vs. Production URLs

Some environments use `copilotstudio.preview.microsoft.com` (preview) while others use `copilotstudio.microsoft.com` (production). Selectors are identical in both; only the host differs. Always confirm the base URL from your environment configuration before running a runbook.
