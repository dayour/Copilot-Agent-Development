# Instructions Authoring

> Set or update the system-level instructions for a Copilot Studio agent. Covers both the UI approach (via the Overview page Instructions editor) and the Dataverse API approach (primary recommended path for CI/CD pipelines).

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent exists and is in an editable state
- Instructions text is prepared and validated before execution

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[INSTRUCTIONS_TEXT]` | Full instructions content to apply |

---

## Primary Path: Dataverse API (Recommended for Automation)

The Dataverse API is more reliable than the UI for setting instructions programmatically, especially in CI/CD pipelines. Use the UI path below when the API is unavailable or when validating instructions visually.

### Dataverse API Approach

The agent instructions are stored in the `botcomponent` Dataverse table. To update via API:

```
PATCH https://[ORG].crm.dynamics.com/api/data/v9.2/botcomponents([BOTCOMPONENT_ID])
Content-Type: application/json
Authorization: Bearer [TOKEN]

{
  "schemaname": "main",
  "content": "[INSTRUCTIONS_TEXT]"
}
```

To retrieve the `[BOTCOMPONENT_ID]` for the main instructions component:

```
GET https://[ORG].crm.dynamics.com/api/data/v9.2/botcomponents?$filter=botid/botid eq [BOT_ID] and componenttype eq 2&$select=botcomponentid,name
```

The PAC CLI can also update instructions via solution export and import, which is preferred for production deployments. See [09-publish-agent.md](09-publish-agent.md) for the PAC CLI approach.

---

## UI Path: Steps

### Step 1: Navigate to Agent Overview

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/`

**Expected Result**: Agent overview page loads.

---

### Step 2: Capture Overview Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The agent overview page is visible with an Instructions section or "Configure" prompt visible.

---

### Step 3: Locate the Instructions Section

**Tool**: `browser_snapshot`

[VERIFY] An "Instructions" section, card, or text area is visible on the overview page. It may show existing instructions text or an "Add instructions" prompt.

NOTE: If instructions are displayed as collapsed or read-only text, look for an "Edit" button adjacent to the instructions section.

---

### Step 4: Click Edit Instructions [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Edit button near the Instructions section on the agent overview page"
- ref: `[from snapshot]`

**Expected Result**: The instructions editor opens (inline text area or modal).

[VERIFY] An editable text area containing the current instructions is visible.

---

### Step 5: Clear Existing Instructions

**Tool**: `browser_click`
**Parameters**:
- element: "Instructions text area or editor"
- ref: `[from snapshot]`

Select all existing text:

**Tool**: `browser_press_key`
**Parameters**:
- key: "Control+a"

**Expected Result**: All existing instruction text is selected.

---

### Step 6: Enter New Instructions [SNAPSHOT]

**Tool**: `browser_type`
**Parameters**:
- element: "Instructions text area or editor"
- ref: `[from snapshot]`
- text: `[INSTRUCTIONS_TEXT]`
- slowly: false

**Expected Result**: The instructions text area contains the full `[INSTRUCTIONS_TEXT]` content.

[VERIFY] Text is not truncated. Scroll through the editor to confirm all content is present if the text is longer than one visible page.

---

### Step 7: Save Instructions [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the instructions editor"
- ref: `[from snapshot]`

**Expected Result**: Instructions are saved and the editor closes or the text transitions to read-only display.

[VERIFY] A "Saved" indicator or confirmation message is visible. The instructions section on the overview page shows the updated text.

---

### Step 8: Confirm Instructions Persisted [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/`

**Tool**: `browser_snapshot`

[VERIFY] The Instructions section on the overview page shows the updated content. This confirms persistence, not just in-memory UI state.

---

## Verification

- Instructions text area contains the full `[INSTRUCTIONS_TEXT]` after save
- Instructions are visible on the agent overview page after page reload
- No error banners or save failures occurred

## Rollback

1. Navigate to the agent overview page
2. Open the instructions editor
3. Replace the content with the previous instructions text
4. Save
5. Verify the previous instructions are restored

## Instruction Authoring Best Practices

Structure instructions using the V1 micro-stepping pattern:

```
## Purpose
[One sentence: what the agent does and for whom]

## Guidelines
[Rules and constraints the agent must follow]

## Skills
[Capabilities the agent has, referencing knowledge sources or actions]

## Steps
[Step-by-step interaction pattern or escalation sequence]

## Error Handling
[How to respond when the agent cannot fulfill a request]

## Feedback
[How to invite user rating or escalate to a human]
```

Keep total instruction length under 4,000 tokens. Longer instructions may be silently truncated by the model.
