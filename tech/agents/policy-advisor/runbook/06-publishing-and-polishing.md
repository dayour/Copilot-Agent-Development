# Publish and Polish the Agent

> Complete the 10-item publishing checklist and enable channels for the Policy Advisor agent.

## Prerequisites

- Runbooks 01 through 05 completed successfully
- Agent is fully configured with name, description, model, instructions, and knowledge sources
- Agent icon file prepared (PNG format, under 30KB, white transparent background)
- Publishing metadata values confirmed (developer name, website URL, privacy URL, terms URL)

## Publishing Checklist

The following 10 items must be completed before publishing. Execute each step in order.

## Steps

### Step 1: Verify Agent Name (Checklist Item 1)

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Agent overview page is visible.
**Verify**: Agent name reads "Policy Advisor". If incorrect, navigate to Details and correct it per runbook 02.

---

### Step 2: Configure Channels (Checklist Item 2)

**Tool**: `browser_click`
**Parameters**:
- element: "Channels tab or section in agent configuration"
- ref: (obtain from snapshot -- look for "Channels" tab)

**Expected Result**: The Channels configuration page loads.
**Verify**: Channel options for Teams and Microsoft 365 Copilot are visible.

---

### Step 3: Enable Teams Channel

**Tool**: `browser_click`
**Parameters**:
- element: "Microsoft Teams channel toggle or enable button"
- ref: (obtain from snapshot -- look for Teams channel option)

**Expected Result**: Teams channel is enabled.
**Verify**: Teams channel shows as active/enabled.

NOTE: If Teams is already enabled, skip this step.

---

### Step 4: Enable Microsoft 365 Copilot Channel

**Tool**: `browser_click`
**Parameters**:
- element: "Microsoft 365 Copilot channel toggle or enable button"
- ref: (obtain from snapshot -- look for M365 Copilot channel option)

**Expected Result**: Microsoft 365 Copilot channel is enabled.
**Verify**: M365 Copilot channel shows as active/enabled.

NOTE: If M365 Copilot is already enabled, skip this step.

---

### Step 5: Upload Agent Icon (Checklist Item 3)

**Tool**: `browser_snapshot`
**Parameters**: (none)

Navigate to the agent settings or details where the icon can be uploaded.

**Tool**: `browser_click`
**Parameters**:
- element: "Agent icon upload area or change icon button"
- ref: (obtain from snapshot -- look for icon upload control)

**Expected Result**: File upload dialog opens.
**Verify**: File chooser is active.

NOTE: The icon must be PNG format, under 30KB, with a white transparent background. Prepare the file before executing this step.

---

### Step 6: Set Agent Color (Checklist Item 4)

**Tool**: `browser_click`
**Parameters**:
- element: "Color picker or color input field for the agent"
- ref: (obtain from snapshot -- look for color selector)

**Expected Result**: Color picker opens or color input is editable.
**Verify**: A color value can be entered or selected.

NOTE: Choose a brand-appropriate color. Enter a hex value if a text input is available.

---

### Step 7: Set Developer Name (Checklist Item 5)

**Tool**: `browser_type`
**Parameters**:
- element: "Developer name input field"
- ref: (obtain from snapshot -- look for "Developer name" or "Created by" field)
- text: `Company IT`

**Expected Result**: Developer name field shows the entered value.
**Verify**: Snapshot confirms the developer name.

WARNING: Replace "Company IT" with the actual developer or team name before execution.

---

### Step 8: Set Website URL (Checklist Item 6)

**Tool**: `browser_type`
**Parameters**:
- element: "Website URL input field"
- ref: (obtain from snapshot -- look for "Website" URL field)
- text: `https://company.example.com`

**Expected Result**: Website URL field shows the entered value.
**Verify**: Snapshot confirms the URL.

WARNING: Replace with the actual company website URL before execution.

---

### Step 9: Set Privacy Statement URL (Checklist Item 7)

**Tool**: `browser_type`
**Parameters**:
- element: "Privacy statement URL input field"
- ref: (obtain from snapshot -- look for "Privacy" or "Privacy statement" URL field)
- text: `https://company.example.com/privacy`

**Expected Result**: Privacy statement URL field shows the entered value.
**Verify**: Snapshot confirms the URL.

WARNING: Replace with the actual privacy statement URL before execution.

---

### Step 10: Set Terms of Use URL (Checklist Item 8)

**Tool**: `browser_type`
**Parameters**:
- element: "Terms of use URL input field"
- ref: (obtain from snapshot -- look for "Terms of use" or "Terms" URL field)
- text: `https://company.example.com/terms`

**Expected Result**: Terms of use URL field shows the entered value.
**Verify**: Snapshot confirms the URL.

WARNING: Replace with the actual terms of use URL before execution.

---

### Step 11: Set Short Description (Checklist Item 9)

**Tool**: `browser_type`
**Parameters**:
- element: "Short description input field"
- ref: (obtain from snapshot -- look for "Short description" field, max 80 characters)
- text: `Policy guidance for HR, Legal, and company policies with cited sources.`

**Expected Result**: Short description field shows the entered text (under 80 characters).
**Verify**: Text is within the 80-character limit.

---

### Step 12: Set Long Description (Checklist Item 10)

**Tool**: `browser_type`
**Parameters**:
- element: "Long description input field"
- ref: (obtain from snapshot -- look for "Long description" or "Full description" textarea)
- text: `Policy Advisor helps employees navigate HR, Legal, and company policies. It searches across internal knowledge sources including SharePoint policy libraries and the company website to provide accurate, cited responses with actionable next steps. Ask about remote work policies, leave guidelines, compliance requirements, and more.`

**Expected Result**: Long description field shows the full text.
**Verify**: Text is entered without truncation.

---

### Step 13: Publish the Agent

**Tool**: `browser_click`
**Parameters**:
- element: "Publish button"
- ref: (obtain from snapshot -- look for "Publish" button, typically in the top action bar)

**Expected Result**: The publishing process begins.
**Verify**: A publishing confirmation dialog or progress indicator appears.

---

### Step 14: Confirm Publishing

**Tool**: `browser_click`
**Parameters**:
- element: "Confirm publish button in the confirmation dialog"
- ref: (obtain from snapshot -- look for "Publish" or "Confirm" in the dialog)

**Expected Result**: The agent is published.
**Verify**: A success message or status indicator shows the agent is published.

---

### Step 15: Verify Published Status

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent status shows as "Published" or equivalent.
**Verify**: Published status indicator is visible. No error messages.

---

### Step 16: Verify M365 Availability Checkbox

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Look for "Make agent available in Microsoft 365" checkbox or toggle.
**Verify**: The checkbox is checked/enabled. If not, click to enable it.

---

### Step 17: Verify Teams Settings

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Teams channel settings show the agent is available.
**Verify**: Confirm these settings are configured:
- Agent can be added to a team
- Agent can be used in group or meeting chats

## Verification

- All 10 checklist items are completed
- Agent is in Published state
- Teams channel is enabled and configured
- Microsoft 365 Copilot channel is enabled
- Agent is available in Microsoft 365
- No error messages or warnings are present

## Rollback

1. If publishing needs to be reverted, navigate to the agent overview
2. Click "Unpublish" or "Revert to draft" if available
3. Correct any issues and re-publish
4. If channel settings need to be changed, navigate to Channels and toggle settings as needed
