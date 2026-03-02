# Configure Skills and Agent Orchestration

> Add WarrantyGuard as a connected skill to SupportBot, enabling multi-agent orchestration between the two agents.

## Prerequisites

- Browser is authenticated and on the SupportBot management page
- Security and allowlist are configured (run 04-security-and-allowlist.md first)
- WarrantyGuard agent exists and is published in the DYdev26 environment
- WarrantyGuard has its own connected agents toggle enabled

## Steps

### Step 1: Navigate to Skills Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/skills`

**Expected Result**: Browser loads the Skills management page for SupportBot.

### Step 2: Capture Current Skills List

**Tool**: `browser_snapshot`

**Expected Result**: Skills page is displayed showing any currently configured skills.

**Verify**:
- "Skills" heading or section is visible
- List of current skills (may be empty)
- "Add a skill" button is present

### Step 3: Check if WarrantyGuard is Already Added

**Tool**: `browser_snapshot`

**Verify**: Scan the skills list for "WarrantyGuard". If it already appears, skip to Step 8 for verification. If not present, proceed to Step 4.

### Step 4: Click Add a Skill

**Tool**: `browser_click`
**Parameters**:
- element: "Add a skill button"
- ref: `[from snapshot]`

**Expected Result**: A dialog, panel, or search interface opens for adding a new skill.

### Step 5: Search for WarrantyGuard

**Tool**: `browser_snapshot`

**Verify**: A search field or agent list is displayed.

#### Step 5a: Type Search Query

**Tool**: `browser_type`
**Parameters**:
- element: "Skill search input field"
- ref: `[from snapshot]`
- text: "WarrantyGuard"

**Expected Result**: Search results filter to show WarrantyGuard agent.

#### Step 5b: Wait for Search Results

**Tool**: `browser_wait_for`
**Parameters**:
- text: "WarrantyGuard"

**Expected Result**: WarrantyGuard appears in the search results.

### Step 6: Select WarrantyGuard

**Tool**: `browser_click`
**Parameters**:
- element: "WarrantyGuard agent in search results"
- ref: `[from snapshot]`

**Expected Result**: WarrantyGuard is selected for addition as a skill.

### Step 7: Confirm Skill Addition

**Tool**: `browser_snapshot`

**Verify**: A confirmation dialog or button may appear. Look for "Add", "Confirm", "Save", or similar action button.

#### Step 7a: Click Confirm/Add Button

**Tool**: `browser_click`
**Parameters**:
- element: "Confirm or Add button"
- ref: `[from snapshot]`

**Expected Result**: WarrantyGuard is added to SupportBot's skills list.

#### Step 7b: Wait for Addition to Complete

**Tool**: `browser_wait_for`
**Parameters**:
- text: "WarrantyGuard"

**Expected Result**: WarrantyGuard appears in the skills list on the main skills page.

### Step 8: Verify WarrantyGuard in Skills List

**Tool**: `browser_snapshot`

**Expected Result**: The skills page shows WarrantyGuard as a configured skill.

**Verify**:
- WarrantyGuard is listed in the skills section
- The skill shows a connected/active status
- No error indicators on the skill entry

### Step 9: Verify Allowlist Management Access

**Tool**: `browser_snapshot`

**Verify**: Check if there is an "Allowlist" or "Manage allowlist" option accessible from the skills page. This confirms the allowlist configuration from the previous runbook is visible here as well.

## Verification

Confirm the following:
1. WarrantyGuard appears in the SupportBot skills list
2. The skill status shows as connected/active
3. Allowlist management is accessible if applicable
4. No error messages or warnings on the skills page

## Rollback

To remove WarrantyGuard from the skills list:
1. Navigate to the Skills page (Step 1)
2. Locate WarrantyGuard in the skills list
3. Click the remove/delete option (usually an ellipsis menu or delete icon)
4. Confirm removal
5. Use `browser_snapshot` to verify WarrantyGuard is no longer listed
