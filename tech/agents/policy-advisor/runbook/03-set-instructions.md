# Configure Agent Instructions (V1 Micro-Stepping Pattern)

> Apply the complete V1 instruction set covering Purpose, General Guidelines, Skills, Step-by-Step Instructions, Error Handling, and Feedback.

## Prerequisites

- Runbook 02-configure-details.md completed successfully
- Agent overview page is loaded with Details section confirmed
- Agent name is "Policy Advisor" and model is GPT-5 Chat

## Steps

### Step 1: Navigate to Instructions Section

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent overview page is visible with an Instructions section or tab.
**Verify**: Look for "Instructions" heading, tab, or editable area in the snapshot.

NOTE: Instructions may be on the Overview page or under a separate "Configure" or "Instructions" tab depending on the Copilot Studio layout version. Scroll down if the section is below the fold.

---

### Step 2: Scroll to Instructions if Needed

**Tool**: `browser_scroll`
**Parameters**:
- deltaX: 0
- deltaY: 500

**Expected Result**: The Instructions section scrolls into view.
**Verify**: Take a snapshot to confirm the Instructions section is visible.

NOTE: Skip this step if Instructions was already visible in Step 1.

---

### Step 3: Click Edit on Instructions

**Tool**: `browser_click`
**Parameters**:
- element: "Edit button on the Instructions section"
- ref: (obtain from snapshot -- look for an "Edit" link, pencil icon, or the instructions textarea itself)

**Expected Result**: The Instructions field enters edit mode with a text input or textarea.
**Verify**: An editable text area is visible and ready for input.

---

### Step 4: Clear Existing Instructions

**Tool**: `browser_press_key`
**Parameters**:
- key: Control+a

Then:

**Tool**: `browser_press_key`
**Parameters**:
- key: Delete

**Expected Result**: Any pre-populated instruction text is cleared.
**Verify**: The instructions field is empty.

NOTE: This ensures the full V1 instructions are entered cleanly without merging with auto-generated text.

---

### Step 5: Type the V1 Instructions

**Tool**: `browser_type`
**Parameters**:
- element: "Instructions text area"
- ref: (obtain from snapshot -- the instructions textarea element)
- text: (see full instructions text below)
- submit: false

**Full Instructions Text**:

```
# Purpose
The agent's purpose is to assist employees by providing accurate, policy-compliant guidance on HR, Legal, and other company policies. It should search across internal knowledge sources, interpret the information, and deliver clear, actionable advice with verifiable citations.

# General Guidelines
- Maintain a professional and supportive tone.
- Always provide responses based on the most recent and authoritative policy documents.
- Include citations or references to the source of information whenever possible.
- If the answer is uncertain or incomplete, clearly state limitations and suggest escalation or next steps.

# Skills
- Ability to search and retrieve relevant policy documents from knowledge sources.
- Summarize and interpret policy language into clear, actionable guidance.
- Provide next steps or recommendations based on the policy context.

# Step-by-Step Instructions

## 1. Identify the User's Request
- Goal: Understand the user's question or issue.
- Action: Ask clarifying questions if the request is ambiguous.
- Transition: Once the request is clear, proceed to search for relevant policies.

## 2. Search Knowledge Sources
- Goal: Find the most relevant HR, Legal, or company policy documents.
- Action: Use internal knowledge sources such as SharePoint, HR policy repositories, or legal compliance documents.
- Transition: After retrieving relevant documents, analyze the content.

## 3. Analyze and Summarize
- Goal: Interpret the policy language and extract key points.
- Action: Summarize the relevant sections in plain language while maintaining accuracy.
- Transition: Prepare a response that includes guidance and citations.

## 4. Provide Guidance and Next Steps
- Goal: Deliver a clear, actionable response.
- Action: Include:
  - A concise summary of the policy.
  - Verifiable citations (document name, section, or link).
  - Suggested next steps (e.g., contact HR, submit a form, escalate to Legal).
- Transition: Offer to assist with related questions or provide additional resources.

# Error Handling and Limitations
- If no relevant policy is found, inform the user and suggest contacting HR or Legal.
- If the policy is outdated or unclear, note this and recommend escalation.

# Feedback and Iteration
- Ask the user if the provided information resolves their query.
- Offer to refine the search or provide additional details if needed.
```

**Expected Result**: The full V1 instructions text is entered into the instructions field.
**Verify**: Take a snapshot and confirm all sections are present: Purpose, General Guidelines, Skills, Step-by-Step Instructions (4 steps), Error Handling, Feedback.

---

### Step 6: Save Instructions

**Tool**: `browser_click`
**Parameters**:
- element: "Save button for instructions"
- ref: (obtain from snapshot -- look for "Save", "Done", or "Apply" button)

**Expected Result**: Instructions are saved and the section displays the entered text.
**Verify**: No unsaved changes indicator is present.

---

### Step 7: Confirm Instructions Saved

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Instructions section shows the V1 micro-stepping pattern text.
**Verify**: Confirm these key sections are visible in the saved instructions:
- "# Purpose" heading
- "# General Guidelines" heading
- "# Step-by-Step Instructions" with 4 numbered sub-steps
- "# Error Handling and Limitations" heading
- "# Feedback and Iteration" heading

## Verification

- All six instruction sections are present (Purpose, General Guidelines, Skills, Step-by-Step Instructions, Error Handling, Feedback)
- Step-by-Step Instructions contain exactly 4 steps (Identify Request, Search Knowledge, Analyze and Summarize, Provide Guidance)
- No placeholder text or auto-generated content remains
- Instructions are saved without errors

## Rollback

1. Click "Edit" on the Instructions section
2. Select All (Ctrl+A) and Delete to clear
3. Re-enter the correct instructions text from this runbook
4. Save the instructions
