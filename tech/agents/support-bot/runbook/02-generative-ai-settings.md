# Configure Generative AI Settings

> Enable generative AI orchestration, set the response model to GPT-4o, configure content moderation to High, and verify knowledge grounding settings.

## Prerequisites

- Browser is authenticated and on the SupportBot management page (run 01-navigate-and-authenticate.md first)
- SupportBot agent is in a editable (non-published-locked) state

## Steps

### Step 1: Navigate to Generative AI Settings

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advancedSettings`

**Expected Result**: Browser navigates to the Generative AI settings page for SupportBot.

### Step 2: Capture Current Generative AI State

**Tool**: `browser_snapshot`

**Expected Result**: Page displays generative AI configuration options.

**Verify**:
- "Generative AI" heading or section is visible
- Orchestration toggle is present
- Model selection area is visible

### Step 3: Verify Generative AI Orchestration is Enabled

**Tool**: `browser_snapshot`

**Verify**: Look for "Use generative AI orchestration" toggle. Confirm it is in the ON state.

NOTE: If the toggle is OFF, proceed to Step 3a. If already ON, skip to Step 4.

#### Step 3a: Enable Generative AI Orchestration

**Tool**: `browser_click`
**Parameters**:
- element: "Use generative AI orchestration toggle"
- ref: `[from snapshot]`

**Expected Result**: Toggle switches to ON state. Orchestration options expand.

#### Step 3b: Confirm Toggle State

**Tool**: `browser_snapshot`

**Verify**: The orchestration toggle now shows as enabled/ON.

### Step 4: Verify Primary Response Model is GPT-4o

**Tool**: `browser_snapshot`

**Verify**: Look for the model selection section. Confirm "GPT-4o" is selected as the primary response model.

NOTE: If a different model is selected, proceed to Step 4a. If GPT-4o is already selected, skip to Step 5.

#### Step 4a: Select GPT-4o Model

**Tool**: `browser_click`
**Parameters**:
- element: "GPT-4o model option or dropdown"
- ref: `[from snapshot]`

**Expected Result**: GPT-4o is now selected as the primary response model.

### Step 5: Set Content Moderation Level to High

**Tool**: `browser_snapshot`

**Verify**: Locate the content moderation section. Check current moderation level.

NOTE: If moderation is already set to High, skip to Step 6.

#### Step 5a: Click Content Moderation Dropdown or Option

**Tool**: `browser_click`
**Parameters**:
- element: "Content moderation level selector"
- ref: `[from snapshot]`

**Expected Result**: Moderation options are displayed.

#### Step 5b: Select High

**Tool**: `browser_click`
**Parameters**:
- element: "High moderation option"
- ref: `[from snapshot]`

**Expected Result**: Content moderation level is set to High.

### Step 6: Verify User Feedback Collection is On

**Tool**: `browser_snapshot`

**Verify**: Locate the "User feedback" or "Collect user feedback" setting. Confirm it is toggled ON.

NOTE: If OFF, click the toggle to enable it using `browser_click` with the appropriate ref from the snapshot.

### Step 7: Verify General Knowledge is On

**Tool**: `browser_snapshot`

**Verify**: Locate the "General knowledge" or "Allow the AI to use its own general knowledge" setting. Confirm it is enabled.

NOTE: If disabled, click to enable using `browser_click`.

### Step 8: Verify Tenant Graph Grounding is On

**Tool**: `browser_snapshot`

**Verify**: Locate the "Tenant graph grounding" or Microsoft 365 grounding option. Confirm it is enabled.

NOTE: If disabled, click to enable using `browser_click`.

### Step 9: Capture Final State

**Tool**: `browser_snapshot`

**Expected Result**: All generative AI settings are configured as specified.

**Verify**:
- Generative AI orchestration: ON
- Primary model: GPT-4o
- Content moderation: High
- User feedback: ON
- General knowledge: ON
- Tenant graph grounding: ON

## Verification

All six settings must match the expected values listed in Step 9. If any setting does not match, re-run the corresponding step.

## Rollback

To revert generative AI settings:
1. Navigate back to the Generative AI settings page (Step 1)
2. Toggle orchestration OFF if it was previously disabled
3. Revert model selection to the previous value
4. Restore content moderation to its previous level
5. Take a snapshot to confirm rollback is complete
