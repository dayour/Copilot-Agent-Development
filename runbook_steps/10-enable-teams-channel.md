# Enable Teams Channel

> Turn on the Microsoft Teams channel for a Copilot Studio agent and submit for admin approval if required by the tenant policy.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Agent is published (see [09-publish-agent.md](09-publish-agent.md))
- Teams admin approval process is understood for the tenant (some tenants require admin approval before the agent appears in the Teams app catalog)

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[AGENT_NAME]` | Agent display name |

---

## Steps

### Step 1: Navigate to Channels Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels`

**Expected Result**: Channels management page loads.

---

### Step 2: Capture Channels Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Channels page is visible. A list of available channels is shown, including Microsoft Teams.

---

### Step 3: Locate the Microsoft Teams Channel Row [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Microsoft Teams row is visible in the channel list. Note whether the toggle or button shows as enabled or disabled.

---

### Step 4: Click the Microsoft Teams Channel [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Microsoft Teams channel row or Turn on Microsoft Teams button"
- ref: `[from snapshot]`

**Expected Result**: The Teams channel configuration panel opens or the toggle is enabled.

[VERIFY] A Teams channel configuration panel, settings page, or confirmation dialog opens.

---

### Step 5: Enable the Teams Channel Toggle

If a toggle is present and currently OFF:

**Tool**: `browser_click`
**Parameters**:
- element: "Microsoft Teams channel toggle or enable switch"
- ref: `[from snapshot]`

**Expected Result**: Toggle moves to the ON state. Teams channel configuration options appear.

[VERIFY] Toggle shows as enabled. Channel-specific settings are now visible.

NOTE: If the toggle is already ON, skip to Step 6.

---

### Step 6: Review Teams Channel Settings [SNAPSHOT]

**Tool**: `browser_snapshot`

Review the available settings. Commonly available options include:

- Allow this agent to be added to a team: confirm it is enabled
- Allow this agent to be used in group and channel chats: confirm it is enabled
- Submit for admin approval: required in tenant-managed environments

[VERIFY] Settings match the intended deployment scope.

---

### Step 7: Submit for Admin Approval (if required) [SNAPSHOT]

If the tenant requires admin approval before the agent appears in the Teams app catalog:

**Tool**: `browser_click`
**Parameters**:
- element: "Submit for admin approval button in the Teams channel settings"
- ref: `[from snapshot]`

**Expected Result**: A submission confirmation dialog or success indicator appears.

[VERIFY] A submission confirmation message is visible. Note the pending approval state.

NOTE: After submission, a Teams administrator must approve the agent in the Teams Admin Center at `https://admin.teams.microsoft.com/`. Approval is required before users can discover the agent in Teams.

---

### Step 8: Copy the Teams Deep Link (Optional)

If a direct installation link is available for distributing to users before admin approval:

**Tool**: `browser_snapshot`

Look for an "Install link" or "Add to Teams" URL.

**Tool**: `browser_click`
**Parameters**:
- element: "Copy link button for the Teams agent install URL"
- ref: `[from snapshot]`

[VERIFY] A link is copied. Share this link with target users who can self-install the agent while waiting for catalog approval.

---

### Step 9: Save Teams Channel Settings [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the Teams channel settings"
- ref: `[from snapshot]`

**Expected Result**: Channel settings are saved.

[VERIFY] Saved confirmation is visible. Teams channel row on the Channels page shows an active/enabled status.

---

### Step 10: Verify Channel Status [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels`

**Tool**: `browser_snapshot`

[VERIFY] The Microsoft Teams row shows an enabled/active status indicator.

---

## Verification

- Microsoft Teams channel shows as enabled on the Channels page
- Teams channel toggle is in the ON state
- Admin approval submission is confirmed (if required by tenant policy)
- Teams installation link is available for user distribution

## Rollback

1. Navigate to the Channels page
2. Click the Microsoft Teams channel row to open settings
3. Toggle the Teams channel OFF
4. Save the setting
5. Verify Teams shows as disabled

NOTE: Disabling the Teams channel does not automatically remove the agent from Teams for users who have already installed it. Users will need to remove the agent manually from their Teams client.

## Teams Admin Center Approval

To complete admin approval after submission:

1. Sign in to `https://admin.teams.microsoft.com/` with Teams administrator credentials
2. Navigate to Teams apps > Manage apps
3. Search for `[AGENT_NAME]` in the app list
4. Click the app row and review the app details
5. Click "Allow" or "Approve" to make the app available in the tenant catalog
6. Optionally, under "Permission policies", assign the app to specific user groups for targeted rollout
