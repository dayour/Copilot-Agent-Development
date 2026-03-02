# Navigate to SupportBot Agent

> Open the SupportBot agent management page in Copilot Studio and confirm successful authentication and page load.

## Prerequisites

- Browser MCP server (copilotbrowser) is connected
- User has valid Microsoft credentials with access to DYdev26 environment
- Network access to copilotstudio.preview.microsoft.com

## Steps

### Step 1: Navigate to SupportBot Management Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/`

**Expected Result**: Browser begins loading the Copilot Studio agent management page.

### Step 2: Capture Initial Page State

**Tool**: `browser_snapshot`

**Expected Result**: Snapshot shows either the SupportBot management page or a login prompt.

**Verify**: Check if the page contains the agent name "SupportBot" or a Microsoft login form.

### Step 3: Handle Authentication (Conditional)

NOTE: If the snapshot from Step 2 shows a login prompt, execute the following sub-steps. If the agent page is already loaded, skip to Step 4.

#### Step 3a: Enter Email

**Tool**: `browser_type`
**Parameters**:
- element: "Email input field"
- ref: `[from snapshot]`
- text: "[user email]"
- submit: true

**Expected Result**: Page advances to password entry or SSO redirect.

#### Step 3b: Enter Password (if prompted)

**Tool**: `browser_type`
**Parameters**:
- element: "Password input field"
- ref: `[from snapshot]`
- text: "[user password]"
- submit: true

**Expected Result**: Authentication completes, browser redirects to Copilot Studio.

#### Step 3c: Handle MFA (if prompted)

**Tool**: `browser_snapshot`

**Verify**: Check if MFA prompt appears. If so, manual intervention is required. Wait for the user to complete MFA before proceeding.

#### Step 3d: Handle "Stay Signed In" Prompt

**Tool**: `browser_click`
**Parameters**:
- element: "Yes button on Stay signed in prompt"
- ref: `[from snapshot]`

**Expected Result**: Browser proceeds to the requested page.

### Step 4: Wait for SupportBot Page to Load

**Tool**: `browser_wait_for`
**Parameters**:
- text: "SupportBot"

**Expected Result**: The text "SupportBot" appears on the page, confirming the agent management page has loaded.

### Step 5: Verify Page State

**Tool**: `browser_snapshot`

**Expected Result**: Full agent management page is visible with navigation menu.

**Verify**:
- Agent name "SupportBot" is displayed in the page header
- Left navigation menu is visible with settings options (Generative AI, Security, Skills, Details, Advanced)
- No error banners or loading indicators present

## Verification

- The page title or header contains "SupportBot"
- The settings navigation panel is accessible
- No authentication errors or redirect loops occurred

## Rollback

No changes are made in this step. If authentication fails:
1. Clear browser cookies with `browser_clear_cookies`
2. Retry navigation from Step 1
3. If persistent failures occur, verify credentials and environment access manually
