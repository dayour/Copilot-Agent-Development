# Authentication Verification

> Verify that the browser session is authenticated with the correct Microsoft account and that the active Copilot Studio environment matches the intended deployment target. Run this runbook before any configuration-changing runbook.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- Expected account UPN (user principal name) is known
- Expected environment name and ID are known

## Placeholders

| Placeholder | Description |
|---|---|
| `[EXPECTED_UPN]` | Expected signed-in account, e.g., `admin@contoso.onmicrosoft.com` |
| `[EXPECTED_ENV_NAME]` | Expected environment display name, e.g., "Contoso Dev" |
| `[EXPECTED_ENV_ID]` | Expected environment ID (GUID) |

---

## Steps

### Step 1: Navigate to Copilot Studio Home

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

**Expected Result**: Copilot Studio home page loads.

---

### Step 2: Capture Home Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] Determine the page state:

- If a Microsoft login form is visible: the session is not authenticated. Proceed to the Authentication section below.
- If the Copilot Studio home page is visible: proceed to Step 3.

---

### Step 3: Verify Signed-In Account [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "User account button or profile picture in the top-right navigation area"
- ref: `[from snapshot]`

**Expected Result**: An account menu or profile popover opens showing the signed-in account details.

---

### Step 4: Confirm Account Identity [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The account menu shows:
- Account display name
- Account email address or UPN

Confirm the UPN matches `[EXPECTED_UPN]`. If the wrong account is signed in, proceed to the Re-authentication section below.

---

### Step 5: Close Account Menu

**Tool**: `browser_press_key`
**Parameters**:
- key: "Escape"

---

### Step 6: Verify Active Environment [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The environment switcher in the top navigation bar shows `[EXPECTED_ENV_NAME]`.

If the wrong environment is active, execute [12-environment-switching.md](12-environment-switching.md) to switch to `[EXPECTED_ENV_NAME]` before proceeding.

---

### Step 7: Confirm Environment via URL Navigation [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[EXPECTED_ENV_ID]/`

**Tool**: `browser_snapshot`

[VERIFY] The page loads with `[EXPECTED_ENV_ID]` in the URL. The navigation header shows `[EXPECTED_ENV_NAME]`. If the page redirects to a different environment ID, the session environment context does not match the expected environment.

---

### Step 8: Verify Maker Permissions [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] The Copilot Studio home page shows the ability to create or manage agents. Look for:
- "New agent" or "+ New agent" button
- Access to the agent list

If these elements are absent or show "Access denied" messages, the signed-in account does not have Copilot Studio Maker permissions in `[EXPECTED_ENV_NAME]`. Contact a Power Platform administrator to assign the Maker role.

---

## Authentication Section: Handling Login Prompts

If Step 2 reveals a login form, complete authentication:

### Step A1: Enter Account Email

**Tool**: `browser_type`
**Parameters**:
- element: "Email or username input field on the Microsoft login page"
- ref: `[from snapshot]`
- text: `[EXPECTED_UPN]`
- submit: true

**Expected Result**: Page advances to password entry or SSO redirect.

---

### Step A2: Enter Password (if prompted)

**Tool**: `browser_type`
**Parameters**:
- element: "Password input field"
- ref: `[from snapshot]`
- text: "[account password]"
- submit: true

**Expected Result**: Authentication processes. Browser redirects or MFA prompt appears.

---

### Step A3: Handle MFA (if prompted) [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] If an MFA prompt appears, manual intervention is required. Pause automation and wait for the user to complete MFA (approve notification, enter code, etc.).

After MFA is completed:

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Copilot Studio"
- time: 60

---

### Step A4: Handle Stay Signed In Prompt [SNAPSHOT]

**Tool**: `browser_snapshot`

If a "Stay signed in?" prompt appears:

**Tool**: `browser_click`
**Parameters**:
- element: "Yes button on the Stay signed in prompt"
- ref: `[from snapshot]`

**Expected Result**: Browser proceeds to Copilot Studio.

---

## Re-authentication Section: Wrong Account Signed In

If Step 4 shows an incorrect account:

### Step B1: Sign Out

**Tool**: `browser_click`
**Parameters**:
- element: "Sign out button in the account menu"
- ref: `[from snapshot]`

**Expected Result**: User is signed out and a login form appears.

---

### Step B2: Sign In with Correct Account

Return to Step A1 and complete authentication with `[EXPECTED_UPN]`.

---

## Final Verification

After all steps complete, confirm:

[VERIFY]
- Signed-in account is `[EXPECTED_UPN]`
- Active environment is `[EXPECTED_ENV_NAME]`
- Environment ID in URL matches `[EXPECTED_ENV_ID]`
- Maker permissions are confirmed (agent creation/edit controls are visible)

Record the verification result before executing any configuration runbook.

---

## Verification Summary

| Check | Expected | Status |
|---|---|---|
| Signed-in account | `[EXPECTED_UPN]` | |
| Active environment name | `[EXPECTED_ENV_NAME]` | |
| Environment ID in URL | `[EXPECTED_ENV_ID]` | |
| Maker permissions present | New agent button visible | |

## Notes

- Always run this runbook at the start of any session that makes agent configuration changes
- If the copilotbrowser-cli session `mcs` has been idle for more than 8 hours, re-authentication may be required
- In multi-tenant scenarios, verify the tenant domain in the UPN matches the expected tenant. A user can have accounts in multiple tenants with the same display name but different UPNs
