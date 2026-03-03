# Topic Testing

> Drive the Copilot Studio test chat panel, send utterances to a specific topic, and capture the agent's responses. Use this runbook to verify topic routing, response quality, and action invocation.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent and topics are configured and saved
- Test utterances are prepared

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[TOPIC_NAME]` | Name of the topic being tested |
| `[UTTERANCE_1]` through `[UTTERANCE_N]` | Test utterances to send in the chat panel |

---

## Steps

### Step 1: Navigate to Agent Overview

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/`

**Expected Result**: Agent overview page loads.

---

### Step 2: Capture Overview State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The agent overview page is visible. A "Test your agent" button or panel toggle is visible.

---

### Step 3: Open the Test Chat Panel [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Test your agent button or Test chat panel toggle"
- ref: `[from snapshot]`

**Expected Result**: The test chat panel opens on the right side of the page.

[VERIFY] A chat input field and conversation area are visible in the test panel.

---

### Step 4: Reset the Conversation

If a previous conversation is visible in the test panel, reset it before testing:

**Tool**: `browser_click`
**Parameters**:
- element: "Reset or Start over button in the test chat panel"
- ref: `[from snapshot]`

**Expected Result**: The conversation history is cleared.

[VERIFY] The chat area shows a fresh start (empty or initial greeting only).

NOTE: If no Reset button is visible, the conversation may already be fresh. Proceed to Step 5.

---

### Step 5: Send First Test Utterance [SNAPSHOT]

**Tool**: `browser_type`
**Parameters**:
- element: "Message input field in the test chat panel"
- ref: `[from snapshot]`
- text: `[UTTERANCE_1]`
- submit: true

**Expected Result**: The utterance is sent and the agent begins processing.

[VERIFY] `[UTTERANCE_1]` appears in the chat conversation as a user message.

---

### Step 6: Wait for Agent Response

**Tool**: `browser_wait_for`
**Parameters**:
- text: "[Expected keyword from agent response, e.g., first word of the topic response]"
- time: 30

**Expected Result**: Agent response appears within 30 seconds.

NOTE: If the response does not appear, take a snapshot to check the current state. The agent may be loading knowledge sources or processing actions.

---

### Step 7: Capture Agent Response [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] Confirm all of the following:
- The agent responded to `[UTTERANCE_1]`
- The response matches the expected content from `[TOPIC_NAME]`
- No fallback or error message was returned (e.g., "I'm not sure how to help with that")
- If actions are configured, confirm action invocation indicators are visible

---

### Step 8: Send Additional Test Utterances

Repeat Steps 5-7 for each test utterance.

#### Utterance 2

**Tool**: `browser_type`
**Parameters**:
- element: "Message input field in the test chat panel"
- ref: `[from snapshot]`
- text: `[UTTERANCE_2]`
- submit: true

**Tool**: `browser_snapshot`

[VERIFY] Agent responded with content relevant to `[TOPIC_NAME]`.

#### Utterance 3

**Tool**: `browser_type`
**Parameters**:
- element: "Message input field in the test chat panel"
- ref: `[from snapshot]`
- text: `[UTTERANCE_3]`
- submit: true

**Tool**: `browser_snapshot`

[VERIFY] Agent responded with content relevant to `[TOPIC_NAME]`.

---

### Step 9: Test a Negative Utterance (Out-of-Scope) [SNAPSHOT]

Send an utterance that should NOT trigger `[TOPIC_NAME]` to verify the agent correctly routes away:

**Tool**: `browser_type`
**Parameters**:
- element: "Message input field in the test chat panel"
- ref: `[from snapshot]`
- text: "I want to talk to a human agent please"
- submit: true

**Tool**: `browser_snapshot`

[VERIFY] The agent's response does not come from `[TOPIC_NAME]`. The agent either routes to a different topic (escalation) or uses generative knowledge.

---

### Step 10: Check Topic Routing Indicator [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] If the test panel shows a topic name or routing indicator next to each response, confirm that responses to `[UTTERANCE_1]` through `[UTTERANCE_N]` were routed to `[TOPIC_NAME]`.

NOTE: The topic routing indicator may appear as a small label or in a "Details" or "Tracking" panel adjacent to each response. Not all Copilot Studio environments show this indicator.

---

### Step 11: Test Action Invocation (if Actions are configured) [SNAPSHOT]

If `[TOPIC_NAME]` includes an action (connector, MCP tool, or Power Automate flow), send an utterance that triggers the action:

**Tool**: `browser_type`
**Parameters**:
- element: "Message input field in the test chat panel"
- ref: `[from snapshot]`
- text: "[Utterance that should trigger the action, e.g., 'Look up my order status']"
- submit: true

**Tool**: `browser_snapshot`

[VERIFY]
- Agent response includes data returned by the action
- No authentication error for the connector or flow
- Response latency is within acceptable range (typically under 10 seconds for simple lookups)

---

## Verification Checklist

After completing all test utterances, confirm:

| Check | Expected | Actual |
|---|---|---|
| Utterance 1 routed correctly | Response from `[TOPIC_NAME]` | |
| Utterance 2 routed correctly | Response from `[TOPIC_NAME]` | |
| Utterance 3 routed correctly | Response from `[TOPIC_NAME]` | |
| Out-of-scope utterance handled | Different topic or generative response | |
| Action invocation succeeded (if applicable) | Data from action in response | |
| No error messages in any response | Clean responses | |

## Rollback

Topic testing does not modify agent configuration. If test results reveal issues:

1. Navigate to the topic and update trigger phrases or instructions
2. Reset the test chat panel and re-run the test utterances
3. Repeat until all checks pass

## Recording Test Results

To capture test output for a test report:

1. After each `browser_snapshot`, copy the relevant response text from the snapshot
2. Paste the response into a test results document alongside the utterance and expected outcome
3. Mark each test as PASS or FAIL based on the verification criteria
