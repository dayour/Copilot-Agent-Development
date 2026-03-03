# Publish Agent

> Publish a Copilot Studio agent via the UI. Also documents the PAC CLI approach, which is preferred for production deployments and CI/CD pipelines.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Agent is fully configured (instructions, knowledge, topics, actions)
- All required publishing metadata is confirmed (agent name, description, icon)
- Topic testing has passed (see [08-topic-testing.md](08-topic-testing.md))

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[AGENT_NAME]` | Agent display name |

---

## Primary Path: PAC CLI (Recommended for Production)

The PAC CLI is the preferred approach for controlled, repeatable publishing in production environments. It does not require browser automation.

### PAC CLI Publish Command

```
pac copilot publish --environment [ENV_ID] --bot-id [BOT_ID]
```

Prerequisites for PAC CLI:
- `pac` is installed: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`
- User is authenticated: `pac auth create --url https://[ORG].crm.dynamics.com`
- Verify current auth context: `pac auth list`

After publishing, verify the agent status in the UI by following the verification steps below, or run:

```
pac copilot list --environment [ENV_ID]
```

Confirm the agent shows `Published` status in the output.

---

## UI Path: Steps

### Step 1: Navigate to Agent Overview

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/`

**Expected Result**: Agent overview page loads.

---

### Step 2: Capture Overview State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The agent overview page is visible. A "Publish" button is present in the top action bar. Confirm the button is not disabled (aria-disabled is not true).

NOTE: The Publish button may be disabled if required publishing checklist items are incomplete. If disabled, review the checklist items indicated by the UI before proceeding.

---

### Step 3: Click Publish [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Publish button in the top action bar"
- ref: `[from snapshot]`

**Expected Result**: A publishing confirmation dialog appears.

[VERIFY] Dialog asks for confirmation to publish the agent. Agent name `[AGENT_NAME]` is shown in the dialog.

---

### Step 4: Confirm Publish [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Publish or Confirm button in the publish confirmation dialog"
- ref: `[from snapshot]`

**Expected Result**: The agent is submitted for publishing. A progress indicator or "Publishing..." status appears.

---

### Step 5: Wait for Publishing to Complete

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Published"
- time: 60

**Expected Result**: Publishing completes within 60 seconds and a "Published" status indicator appears.

NOTE: Publishing typically takes 15-30 seconds. If the wait times out, take a snapshot to check the current state.

---

### Step 6: Verify Published Status [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] Confirm all of the following:
- The agent status shows "Published" or a published timestamp
- No error banners are present
- The Publish button may now show "Republish" or be in a post-publish state

---

### Step 7: Verify Published Version is Available

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels`

**Tool**: `browser_snapshot`

[VERIFY] The Channels page is accessible and the agent is in a published state that allows channel enablement.

---

## Verification

- Agent status shows "Published" on the overview page
- Publishing timestamp is updated to the current date and time
- No error messages or warnings are present
- Agent is accessible in enabled channels (Teams, Web Chat, etc.)

## Rollback

There is no direct "unpublish" UI action in Copilot Studio. To revert to a previous version:

1. If the agent was exported to a solution before publishing, use PAC CLI to import the previous solution version:
   ```
   pac solution import --path [PREVIOUS_SOLUTION.zip] --environment [ENV_ID]
   ```
2. Republish the agent after the solution is imported
3. Verify the reverted configuration is active

## Publishing Checklist

Before clicking Publish, confirm these items are complete:

| Item | Check |
|---|---|
| Agent name is set and descriptive | |
| Agent description is present | |
| Short description (80 char max) is set | |
| Long description is set | |
| Agent icon is uploaded | |
| Agent color is set | |
| Developer name is set | |
| Website URL is set | |
| Privacy statement URL is set | |
| Terms of use URL is set | |

All 10 items must be complete for the Publish button to be active.
