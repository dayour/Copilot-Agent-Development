# Agent Creation

> Navigate to copilotstudio.microsoft.com, create a new agent, and set the agent name, description, and initial model. This runbook produces a provisioned, draft agent ready for further configuration.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running in headed mode
- User is authenticated to the Microsoft 365 tenant with Copilot Studio Maker permissions
- Target environment is provisioned and accessible
- Agent name, description, and model selection are decided before execution

## Placeholders

Replace the following values before executing:

| Placeholder | Description |
|---|---|
| `[AGENT_NAME]` | Display name for the new agent (e.g., "Claims Assistant") |
| `[AGENT_DESCRIPTION]` | One or two sentence description of the agent's purpose |
| `[ENV_NAME]` | Target environment display name (e.g., "Contoso Dev") |

---

## Steps

### Step 1: Navigate to Copilot Studio Home

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

**Expected Result**: Copilot Studio home page begins loading.

---

### Step 2: Capture Home Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

**Expected Result**: Home page is fully loaded with agent creation interface visible.

[VERIFY] Page contains "Copilot Studio" in the heading. If a Microsoft login form appears instead, complete authentication before proceeding (see [13-authentication-verification.md](13-authentication-verification.md)).

---

### Step 3: Confirm Correct Environment

**Tool**: `browser_snapshot`

[VERIFY] The environment switcher in the top navigation bar shows `[ENV_NAME]`. If it shows a different environment, execute [12-environment-switching.md](12-environment-switching.md) before continuing.

---

### Step 4: Click New Agent or Create Button [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "New agent or Create button on the Copilot Studio home page"
- ref: `[from snapshot]`

**Expected Result**: The agent creation dialog or creation flow opens.

[VERIFY] An agent creation form, prompt input, or creation wizard is visible in the snapshot.

NOTE: The button may be labeled "New agent", "+ New agent", or "Create". Look for a prominent action button on the home page.

---

### Step 5: Enter Agent Use Case Description

**Tool**: `browser_type`
**Parameters**:
- element: "Agent creation prompt input field or describe your agent textarea"
- ref: `[from snapshot]`
- text: `[AGENT_DESCRIPTION]`
- submit: false

**Expected Result**: The description text appears in the creation prompt field.

[VERIFY] Full text is entered without truncation.

---

### Step 6: Submit the Creation Form [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Create or Next button in the agent creation form"
- ref: `[from snapshot]`

**Expected Result**: Copilot Studio begins provisioning the new agent.

[VERIFY] A loading indicator, provisioning progress message, or the new agent overview page appears.

---

### Step 7: Wait for Agent Provisioning

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Overview"
- time: 45

**Expected Result**: The agent overview page loads within 45 seconds.

NOTE: Provisioning typically completes in 10-30 seconds. If the wait times out, take a snapshot and check the current state before retrying.

---

### Step 8: Verify Agent Overview Page [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The agent overview page is displayed. Navigation tabs (Knowledge, Topics, Actions, Channels) are visible.

---

### Step 9: Open Agent Details or Settings

**Tool**: `browser_click`
**Parameters**:
- element: "Settings tab or Agent details link in the configuration navigation"
- ref: `[from snapshot]`

**Expected Result**: The agent details or settings page loads.

---

### Step 10: Set Agent Name [SNAPSHOT]

**Tool**: `browser_snapshot`

Locate the agent name field.

**Tool**: `browser_type`
**Parameters**:
- element: "Agent name input field"
- ref: `[from snapshot]`
- text: `[AGENT_NAME]`

**Expected Result**: Agent name field shows `[AGENT_NAME]`.

[VERIFY] The name field contains the intended value with no extra characters.

---

### Step 11: Set Agent Description [SNAPSHOT]

**Tool**: `browser_snapshot`

Locate the agent description field.

**Tool**: `browser_type`
**Parameters**:
- element: "Agent description input field or textarea"
- ref: `[from snapshot]`
- text: `[AGENT_DESCRIPTION]`

**Expected Result**: Description field shows the full description text.

[VERIFY] Text is not truncated. Character limits are respected (typically 500 characters for description).

---

### Step 12: Save Agent Details [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the agent settings page"
- ref: `[from snapshot]`

**Expected Result**: Settings are saved and a success indicator appears.

[VERIFY] A "Saved", checkmark, or equivalent confirmation is visible. No error banners are present.

---

### Step 13: Capture Final State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] Confirm all of the following:
- Agent name shows `[AGENT_NAME]`
- Agent description is present
- Agent is in draft/unpublished state (not yet published)
- No error messages or provisioning failures are displayed

---

## Verification

- Agent overview page loads without errors
- Agent name matches `[AGENT_NAME]`
- Agent description matches `[AGENT_DESCRIPTION]`
- Agent appears in the Copilot Studio agent list under the target environment
- Agent is in draft state, ready for further configuration

## Rollback

1. Navigate to `https://copilotstudio.microsoft.com/`
2. Locate the newly created agent in the agent list
3. Open the three-dot overflow menu on the agent row
4. Select "Delete" and confirm deletion
5. Re-execute this runbook from Step 1 with corrected inputs

## Next Steps

After agent creation completes, proceed to:
- [02-model-selection.md](02-model-selection.md) to set the AI model
- [03-instructions-authoring.md](03-instructions-authoring.md) to configure agent instructions
