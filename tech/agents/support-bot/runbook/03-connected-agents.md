# Enable Connected Agents for Multi-Agent Orchestration

> CRITICAL: Enable the "Let other agents connect to and use this one" toggle so SupportBot can participate in multi-agent orchestration as a callable skill.

## Prerequisites

- Browser is authenticated and on the SupportBot management page
- Generative AI orchestration is enabled (run 02-generative-ai-settings.md first)
- User has permissions to modify agent connectivity settings

## Steps

### Step 1: Navigate to Generative AI Settings

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advancedSettings`

**Expected Result**: Browser loads the Generative AI settings page.

### Step 2: Capture Page State

**Tool**: `browser_snapshot`

**Expected Result**: Generative AI settings page is displayed.

**Verify**: Page has loaded completely with no error banners.

### Step 3: Locate Connected Agents Section

**Tool**: `browser_snapshot`

**Verify**: Scroll or scan the page for the "Connected agents" section. This section controls whether other agents can call this agent as a skill.

NOTE: The connected agents section may be below the fold. If not visible in the current snapshot, scroll down.

#### Step 3a: Scroll Down (if needed)

**Tool**: `browser_scroll`
**Parameters**:
- deltaY: 500

**Expected Result**: Page scrolls to reveal additional settings sections.

#### Step 3b: Capture After Scroll

**Tool**: `browser_snapshot`

**Verify**: The "Connected agents" section is now visible. Look for text like "Connected agents", "Let other agents connect", or similar.

### Step 4: Check Current Toggle State

**Tool**: `browser_snapshot`

**Verify**: Find the toggle labeled "Let other agents connect to and use this one" (or similar wording). Determine if it is currently ON or OFF.

NOTE: If the toggle is already ON, skip to Step 6 for verification. If OFF, proceed to Step 5.

### Step 5: Enable Connected Agents Toggle

**Tool**: `browser_click`
**Parameters**:
- element: "Let other agents connect to and use this one toggle"
- ref: `[from snapshot]`

**Expected Result**: The toggle switches from OFF to ON. The agent is now discoverable and callable by other agents in the environment.

WARNING: This is the critical action in the entire runbook. Verify carefully in the next step.

### Step 6: Verify Toggle is ON

**Tool**: `browser_snapshot`

**Expected Result**: The connected agents toggle is confirmed in the ON state.

**Verify**:
- The toggle visual state indicates enabled/ON
- No error messages appeared after toggling
- Any confirmation text or status indicator shows the change was accepted

### Step 7: Wait for Confirmation

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Connected agents"

**Expected Result**: The connected agents section remains visible and stable, confirming the setting was saved.

### Step 8: Final State Capture

**Tool**: `browser_snapshot`

**Expected Result**: Complete view of the connected agents section showing the toggle in ON state.

**Verify**:
- Toggle is ON
- No unsaved changes indicators
- No error banners or warnings

## Verification

The connected agents toggle must be in the ON state. This is the single most important setting for multi-agent orchestration. Without this toggle enabled:
- Other agents cannot discover SupportBot
- WarrantyGuard cannot call SupportBot as a skill
- Multi-agent routing will not function

To confirm the setting persisted:
1. Navigate away from the page using `browser_navigate` to any other section
2. Return to the Generative AI settings page
3. Use `browser_snapshot` to confirm the toggle is still ON

## Rollback

To disable connected agents:
1. Navigate to the Generative AI settings page (Step 1)
2. Scroll to the Connected agents section (Step 3)
3. Click the toggle to set it to OFF
4. Use `browser_snapshot` to confirm the toggle is OFF

WARNING: Disabling connected agents will immediately prevent other agents from calling SupportBot. Ensure no active orchestration flows depend on this agent before disabling.
