# Configure Agent Details and Model

> Set the agent name, description, and verify the GPT-5 Chat model is selected.

## Prerequisites

- Runbook 01-create-agent.md completed successfully
- Agent overview page is loaded in the browser
- Agent is in draft/unpublished state

## Steps

### Step 1: Verify Agent Overview Page

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent overview page is displayed with Details section visible.
**Verify**: Look for "Details", "Name", "Description", and "Model" fields in the snapshot.

---

### Step 2: Click Edit on Details Section

**Tool**: `browser_click`
**Parameters**:
- element: "Edit button on the Details section"
- ref: (obtain from snapshot -- look for an "Edit" link or pencil icon near the Details heading)

**Expected Result**: The Details section enters edit mode with editable fields.
**Verify**: Name, Description, and Model fields become editable inputs.

NOTE: In some Copilot Studio layouts, the details fields may already be directly editable. If so, skip this step and proceed to Step 3.

---

### Step 3: Set Agent Name

**Tool**: `browser_type`
**Parameters**:
- element: "Agent name input field"
- ref: (obtain from snapshot -- look for the Name text input)
- text: `Policy Advisor`

**Expected Result**: The agent name field shows "Policy Advisor".
**Verify**: Snapshot confirms the name field contains exactly "Policy Advisor".

NOTE: Clear any existing text in the field before typing. Use Select All (Ctrl+A) then type to replace.

---

### Step 4: Set Agent Description

**Tool**: `browser_type`
**Parameters**:
- element: "Agent description input field"
- ref: (obtain from snapshot -- look for the Description text input or textarea)
- text: `Provides guidance on HR, Legal, and company policies by searching knowledge sources and offering accurate, cited responses with suggested next steps.`

**Expected Result**: The description field shows the full text.
**Verify**: Snapshot confirms the description is entered without truncation.

NOTE: Clear any existing text in the field before typing. Use Select All (Ctrl+A) then type to replace.

---

### Step 5: Verify Model Selection

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Model field shows "GPT-5 Chat" or equivalent.
**Verify**: Confirm the model dropdown or display value reads "GPT-5 Chat".

---

### Step 6: Change Model if Needed

**Tool**: `browser_click`
**Parameters**:
- element: "Model dropdown selector"
- ref: (obtain from snapshot -- look for the Model dropdown or select element)

Then:

**Tool**: `browser_select_option` or `browser_click`
**Parameters**:
- element: "GPT-5 Chat option in the model dropdown"
- ref: (obtain from snapshot -- look for the GPT-5 Chat option)
- values: ["GPT-5 Chat"]

**Expected Result**: GPT-5 Chat is selected as the model.
**Verify**: Snapshot confirms "GPT-5 Chat" appears in the model field.

NOTE: Only execute this step if Step 5 shows a different model. If GPT-5 Chat is already selected, skip to Step 7.

---

### Step 7: Save Details

**Tool**: `browser_click`
**Parameters**:
- element: "Save button for agent details"
- ref: (obtain from snapshot -- look for a "Save" or "Done" button)

**Expected Result**: Details are saved and the overview page refreshes.
**Verify**: Snapshot shows the updated name and description in the Details section.

---

### Step 8: Confirm Details Saved

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent overview page displays:
- Name: Policy Advisor
- Description: Provides guidance on HR, Legal, and company policies...
- Model: GPT-5 Chat
**Verify**: All three fields match the expected values.

## Verification

- Agent name reads "Policy Advisor"
- Description matches the full text provided in Step 4
- Model is set to GPT-5 Chat
- No unsaved changes indicators are present

## Rollback

1. Click "Edit" on the Details section again
2. Revert the name, description, and model to previous values
3. Save the changes
