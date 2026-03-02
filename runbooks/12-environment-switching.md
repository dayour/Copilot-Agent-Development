# Environment Switching

> Switch the active Copilot Studio environment between dev, test, and production environments within the same browser session.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated and has access to both the source and target environments
- Target environment name or ID is known

## Placeholders

| Placeholder | Description |
|---|---|
| `[TARGET_ENV_NAME]` | Display name of the environment to switch to, e.g., "Contoso Prod" |
| `[TARGET_ENV_ID]` | Environment ID (GUID) of the target environment |

---

## Steps

### Step 1: Navigate to Copilot Studio Home

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

**Expected Result**: Copilot Studio home page loads showing the current environment context.

---

### Step 2: Capture Current Environment State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The top navigation bar shows the current environment name. Note the current environment name before switching.

---

### Step 3: Click the Environment Switcher

**Tool**: `browser_click`
**Parameters**:
- element: "Environment switcher button in the top navigation bar showing the current environment name"
- ref: `[from snapshot]`

**Expected Result**: A dropdown, popover, or modal appears showing a list of accessible environments.

[VERIFY] Environment selection UI is visible with the current environment highlighted.

---

### Step 4: Capture Environment Selector State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] A list of environments is visible. The current environment is marked as selected.

---

### Step 5: Search for Target Environment (if many environments)

If the environment list is long, use the search input:

**Tool**: `browser_type`
**Parameters**:
- element: "Search environments input field in the environment switcher"
- ref: `[from snapshot]`
- text: `[TARGET_ENV_NAME]`

**Expected Result**: The environment list filters to show environments matching `[TARGET_ENV_NAME]`.

[VERIFY] `[TARGET_ENV_NAME]` appears in the filtered list.

---

### Step 6: Select Target Environment [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Environment option for [TARGET_ENV_NAME] in the environment switcher list"
- ref: `[from snapshot]`

**Expected Result**: The environment switches to `[TARGET_ENV_NAME]`. The page reloads or refreshes the agent list.

---

### Step 7: Wait for Environment Switch

**Tool**: `browser_wait_for`
**Parameters**:
- text: "[TARGET_ENV_NAME]"
- time: 30

**Expected Result**: The new environment name appears in the navigation bar within 30 seconds.

---

### Step 8: Confirm Environment Switch [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The environment switcher in the top navigation bar now shows `[TARGET_ENV_NAME]`. The agent list reflects agents in the new environment.

---

### Step 9: Verify Environment via URL

The current environment is embedded in the Copilot Studio URL. After switching, navigate to a known page and confirm:

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[TARGET_ENV_ID]/`

**Tool**: `browser_snapshot`

[VERIFY] The page loads without redirecting to a different environment ID. The navigation header shows `[TARGET_ENV_NAME]`.

---

## Verification

- Environment switcher shows `[TARGET_ENV_NAME]` after switching
- Agent list shows agents belonging to `[TARGET_ENV_NAME]`
- URL contains `[TARGET_ENV_ID]` when navigating to environment-scoped pages
- No authentication errors or "access denied" messages

## Rollback

To return to the previous environment:

1. Click the environment switcher
2. Select the previous environment from the list
3. Verify the environment name returns to the expected value

## Environment ID Lookup

To find the environment ID for a known environment name:

1. Navigate to `https://admin.powerplatform.microsoft.com/environments`
2. Locate the environment row
3. The environment ID is shown in the URL when clicking into the environment details, or listed in the environment details panel

Alternatively, use the PAC CLI:

```
pac env list
```

The output lists all accessible environments with their display names and IDs.

## Common Environments

| Environment | Typical Use |
|---|---|
| `[ORG] Dev` | Active development and configuration changes |
| `[ORG] Test` / `[ORG] Sandbox` | Pre-production validation and UAT |
| `[ORG] Prod` | Live production agents serving end users |

Always verify which environment is active before making any agent configuration changes. Making changes in production when intending to work in dev is one of the most common operational errors.
