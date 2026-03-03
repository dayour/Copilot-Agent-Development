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
| Libraries and lists | `recipes-library`, `hr-policy-library`, `training-library`, `operations-library`, `seasonal-menu-library`, `shift-schedule-list`, `handover-log-list`, `equipment-inventory-list`, `store-contact-directory-list` |
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
6. Create the four structured lists with the columns defined in the solution:
   - Shift Schedule: Store, Date, Shift, Employee, Role, Status
   - Handover Log: Store, Date, FromEmployee, ToEmployee, CashBalanced, StockChecked, Issues, Timestamp
   - Equipment Inventory: Store, Item, SerialNumber, LastMaintenance, NextService, Status
   - Store Contact Directory: Store, Manager, RegionalDirector, Phone, Email

### 3. Configure List Formatting for Visual Status Indicators
1. For the Shift Schedule list, apply column formatting on the Status column:
   - Confirmed: green background
   - Scheduled: blue background
   - Swapped: orange background
   - Absent: red background
2. For the Handover Log list, apply column formatting on the CashBalanced column:
   - True: green background
   - False: red background
3. For the Equipment Inventory list, apply column formatting on the Status column:
   - Operational: green background
   - Needs Service: orange background
   - Out of Service: red background
   - Under Repair: yellow background
4. Use the SharePoint column formatting JSON editor to apply color rules, or use a Power Apps custom list form for a richer visual experience.

### 4. Configure Search Schema for Knowledge Ingestion
1. In SharePoint admin center, verify crawl status for all target libraries.
2. Map crawled properties to managed properties for:
   - Drink category
   - Policy type
   - Region
   - Role
3. Mark managed properties as searchable and queryable where needed.
4. Reindex updated libraries after schema changes.

### 5. Import the Copilot Studio Solution
1. Open **Solutions** and select **Import solution**.
2. Import `solution/solution-definition.yaml`.
3. Populate environment variables for all SharePoint URLs and list endpoints.
4. Confirm all agent components and flows import without errors.

### 6. Configure Knowledge Sources
1. Open the Virtual Coach agent.
2. Under **Knowledge**, confirm each source points to the correct SharePoint library URL.
3. Run initial sync.
4. Validate retrieval quality with recipe, policy, training, operations, and seasonal menu prompts.

### 7. Configure Power Automate Flows (SharePoint-Specific)
1. Bind SharePoint connections for all imported flows.
2. Validate flow triggers and actions:
   - SharePoint list read for shift schedule queries.
   - SharePoint list create for handover log writeback.
   - SharePoint list read for equipment inventory queries.
   - SharePoint list read for store contact directory lookups.
   - SharePoint file approval notifications for recipe/policy content updates.
3. Confirm least-privilege access for service accounts.

### 8. Configure Authentication and Channels
1. Set authentication to Entra ID in Copilot Studio.
2. Publish to Microsoft Teams for desk-based staff.
3. Publish to custom website/mobile web chat for floor baristas.
4. Validate role-trimmed responses based on SharePoint permissions.

## Power Automate Flow Reference

| Flow Name | Trigger | SharePoint Connector Usage |
|-----------|---------|----------------------------|
| QueryShiftSchedule | Copilot Studio topic action | Get items from `shift-schedule-list` filtered by store and date |
| SaveHandoverLog | Copilot Studio topic action | Create item in `handover-log-list` |
| QueryEquipmentInventory | Copilot Studio topic action | Get items from `equipment-inventory-list` filtered by store |
| QueryStoreContactDirectory | Copilot Studio topic action | Get items from `store-contact-directory-list` filtered by store |
| NotifyContentApprovalPending | SharePoint file created or modified | Post approval notification to Teams/Email when status is Pending |

## Post-Deployment Validation

- [ ] Recipes return current approved versions from `recipes-library`.
- [ ] HR and policy responses ground only in approved `hr-policy-library` content.
- [ ] Training and operations topics retrieve role-relevant pages and documents.
- [ ] Shift schedule queries return correct assignments from `shift-schedule-list` with color-coded status.
- [ ] Shift handover submissions create records in `handover-log-list` with all required fields.
- [ ] Equipment inventory queries return current status from `equipment-inventory-list` with color-coded status.
- [ ] Store contact lookups return manager, regional director, phone, and email from `store-contact-directory-list`.
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
