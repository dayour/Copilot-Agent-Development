# Configure ALM and Solution Pipeline

> Set up the Dev/Sandbox/Prod deployment pipeline and managed solution export for the Policy Advisor agent.

## Prerequisites

- Runbook 06-publishing-and-polishing.md completed successfully
- Agent is published in the development environment
- Target environments are provisioned:
  - Dev: Development environment (current -- GenAIClippy or equivalent)
  - Sandbox: Managed solution validation environment
  - Prod: Production environment with DLP restrictions
- Deployment pipeline permissions are granted in the Power Platform admin center

## Environment Topology

```
+-------------------+     +-------------------+     +-------------------+
|       DEV         |     |     SANDBOX       |     |       PROD        |
|                   |     |                   |     |                   |
| - Unmanaged       | --> | - Managed         | --> | - Managed         |
| - Multiple authors|     | - Functional      |     | - DLP restrictions|
| - Active editing  |     |   validation      |     | - End-user access |
| - PolicyAdvisor   |     | - Testing and QA  |     | - Monitored       |
|   v1.0.0.1        |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

NOTE: Domain-specific environments (e.g., HR-Dev, Legal-Dev) may exist for larger organizations. The pattern remains the same: unmanaged in dev, managed in downstream environments.

## Steps

### Step 1: Navigate to Solutions Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/`

Then:

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Copilot Studio home page loads.
**Verify**: Navigation menu is visible.

---

### Step 2: Open Solutions

**Tool**: `browser_click`
**Parameters**:
- element: "Solutions link or tab in the navigation menu"
- ref: (obtain from snapshot -- look for "Solutions" in the left navigation)

**Expected Result**: The Solutions page loads showing available solutions.
**Verify**: A list of solutions is displayed.

NOTE: Solutions may be accessed via the Power Apps maker portal (make.powerapps.com) if not directly available in Copilot Studio. Navigate to the appropriate portal as needed.

---

### Step 3: Verify PolicyAdvisor Solution Exists

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: The PolicyAdvisor solution appears in the solutions list.
**Verify**: Confirm the following:
- Solution name: PolicyAdvisor (or similar)
- Solution type: Unmanaged
- Version: v1.0.0.1 (or initial version)

NOTE: If the solution does not exist, it may need to be created. Navigate to "New solution" and create a solution named "PolicyAdvisor" with publisher prefix and version 1.0.0.1, then add the Policy Advisor agent as a component.

---

### Step 4: Open Solution Details

**Tool**: `browser_click`
**Parameters**:
- element: "PolicyAdvisor solution in the solutions list"
- ref: (obtain from snapshot -- look for the PolicyAdvisor solution row)

**Expected Result**: The solution detail page opens showing components.
**Verify**: The Policy Advisor agent appears as a component within the solution.

---

### Step 5: Click Deploy

**Tool**: `browser_click`
**Parameters**:
- element: "Deploy button or Export/Deploy option"
- ref: (obtain from snapshot -- look for "Deploy", "Export", or pipeline controls)

**Expected Result**: The deployment pipeline configuration dialog opens.
**Verify**: Pipeline options or target environment selectors are visible.

---

### Step 6: Create Deployment Pipeline (if needed)

**Tool**: `browser_snapshot`
**Parameters**: (none)

If no pipeline exists:

**Tool**: `browser_click`
**Parameters**:
- element: "Create new pipeline button"
- ref: (obtain from snapshot -- look for "New pipeline" or "Create pipeline")

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Standard pipeline option"
- ref: (obtain from snapshot -- look for "Standard" pipeline type)

**Expected Result**: A new standard deployment pipeline is created.
**Verify**: Pipeline configuration form is displayed with source and target fields.

NOTE: If a pipeline already exists for this environment, skip this step and proceed to Step 7. Standard pipeline is the recommended option for most deployments.

---

### Step 7: Configure Pipeline Target -- Sandbox

