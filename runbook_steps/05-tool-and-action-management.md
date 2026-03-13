# Tool and Action Management

> Add MCP servers, Power Platform connectors, and Power Automate flows as actions (tools) available to a Copilot Studio agent. This runbook covers all three action types.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Target agent exists and is in an editable state
- For MCP server actions: the MCP server URL and tool manifest are available
- For connector actions: the connector is already created or available in the environment
- For Power Automate flow actions: the target flow is published and in the same environment

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[MCP_SERVER_URL]` | MCP server URL, e.g., `https://mcp.contoso.com/sse` |
| `[MCP_SERVER_NAME]` | Display name for the MCP server action |
| `[CONNECTOR_NAME]` | Connector display name, e.g., "Salesforce" |
| `[FLOW_NAME]` | Power Automate flow display name |

---

## Navigate to Actions Page

### Step 1: Navigate to Actions Section

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/actions`

**Expected Result**: The Actions management page loads.

---

### Step 2: Capture Actions Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Actions page is visible with an "Add an action" or "+ Add action" button present.

---

## Adding an MCP Server Action

### Step 3: Click Add an Action

**Tool**: `browser_click`
**Parameters**:
- element: "Add an action button on the Actions page"
- ref: `[from snapshot]`

**Expected Result**: Action type selection panel opens.

[VERIFY] Action type options are visible.

---

### Step 4: Select MCP Server Action Type [SNAPSHOT]

**Tool**: `browser_snapshot`

Look for an "MCP server", "Model Context Protocol", or similar option.

**Tool**: `browser_click`
**Parameters**:
- element: "MCP server option in the action type selector"
- ref: `[from snapshot]`

**Expected Result**: MCP server configuration form is displayed.

NOTE: If MCP server is not listed as an action type, the feature may not be enabled in this environment. Check Power Platform admin settings for the MCP integration feature flag.

---

### Step 5: Enter MCP Server URL [SNAPSHOT]

**Tool**: `browser_type`
**Parameters**:
- element: "MCP server URL input field"
- ref: `[from snapshot]`
- text: `[MCP_SERVER_URL]`

[VERIFY] URL is fully entered and correctly formatted.

---

### Step 6: Set MCP Server Name

**Tool**: `browser_type`
**Parameters**:
- element: "Action name or display name input field"
- ref: `[from snapshot]`
- text: `[MCP_SERVER_NAME]`

---

### Step 7: Discover and Select MCP Tools [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Discover tools or Connect button in the MCP server form"
- ref: `[from snapshot]`

**Expected Result**: The MCP server is contacted and its available tools are listed.

[VERIFY] A list of tools from the MCP server manifest appears. Each tool shows a name and description.

---

### Step 8: Select Desired MCP Tools

For each tool to enable:

**Tool**: `browser_click`
**Parameters**:
- element: "Checkbox or toggle next to the desired MCP tool"
- ref: `[from snapshot]`

[VERIFY] Selected tools show as checked or enabled.

---

### Step 9: Save MCP Action [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent or Save button in the MCP server configuration form"
- ref: `[from snapshot]`

**Expected Result**: MCP server action is added to the agent.

[VERIFY] `[MCP_SERVER_NAME]` appears in the Actions list with the selected tools listed beneath it.

---

## Adding a Connector Action

### Step 10: Click Add an Action (Connector)

**Tool**: `browser_click`
**Parameters**:
- element: "Add an action button on the Actions page"
- ref: `[from snapshot]`

---

### Step 11: Select Connector Action Type [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Connector option in the action type selector"
- ref: `[from snapshot]`

**Expected Result**: Connector search or selection panel opens.

---

### Step 12: Search for the Connector

**Tool**: `browser_type`
**Parameters**:
- element: "Search connectors input field"
- ref: `[from snapshot]`
- text: `[CONNECTOR_NAME]`

[VERIFY] Search results show the target connector.

---

### Step 13: Select the Connector [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Connector row matching [CONNECTOR_NAME] in search results"
- ref: `[from snapshot]`

**Expected Result**: The connector's available operations or actions are listed.

[VERIFY] A list of connector operations is visible. Review and select the required operations.

---

### Step 14: Select Connector Operations and Save

Select each desired operation by clicking its checkbox or row, then:

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent or Next button in the connector selection form"
- ref: `[from snapshot]`

[VERIFY] Connector action appears in the Actions list.

---

## Adding a Power Automate Flow Action

### Step 15: Click Add an Action (Flow)

**Tool**: `browser_click`
**Parameters**:
- element: "Add an action button on the Actions page"
- ref: `[from snapshot]`

---

### Step 16: Select Power Automate Flow Type [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Power Automate flow or Flow option in the action type selector"
- ref: `[from snapshot]`

**Expected Result**: A list of Power Automate flows in the current environment is displayed.

---

### Step 17: Search for the Flow

**Tool**: `browser_type`
**Parameters**:
- element: "Search flows input field"
- ref: `[from snapshot]`
- text: `[FLOW_NAME]`

[VERIFY] The target flow appears in the search results.

---

### Step 18: Select the Flow [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Flow row matching [FLOW_NAME]"
- ref: `[from snapshot]`

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Add to agent or Next button in the flow selection form"
- ref: `[from snapshot]`

[VERIFY] Flow action appears in the Actions list.

---

### Step 19: Configure Flow Action Description

After the flow is added, set a routing description so the generative orchestrator knows when to invoke it:

**Tool**: `browser_click`
**Parameters**:
- element: "Edit or Configure button on the flow action row"
- ref: `[from snapshot]`

**Tool**: `browser_type`
**Parameters**:
- element: "Action description input field"
- ref: `[from snapshot]`
- text: "Use this action to [describe the trigger condition for the flow]"

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the action configuration"
- ref: `[from snapshot]`

[VERIFY] Description is saved and visible on the Actions list row.

---

## Final Verification

### Step 20: Review All Actions [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] All added actions appear in the Actions list:
- MCP server with selected tools listed
- Connector with selected operations listed
- Power Automate flow with description configured

## Rollback

1. Navigate to the Actions page
2. Click the three-dot overflow menu on the action to remove
3. Select "Delete" or "Remove"
4. Confirm deletion
5. Verify the action is no longer listed

## Troubleshooting

| Issue | Resolution |
|---|---|
| MCP server URL is not reachable | Verify the server is running and the URL returns an SSE stream. Test with `curl [MCP_SERVER_URL]` |
| Connector does not appear in search | Ensure the connector is installed in the environment. Navigate to Power Apps > Connections to verify |
| Flow not visible in the list | Confirm the flow is published (not draft) and is in the same Power Platform environment as the agent |
| Action is not invoked during testing | Verify the action description is clear and specific. Generative orchestration uses the description to decide when to call the action |
