# Configure Security and Allowlist

> Configure security settings and enable the skill allowlist so other agents can call SupportBot as a skill.

## Prerequisites

- Browser is authenticated and on the SupportBot management page
- Connected agents toggle is enabled (run 03-connected-agents.md first)

## Steps

### Step 1: Navigate to Security Settings

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/YOUR_ENVIRONMENT_ID_2/bots/YOUR_BOT_ID/manage/security`

**Expected Result**: Browser loads the Security settings page for SupportBot.

### Step 2: Capture Authentication Settings

**Tool**: `browser_snapshot`

**Expected Result**: Security settings page is displayed with authentication configuration.

**Verify**:
- Authentication method is shown (e.g., "Authenticate with Microsoft")
- Access control section is visible
- No error banners present

### Step 3: Locate Allowlist Section

**Tool**: `browser_snapshot`

**Verify**: Scan the page for the "Allowlist" section or "Let other agents call your agent as a skill" option.

NOTE: If the allowlist section is not visible, scroll down to find it.

#### Step 3a: Scroll to Allowlist (if needed)

**Tool**: `browser_scroll`
**Parameters**:
- deltaY: 400

**Expected Result**: Page scrolls to reveal the allowlist section.

#### Step 3b: Capture After Scroll

**Tool**: `browser_snapshot`

**Verify**: Allowlist section or skill-calling configuration is now visible.

### Step 4: Check Current Allowlist State

**Tool**: `browser_snapshot`

**Verify**: Determine if "Let other agents call your agent as a skill" (or similar) is currently enabled or disabled.

NOTE: If already enabled, skip to Step 6. If disabled, proceed to Step 5.

### Step 5: Enable Skill Allowlist

**Tool**: `browser_click`
**Parameters**:
- element: "Let other agents call your agent as a skill toggle or checkbox"
- ref: `[from snapshot]`

**Expected Result**: The allowlist feature is enabled. Other agents can now call SupportBot.

### Step 6: Verify Allowlist is Enabled

**Tool**: `browser_snapshot`

**Expected Result**: The allowlist toggle or setting shows as enabled.

**Verify**:
- The skill allowlist is in the ON/enabled state
- No error messages appeared
- Any associated configuration options are now accessible

### Step 7: Review Web Channel Security (if applicable)

**Tool**: `browser_snapshot`

**Verify**: Check if there is a "Web channel security" section. Review the current configuration.

NOTE: If web channel security settings need adjustment for the deployment scenario, configure them here. Common settings include:
- Require secure access tokens
- Allowed domains list
- CORS configuration

#### Step 7a: Configure Web Channel Security (if needed)

**Tool**: `browser_click`
**Parameters**:
- element: "Web channel security settings"
- ref: `[from snapshot]`

**Expected Result**: Web channel security configuration is accessible for review or modification.

### Step 8: Final Verification Snapshot

**Tool**: `browser_snapshot`

**Expected Result**: Complete security settings page with all configurations visible.

**Verify**:
- Authentication method is configured
- Allowlist is enabled
- Web channel security is reviewed
- No unsaved changes indicators
- No error banners

## Verification

Confirm the following security settings are in place:
1. Skill allowlist is enabled -- other agents can call SupportBot
2. Authentication configuration is appropriate for the environment
3. Web channel security is reviewed and acceptable

## Rollback

To revert security changes:
1. Navigate to the Security settings page (Step 1)
2. Disable the skill allowlist by clicking the toggle to OFF
3. Revert any web channel security changes
4. Use `browser_snapshot` to confirm settings are reverted
