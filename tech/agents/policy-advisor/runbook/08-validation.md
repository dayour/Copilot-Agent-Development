# Post-Build Validation

> Validate the complete Policy Advisor agent build with test queries and a PASS/FAIL checklist.

## Prerequisites

- All runbooks 01 through 07 completed successfully
- Agent is published and accessible
- Test panel is available in Copilot Studio
- Knowledge sources are synced and active

## Steps

### Step 1: Navigate to Agent Overview

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

Then navigate to the Policy Advisor agent.

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The Policy Advisor agent overview page is displayed.
**Verify**: Agent name "Policy Advisor" is visible on the page.

---

### Step 2: Validate Agent Details

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Overview page shows all configured details.
**Verify** (record PASS/FAIL for each):
- [ ] Name: "Policy Advisor"
- [ ] Description: Starts with "Provides guidance on HR, Legal, and company policies..."
- [ ] Model: GPT-5 Chat
- [ ] Instructions: Present and contain V1 micro-stepping pattern

---

### Step 3: Navigate to Knowledge Page

**Tool**: `browser_click`
**Parameters**:
- element: "Knowledge tab"
- ref: (obtain from snapshot -- look for "Knowledge" tab)

**Expected Result**: Knowledge page loads.
**Verify**: Knowledge sources are listed.

---

### Step 4: Validate Knowledge Sources

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: All three knowledge sources are listed with descriptions.
**Verify** (record PASS/FAIL for each):
- [ ] Company Website: Present with description containing "product information, general policies"
- [ ] HR Policy Library: Present with description containing "remote work, leave, benefits"
- [ ] Legal Compliance: Present with description containing "regulatory guidelines"
- [ ] Web Search: Enabled

---

### Step 5: Open Test Panel

**Tool**: `browser_click`
**Parameters**:
- element: "Test button or Test panel toggle"
- ref: (obtain from snapshot -- look for "Test", "Test your agent", or test panel icon)

**Expected Result**: The test chat panel opens on the right side or in a modal.
**Verify**: A chat input field is visible and ready for input.

---

### Step 6: Test Query -- Policy Retrieval

**Tool**: `browser_type`
**Parameters**:
- element: "Test chat input field"
- ref: (obtain from snapshot -- look for the chat message input)
- text: `What is the company's policy on remote work?`
- submit: true

**Expected Result**: The agent processes the query and returns a response.
**Verify**: Wait for the response to complete.

---

### Step 7: Validate Policy Retrieval Response

**Tool**: `browser_wait_for`
**Parameters**:
- time: 15

Then:

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent responds with policy information.
**Verify** (record PASS/FAIL for each):
- [ ] Response is generated (not an error message)
- [ ] Response contains policy-relevant content
- [ ] Citations or source references are present
- [ ] Professional tone is maintained
- [ ] Next steps or additional guidance is offered

---

### Step 8: Test Query -- Error Handling

**Tool**: `browser_type`
**Parameters**:
- element: "Test chat input field"
- ref: (obtain from snapshot -- look for the chat message input)
- text: `What is the policy on quantum computing?`
- submit: true

**Expected Result**: The agent handles a query with no matching policy gracefully.
**Verify**: Wait for the response to complete.

---

### Step 9: Validate Error Handling Response

**Tool**: `browser_wait_for`
**Parameters**:
- time: 15

Then:

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent responds appropriately to an unmatched query.
**Verify** (record PASS/FAIL for each):
- [ ] Response acknowledges no specific policy was found
- [ ] Response suggests contacting HR or Legal for assistance
- [ ] Response does NOT hallucinate a nonexistent policy
- [ ] Professional tone is maintained

---

### Step 10: Test Query -- Multi-Step Guidance

**Tool**: `browser_type`
**Parameters**:
- element: "Test chat input field"
- ref: (obtain from snapshot -- look for the chat message input)
- text: `I need to request a leave of absence. What are the steps?`
- submit: true

**Expected Result**: The agent provides step-by-step guidance.
**Verify**: Wait for the response to complete.

---

### Step 11: Validate Multi-Step Response

**Tool**: `browser_wait_for`
**Parameters**:
- time: 15

Then:

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The agent provides actionable multi-step guidance.
**Verify** (record PASS/FAIL for each):
- [ ] Response includes clear steps or guidance
- [ ] Response references relevant policy documents
- [ ] Response includes suggested next steps (e.g., forms to submit, people to contact)

---

### Step 12: Navigate to Channels

**Tool**: `browser_click`
**Parameters**:
- element: "Channels tab"
- ref: (obtain from snapshot -- look for "Channels" tab)

**Expected Result**: Channels page loads.
**Verify**: Channel configuration is visible.

---

### Step 13: Validate Channel Configuration

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Channels page shows enabled channels.
**Verify** (record PASS/FAIL for each):
- [ ] Microsoft Teams channel: Enabled
- [ ] Microsoft 365 Copilot channel: Enabled

---

### Step 14: Navigate to Solutions

**Tool**: `browser_click`
**Parameters**:
- element: "Solutions link in navigation"
- ref: (obtain from snapshot -- look for "Solutions" in navigation)

**Expected Result**: Solutions page loads.
**Verify**: Solution list is visible.

---

### Step 15: Validate Solution

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: PolicyAdvisor solution is listed.
**Verify** (record PASS/FAIL for each):
- [ ] Solution name: PolicyAdvisor (or equivalent)
- [ ] Solution is present in the list
- [ ] Solution type in dev: Unmanaged

---

## PASS/FAIL Summary Checklist

Record the results of all validation checks below:

### Agent Configuration
| Check | Status |
|---|---|
| Agent name is "Policy Advisor" | |
| Description is set correctly | |
| Model is GPT-5 Chat | |
| Instructions contain V1 micro-stepping pattern | |

### Knowledge Sources
| Check | Status |
|---|---|
| Company Website source present with description | |
| HR Policy Library source present with description | |
| Legal Compliance source present with description | |
| Web Search enabled | |

### Test Queries
| Check | Status |
|---|---|
| Policy retrieval query returns relevant content | |
| Policy retrieval response includes citations | |
| Policy retrieval response offers next steps | |
| Error handling query does not hallucinate | |
| Error handling query suggests escalation | |
| Multi-step query provides actionable guidance | |

### Channels and Deployment
| Check | Status |
|---|---|
| Teams channel enabled | |
| M365 Copilot channel enabled | |
| PolicyAdvisor solution exists | |
| Solution deployed to sandbox (if applicable) | |

### Overall Result
| Metric | Value |
|---|---|
| Total checks | 17 |
| Passed | |
| Failed | |
| Overall status | PASS / FAIL |

NOTE: All 17 checks must pass for overall PASS status. Any failed check should be investigated and resolved before proceeding to production deployment.

## Verification

- All 17 validation checks have been executed
- Results are recorded in the PASS/FAIL summary
- Any failures are documented with specific observations

## Rollback

If validation fails:
1. Identify the specific failed checks
2. Navigate to the relevant runbook file for the failed component
3. Re-execute the steps to correct the issue
4. Re-run validation from Step 1 of this runbook
