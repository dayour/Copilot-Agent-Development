# Configure Advanced Settings and Telemetry

> Enable Application Insights telemetry, enhanced Dataverse transcripts, and configure external agent calling scenarios in the advanced settings.

## Prerequisites

- Browser is authenticated and on the SupportBot management page
- Agent details are verified (run 06-agent-details.md first)
- Application Insights resource is provisioned (if enabling telemetry)

## Steps

### Step 1: Navigate to Advanced Settings Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.preview.microsoft.com/environments/e2bd2cb1-3e05-e886-81d2-16aa081a3e04/bots/276dcc5a-3d47-f011-877a-7c1e52698560/manage/advanced`

**Expected Result**: Browser loads the Advanced settings page for SupportBot.

### Step 2: Capture Current Advanced Settings

**Tool**: `browser_snapshot`

**Expected Result**: Advanced settings page displays configuration options.

**Verify**:
- Page has loaded completely
- Advanced settings sections are visible
- No error banners present

### Step 3: Enable Application Insights Telemetry

**Tool**: `browser_snapshot`

**Verify**: Locate the "Application Insights" or "Telemetry" section. Check if it is currently enabled or disabled.

NOTE: If Application Insights is not available in the UI, this feature may need to be configured at the environment level. Skip to Step 4 if not present.

#### Step 3a: Click Application Insights Toggle or Configuration

**Tool**: `browser_click`
**Parameters**:
- element: "Application Insights toggle or configure button"
- ref: `[from snapshot]`

**Expected Result**: Application Insights configuration panel opens or the toggle is enabled.

#### Step 3b: Enter Connection String (if prompted)

**Tool**: `browser_snapshot`

**Verify**: If a connection string input appears, the Application Insights instrumentation key or connection string must be provided.

**Tool**: `browser_type`
**Parameters**:
- element: "Application Insights connection string input"
- ref: `[from snapshot]`
- text: "[Application Insights connection string]"

**Expected Result**: Connection string is entered.

NOTE: The actual connection string must be obtained from the Azure portal for the target Application Insights resource. Do not commit connection strings to source control.

#### Step 3c: Save Application Insights Configuration

**Tool**: `browser_click`
**Parameters**:
- element: "Save or Apply button"
- ref: `[from snapshot]`

**Expected Result**: Application Insights telemetry is enabled and configured.

### Step 4: Enable Enhanced Transcripts to Dataverse

**Tool**: `browser_snapshot`

**Verify**: Locate the "Transcripts" or "Enhanced transcripts" section. Check if Dataverse transcript logging is enabled.

NOTE: If already enabled, skip to Step 5.

#### Step 4a: Enable Dataverse Transcripts

**Tool**: `browser_click`
**Parameters**:
- element: "Enhanced transcripts to Dataverse toggle"
- ref: `[from snapshot]`

**Expected Result**: Enhanced transcript logging to Dataverse is enabled.

#### Step 4b: Verify Transcript Setting

**Tool**: `browser_snapshot`

**Verify**: The transcript toggle is now in the ON state.

### Step 5: Verify Metadata and Endpoint Information

**Tool**: `browser_snapshot`

**Verify**: Review the metadata section for:
- Bot ID matches: `276dcc5a-3d47-f011-877a-7c1e52698560`
- Environment ID matches: `e2bd2cb1-3e05-e886-81d2-16aa081a3e04`
- Token endpoint URL (if displayed)
- Schema name

NOTE: Document any endpoint URLs displayed for reference in integration configurations.

### Step 6: Enable External Agent Calling Scenarios

**Tool**: `browser_snapshot`

**Verify**: Look for settings related to external agent calling, such as:
- "Allow this agent to be called externally"
- "External connections" or "API access"
- Direct Line or similar channel configurations for programmatic access

NOTE: If these settings are present and not yet enabled, click to enable them.

#### Step 6a: Enable External Calling (if available)

**Tool**: `browser_click`
**Parameters**:
- element: "External agent calling toggle or option"
- ref: `[from snapshot]`

**Expected Result**: External calling capability is enabled.

### Step 7: Final Verification Snapshot

**Tool**: `browser_snapshot`

**Expected Result**: All advanced settings are configured.

**Verify**:
- Application Insights telemetry: Enabled (or noted as environment-level)
- Enhanced Dataverse transcripts: Enabled
- Metadata and endpoints: Documented
- External agent calling: Enabled (if available)
- No unsaved changes indicators
- No error banners

## Verification

Confirm the following advanced settings:
1. Application Insights telemetry is enabled (or documented as requiring environment-level setup)
2. Enhanced transcripts to Dataverse are enabled
3. Bot ID and Environment ID match expected values
4. External agent calling scenarios are configured

## Rollback

To revert advanced settings:
1. Navigate to the Advanced settings page (Step 1)
2. Disable Application Insights by removing the connection string or toggling OFF
3. Disable enhanced transcripts by toggling OFF
4. Disable external calling if it was enabled
5. Use `browser_snapshot` to confirm all settings are reverted
