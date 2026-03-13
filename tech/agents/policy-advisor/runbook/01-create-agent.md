# Create Policy Advisor Agent in Copilot Studio

> Navigate to Copilot Studio and create a new agent using the Agent creation flow.

## Prerequisites

- Copilot Studio access with agent creation permissions
- Target environment selected (GenAIClippy or equivalent)
- Browser session authenticated to the Copilot Studio tenant

## Steps

### Step 1: Navigate to Copilot Studio Home

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

**Expected Result**: Copilot Studio home page loads with the creation interface visible.
**Verify**: Page title contains "Copilot Studio" or "Microsoft Copilot Studio".

---

### Step 2: Verify Home Page Loaded

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Snapshot shows the Copilot Studio home page with navigation tabs visible.
**Verify**: Look for "Agent" and "Workflow" tabs in the snapshot output.

---

### Step 3: Click the Agent Tab

**Tool**: `browser_click`
**Parameters**:
- element: "Agent tab on the creation interface"
- ref: (obtain from snapshot -- look for the "Agent" tab element ref)

**Expected Result**: The Agent creation form is displayed.
**Verify**: The creation prompt input field is visible. Do NOT click "Workflow".

NOTE: If the Agent tab is already selected (active state), skip this step and proceed to Step 4.

---

### Step 4: Type the Use Case Description

**Tool**: `browser_type`
**Parameters**:
- element: "Agent creation prompt input field"
- ref: (obtain from snapshot -- look for the text input or textarea in the creation form)
- text: `Policy Advisory to address various HR, Legal, and other policies. The agent will search across knowledge sources to provide accurate responses and guidance with verifiable citations.`
- submit: false

**Expected Result**: The use case description text appears in the creation prompt field.
**Verify**: Snapshot confirms the full text is entered without truncation.

---

### Step 5: Submit the Agent Creation

**Tool**: `browser_click`
**Parameters**:
- element: "Submit or Create button on the agent creation form"
- ref: (obtain from snapshot -- look for a "Create" or submit button)

**Expected Result**: Copilot Studio begins provisioning the new agent.
**Verify**: A loading indicator or progress message appears.

---

### Step 6: Wait for Agent Provisioning

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Policy Advisor"
- time: 30

**Expected Result**: The agent is provisioned and the agent overview page loads.
**Verify**: The agent name or overview heading is visible on the page.

NOTE: Provisioning may take 10-30 seconds. If the wait times out, take a snapshot and check the current state before retrying.

---

### Step 7: Confirm Agent Created

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent overview page is displayed showing the newly created Policy Advisor agent.
**Verify**: Confirm the following are visible:
- Agent name (may be auto-generated at this point)
- Overview or Details section
- Navigation to Knowledge, Topics, and other configuration tabs

## Verification

- Agent overview page is loaded and accessible
- Agent appears in the Copilot Studio agent list
- No error messages or provisioning failures displayed

## Rollback

1. If the agent was created with incorrect settings, navigate to the agent list
2. Locate the newly created agent
3. Delete the agent from the overflow menu (three-dot menu) and confirm deletion
4. Re-execute this runbook from Step 1
