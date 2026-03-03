# Runbook - Virtual Coach (Coffee)

## Overview

This runbook defines deployment and operations for the Virtual Coach Copilot Studio agent using SharePoint Online as the primary enterprise content system.

## Prerequisites

### Platform Prerequisites

| Requirement | Details |
|-------------|---------|
| Microsoft 365 licensing | Teams, SharePoint Online, and Power Platform entitlements |
| Copilot Studio licensing | Capacity aligned to expected store volume |
| Power Automate | Required for list writeback, notifications, and approvals |
| Dataverse environment | Solution-aware deployment and ALM |
| Entra ID | Authentication and role-based access |

### SharePoint Prerequisites

| Requirement | Details |
|-------------|---------|
| Hub architecture | Corporate Root Hub, Regional Hubs, and Store Sites provisioned |
| Managed metadata term sets | DrinkCategory, PolicyType, StoreRegion, JobRole |
| Content types | Recipe, HrPolicy, TrainingGuide, OperationsGuide, SeasonalMenuItem, ShiftHandoverRecord |
| Libraries and lists | `recipes-library`, `hr-policy-library`, `training-library`, `operations-library`, `seasonal-menu-library`, `shift-handover-list`, `store-directory-list` |
| Search readiness | Crawled properties mapped to managed properties for metadata fields used in knowledge retrieval |
| Governance controls | Versioning, content approval, and mandatory metadata enforced |

## Deployment Steps

### 1. Provision Copilot Studio Environment
1. Go to https://copilotstudio.microsoft.com.
2. Select or create the target Dataverse environment.
3. Confirm region and data residency settings.

### 2. Provision SharePoint Information Architecture
1. Create or validate the Corporate Root Hub.
2. Create Regional Hub sites and associate Store Sites to the correct regional hub.
3. Create required document libraries and lists on the appropriate hub or associated sites.
4. Apply content types and required managed metadata columns.
5. Enable major versioning and content approval for recipe, policy, and training libraries.

### 3. Configure Search Schema for Knowledge Ingestion
1. In SharePoint admin center, verify crawl status for all target libraries.
2. Map crawled properties to managed properties for:
   - Drink category
   - Policy type
   - Region
   - Role
3. Mark managed properties as searchable and queryable where needed.
4. Reindex updated libraries after schema changes.

### 4. Import the Copilot Studio Solution
1. Open **Solutions** and select **Import solution**.
2. Import `solution/solution-definition.yaml`.
3. Populate environment variables for all SharePoint URLs and list endpoints.
4. Confirm all agent components and flows import without errors.

### 5. Configure Knowledge Sources
1. Open the Virtual Coach agent.
2. Under **Knowledge**, confirm each source points to the correct SharePoint library URL.
3. Run initial sync.
4. Validate retrieval quality with recipe, policy, training, operations, and seasonal menu prompts.

### 6. Configure Power Automate Flows (SharePoint-Specific)
1. Bind SharePoint connections for all imported flows.
2. Validate flow triggers and actions:
   - SharePoint list create/update for shift handover records.
   - SharePoint list read for store lookup.
   - SharePoint file approval notifications for recipe/policy content updates.
3. Confirm least-privilege access for service accounts.

### 7. Configure Content Approval Workflows

See `workflows/content-approval-workflows.md` for full details on each flow.

1. Populate the following environment variables before enabling the approval flows:
   - `TrainingLeadEmail` - reviewer for recipe approvals.
   - `LegalTeamEmail` - first reviewer for policy approvals.
   - `ComplianceTeamEmail` - second reviewer for policy approvals.
   - `RegionalManagerEmail` - reviewer for training material approvals.
   - `CopilotStudioAdminEmail` - recipient for bulk change notifications.
   - `BulkChangeThreshold` - number of approvals within 60 minutes that triggers an admin notification (default: 5).
2. For each of `recipes-library`, `hr-policy-library`, and `training-library`:
   - Enable both major and minor versioning in library settings.
   - Enable content approval (moderated content).
   - Confirm the `ApprovalStatus` column is present.
   - Grant the Power Automate service account `Approve` permission on the library.
3. On `training-library`, confirm that `JobRole` and `StoreRegion` managed metadata columns are present and required for submission.
4. Verify that `RecipeApprovalFlow`, `PolicyUpdateFlow`, and `TrainingMaterialFlow` are enabled and show as running in Power Automate.
5. Submit a test document to each library and complete an end-to-end approval to confirm the Copilot Studio knowledge source refreshes correctly.

### 8. Configure Authentication and Channels
1. Set authentication to Entra ID in Copilot Studio.
2. Publish to Microsoft Teams for desk-based staff.
3. Publish to custom website/mobile web chat for floor baristas.
4. Validate role-trimmed responses based on SharePoint permissions.

## Power Automate Flow Reference

| Flow Name | Trigger | SharePoint Connector Usage |
|-----------|---------|----------------------------|
| SaveShiftHandoverToSharePoint | Copilot Studio topic action | Create item in `shift-handover-list` |
| QueryStoreDirectory | Copilot Studio topic action | Get items from `store-directory-list` |
| NotifyContentApprovalPending | SharePoint file created or modified | Post approval notification to Teams/Email when status is Pending |
| RecipeApprovalFlow | SharePoint file created or modified in `recipes-library` | Single-step approval via Training Lead; promotes to major version and refreshes knowledge source on approval |
| PolicyUpdateFlow | SharePoint file created or modified in `hr-policy-library` | Two-step approval via Legal then Compliance; promotes to major version and refreshes knowledge source on dual approval |
| TrainingMaterialFlow | SharePoint file created or modified in `training-library` | Single-step approval via Regional Manager; applies role-based tags and refreshes knowledge source on approval |

## Post-Deployment Validation

- [ ] Recipes return current approved versions from `recipes-library`.
- [ ] HR and policy responses ground only in approved `hr-policy-library` content.
- [ ] Training and operations topics retrieve role-relevant pages and documents.
- [ ] Store lookup returns correct region, manager, and contact details from `store-directory-list`.
- [ ] Shift handover submissions create records in `shift-handover-list`.
- [ ] Menu update requests resolve from `seasonal-menu-library`.
- [ ] Teams and mobile web channels both return consistent grounded answers.

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review unresolved queries and gaps | Weekly | Copilot Studio Admin |
| Validate metadata completeness in libraries | Weekly | SharePoint Content Owner |
| Review content approvals and stale drafts | Daily | Operations Governance Lead |
| Re-sync knowledge sources after major updates | As needed | Platform Admin |
| Audit list writeback success rates | Weekly | Power Platform Admin |

## Rollback Procedure

1. Unpublish the current agent version.
2. Restore the previous solution package from source control.
3. Re-import and republish.
4. Rebind SharePoint connections if required.
5. Notify regional operations and store managers.
