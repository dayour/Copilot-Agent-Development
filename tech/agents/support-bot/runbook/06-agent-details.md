# Configure Agent Details

> Verify SupportBot agent identity, solution association, and channel configuration from the Details page.

## Prerequisites

- Browser is authenticated and on the SupportBot management page
- Skills are configured (run 05-skills-management.md first)

## Steps

### Step 1: Navigate to Agent Details Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/details`

**Expected Result**: Browser loads the Agent Details page for SupportBot.

### Step 2: Capture Current Details

**Tool**: `browser_snapshot`

**Expected Result**: Details page displays agent identity and configuration information.

**Verify**:
- Page has loaded without errors
- Agent information section is visible

### Step 3: Verify Agent Name

**Tool**: `browser_snapshot`

**Verify**: The agent name field displays "SupportBot". This confirms you are viewing the correct agent.

NOTE: If the name does not match, stop execution and verify the bot ID in the URL. Do not proceed with configuration changes on the wrong agent.

### Step 4: Verify Solution Association

**Tool**: `browser_snapshot`

**Verify**: Check for a "Solution" field or section. Note the solution name and ID that SupportBot is associated with. This is important for deployment and ALM (Application Lifecycle Management).

NOTE: Record the solution name for reference. Common values include the default solution or a custom solution for the SupportBot project.

### Step 5: Check Channel Configuration Links

**Tool**: `browser_snapshot`

**Verify**: Look for channel configuration options or links. Common channels include:
- Microsoft Teams
- Web (Demo website, Custom website)
- Other channels (Slack, Facebook, etc.)

NOTE: Document which channels are currently configured. No changes are typically needed here during initial setup, but this information is useful for deployment planning.

### Step 6: Review Additional Details

**Tool**: `browser_snapshot`

**Verify**: Check for any additional metadata:
- Agent icon/avatar
- Description or display name
- Schema name
- Environment association confirms DYdev26

### Step 7: Final State Capture

**Tool**: `browser_snapshot`

**Expected Result**: Complete view of the agent details page.

**Verify**:
- Agent name: "SupportBot"
- Solution association is documented
- Channel configuration is noted
- No errors or warnings present

## Verification

Confirm the following details are correct:
1. Agent name is "SupportBot"
2. Solution association is recorded
3. Channel configuration links are accessible
4. The agent is in the DYdev26 environment

## Rollback

This step is primarily read-only verification. No changes are made to the agent details. If the agent name or identity is incorrect:
1. Verify the bot ID in the URL matches the expected value: `276dcc5a-3d47-f011-877a-7c1e52698560`
2. Navigate back to the environment agent list to locate the correct agent
3. Update the URL base in `00-index.md` if the bot ID was incorrect
