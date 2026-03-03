# Model Selection

> Switch the AI model used by a Copilot Studio agent between GPT-4o, GPT-4o-mini, and other available models. This runbook targets the generative AI settings page of an existing agent.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent exists and is in an editable (non-locked) state
- Desired model is available in the target environment's AI Builder quota

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID), found in the Copilot Studio URL |
| `[BOT_ID]` | Agent (bot) ID (GUID), found in the Copilot Studio URL |
| `[TARGET_MODEL]` | Model to select, e.g., "GPT-4o", "GPT-4o-mini" |

---

## Steps

### Step 1: Navigate to Generative AI Settings

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/manage/advancedSettings`

**Expected Result**: Browser navigates to the generative AI settings page for the target agent.

NOTE: Replace `[ENV_ID]` and `[BOT_ID]` with actual GUIDs. For preview environments substitute `copilotstudio.preview.microsoft.com`.

---

### Step 2: Capture Current Settings State [SNAPSHOT]

**Tool**: `browser_snapshot`

**Expected Result**: Generative AI settings page is loaded.

[VERIFY] The following sections are visible:
- Generative AI orchestration toggle
- Primary response model selector showing the current model
- Content moderation setting

---

### Step 3: Confirm Generative Orchestration is Enabled [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The "Use generative AI orchestration" or equivalent toggle is in the ON state.

NOTE: Model selection only takes effect when generative orchestration is enabled. If the toggle is OFF, click it to enable before proceeding.

#### Step 3a: Enable Orchestration if OFF

**Tool**: `browser_click`
**Parameters**:
- element: "Use generative AI orchestration toggle"
- ref: `[from snapshot]`

**Expected Result**: Toggle switches to ON state.

[VERIFY] Toggle now shows as enabled. Proceed only if toggle is ON.

---

### Step 4: Locate the Model Selector [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] A model selection control is visible. It may be:
- A dropdown (combobox) showing the current model name
- A set of radio buttons listing available models
- A button that opens a model selection panel

Note the current model value before changing it.

---

### Step 5: Open the Model Selection Control

**Tool**: `browser_click`
**Parameters**:
- element: "Primary response model selector or model dropdown"
- ref: `[from snapshot]`

**Expected Result**: The model selection options expand or a model picker panel opens.

[VERIFY] Available models are listed. Expected models include:
- GPT-4o
- GPT-4o-mini
- GPT-4 (if available in the environment)

---

### Step 6: Select the Target Model [SNAPSHOT]

**Tool**: `browser_snapshot`

Locate the `[TARGET_MODEL]` option in the list.

**Tool**: `browser_click`
**Parameters**:
- element: "Model option for [TARGET_MODEL]"
- ref: `[from snapshot]`

**Expected Result**: `[TARGET_MODEL]` is now selected.

[VERIFY] The model selector shows `[TARGET_MODEL]` as the active selection.

---

### Step 7: Save the Model Change [SNAPSHOT]

**Tool**: `browser_snapshot`

Look for a Save button. If the page uses auto-save, no explicit save action is required.

If a Save button is present:

**Tool**: `browser_click`
**Parameters**:
- element: "Save button on the generative AI settings page"
- ref: `[from snapshot]`

**Expected Result**: Settings are saved.

[VERIFY] A "Saved", confirmation banner, or equivalent indicator is visible. No error messages are present.

---

### Step 8: Confirm Model Selection Persisted [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/manage/advancedSettings`

**Tool**: `browser_snapshot`

[VERIFY] After reloading the settings page, the model selector shows `[TARGET_MODEL]`. This confirms the change was persisted, not just shown in UI state.

---

## Verification

- Generative AI orchestration is enabled
- Primary response model shows `[TARGET_MODEL]`
- No error banners or quota warnings are present
- Setting persists after page reload

## Rollback

1. Navigate back to the Generative AI settings page (Step 1 URL)
2. Open the model selector
3. Select the previously active model
4. Save the change
5. Verify the previous model is restored via a page reload

## Fallback: Model Not Visible in Selector

If `[TARGET_MODEL]` does not appear in the model list:

1. Verify your environment has AI Builder credits or the model is enabled in the Power Platform admin center
2. Navigate to `https://admin.powerplatform.microsoft.com/` and confirm the target model is available for the environment
3. Contact a Power Platform administrator to enable the model if needed
