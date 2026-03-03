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

### 7. Configure Authentication and Channels
1. Set authentication to Entra ID in Copilot Studio.
2. Set identity mode to delegated user identity. Do not use a service account for knowledge retrieval.
3. Publish to Microsoft Teams for desk-based staff.
4. Publish to custom website/mobile web chat for floor baristas.
5. Validate role-trimmed responses based on SharePoint permissions.

### 8. Configure Document Governance

Complete all steps in `document-governance.md` before publishing to production. The critical path is:

1. Provision Azure AD security groups (corporate, regional, store, ownership tiers).
2. Apply SharePoint permissions inheritance and break inheritance where required for confidential libraries.
3. Configure and publish Microsoft Purview sensitivity labels.
4. Apply automatic labeling policies to the HR policy library for HR, disciplinary, and payroll content types.
5. Configure Purview DLP policies for payroll restriction, disciplinary restriction, and franchise-corporate barrier.
6. Configure Information Barriers for franchise and corporate ownership segments if `InformationBarriersEnabled` is set to true.
7. Populate governance environment variables in the Copilot Studio environment:
   - `CorporateHubSiteId`
   - `InformationBarriersEnabled`
   - `DlpComplianceOfficerEmail`
   - `SensitivityLabelIdHrConfidential`
   - `SensitivityLabelIdDisciplinary`
   - `SensitivityLabelIdPayroll`
8. Run the permission validation matrix defined in `document-governance.md` using test accounts for each persona.

## Power Automate Flow Reference

| Flow Name | Trigger | SharePoint Connector Usage |
|-----------|---------|----------------------------|
| SaveShiftHandoverToSharePoint | Copilot Studio topic action | Create item in `shift-handover-list` |
| QueryStoreDirectory | Copilot Studio topic action | Get items from `store-directory-list` |
| NotifyContentApprovalPending | SharePoint file created or modified | Post approval notification to Teams/Email when status is Pending |

## Post-Deployment Validation

- [ ] Recipes return current approved versions from `recipes-library`.
- [ ] HR and policy responses ground only in approved `hr-policy-library` content.
- [ ] Training and operations topics retrieve role-relevant pages and documents.
- [ ] Store lookup returns correct region, manager, and contact details from `store-directory-list`.
- [ ] Shift handover submissions create records in `shift-handover-list`.
- [ ] Menu update requests resolve from `seasonal-menu-library`.
- [ ] Teams and mobile web channels both return consistent grounded answers.
- [ ] Barista test account cannot retrieve disciplinary or payroll content via the agent.
- [ ] Store manager test account can retrieve disciplinary content but not payroll content.
- [ ] Franchise staff test account cannot retrieve content from corporate-owned store libraries.
- [ ] DLP policy tips display correctly when restricted content is accessed outside authorized groups.
- [ ] Information Barriers (if enabled) prevent cross-segment content discovery in search results.
- [ ] Sensitivity labels are present on all documents in `hr-policy-library` (verify in Purview Content Explorer).
- [ ] Agent returns neutral fallback message (not permission error) when content is not accessible.

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review unresolved queries and gaps | Weekly | Copilot Studio Admin |
| Validate metadata completeness in libraries | Weekly | SharePoint Content Owner |
| Review content approvals and stale drafts | Daily | Operations Governance Lead |
| Re-sync knowledge sources after major updates | As needed | Platform Admin |
| Audit list writeback success rates | Weekly | Power Platform Admin |
| Review Entra ID security group membership accuracy | Quarterly | Identity and Access Management team |
| Review DLP policy match reports in Purview | Monthly | Compliance Officer |
| Validate sensitivity label coverage via Purview Content Explorer | Monthly | Information Protection Lead |
| Validate Information Barrier policies are active (if enabled) | Quarterly | Compliance Officer |
| Run agent permission validation matrix | Quarterly and after permission changes | Platform Admin |

## Rollback Procedure

1. Unpublish the current agent version.
2. Restore the previous solution package from source control.
3. Re-import and republish.
4. Rebind SharePoint connections if required.
5. Notify regional operations and store managers.