**Tool**: `browser_click`
**Parameters**:
- element: "Target environment selector"
- ref: (obtain from snapshot -- look for environment dropdown or selector)

Then:

**Tool**: `browser_click`
**Parameters**:
- element: "Sandbox environment option"
- ref: (obtain from snapshot -- look for the sandbox environment in the list)

**Expected Result**: Sandbox is selected as the deployment target.
**Verify**: Target environment field shows the sandbox environment name.

---

### Step 8: Verify Pipeline Configuration

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Pipeline shows:
- Source: Dev environment (current)
- Target: Sandbox environment
- Solution: PolicyAdvisor
**Verify**: All three values are correct.

---

### Step 9: Deploy to Sandbox

**Tool**: `browser_click`
**Parameters**:
- element: "Deploy or Run pipeline button"
- ref: (obtain from snapshot -- look for "Deploy", "Run", or "Start deployment")

**Expected Result**: Deployment dialog opens with version and notes fields.
**Verify**: Version and deployment notes inputs are visible.

---

### Step 10: Set Deployment Version

**Tool**: `browser_type`
**Parameters**:
- element: "Version input field"
- ref: (obtain from snapshot -- look for "Version" input)
- text: `1.0.0.1`

**Expected Result**: Version field shows 1.0.0.1.
**Verify**: Version is entered correctly.

---

### Step 11: Add Deployment Notes

**Tool**: `browser_type`
**Parameters**:
- element: "Deployment notes input field"
- ref: (obtain from snapshot -- look for "Notes", "Description", or "Comments" field)
- text: `Initial deployment of Policy Advisor agent for sandbox validation. Includes HR, Legal, and company policy knowledge sources.`

**Expected Result**: Deployment notes are entered.
**Verify**: Notes text is visible in the field.

---

### Step 12: Confirm Deployment

**Tool**: `browser_click`
**Parameters**:
- element: "Confirm deploy or Submit button"
- ref: (obtain from snapshot -- look for "Deploy", "Submit", or "Confirm")

**Expected Result**: Deployment begins to the sandbox environment.
**Verify**: A deployment progress indicator or confirmation message appears.

---

### Step 13: Wait for Deployment to Complete

**Tool**: `browser_wait_for`
**Parameters**:
- text: "Succeeded"
- time: 120

**Expected Result**: Deployment completes successfully.
**Verify**: Status shows "Succeeded" or equivalent success state.

NOTE: Deployment may take 1-5 minutes. If the wait times out, take a snapshot and check the deployment status manually.

---

### Step 14: Verify Deployment Status

**Tool**: `browser_snapshot`
**Parameters**: (none)

**Expected Result**: Deployment history shows a successful deployment to sandbox.
**Verify**: Confirm:
- Status: Succeeded
- Target: Sandbox environment
- Version: 1.0.0.1
- Solution type in sandbox: Managed

---

### Step 15: Document Production Deployment Steps

NOTE: Production deployment follows the same pattern as sandbox deployment but targets the production environment. Production deployment should only be executed after sandbox validation is complete.

Production deployment steps:
1. Validate agent behavior in sandbox environment
2. Open deployment pipeline and select production as target
3. Set version (increment if changes were made)
4. Add deployment notes referencing sandbox validation results
5. Deploy and wait for completion
6. Verify managed solution in production
7. Confirm DLP restrictions are applied

## Verification

- PolicyAdvisor solution exists as unmanaged in the dev environment
- Deployment pipeline is configured with sandbox as the target
- Solution is successfully deployed to sandbox as a managed solution
- Deployment history shows successful deployment with correct version
- No deployment errors or warnings

## Rollback

1. Navigate to the target sandbox environment
2. Open Solutions and locate the PolicyAdvisor managed solution
3. Select the solution and click "Delete" to remove the managed solution
4. Confirm deletion
5. Fix any issues in the dev environment
6. Re-deploy following this runbook from Step 9
