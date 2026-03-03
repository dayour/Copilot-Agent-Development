# Document Governance - Virtual Coach (Coffee)

## Overview

This guide defines the document governance model for a multi-hundred-store coffee chain deployment. It covers Azure AD security group design, SharePoint permissions inheritance, Microsoft Purview sensitivity labels, data loss prevention policies, Information Barriers, and the validation model that ensures the Virtual Coach agent surfaces only content the authenticated user is authorized to see.

---

## Azure AD Security Group Design

### Group Hierarchy

Three tiers of security groups map directly to the SharePoint hub architecture and control access at each level.

#### Corporate Function Groups

| Group Name Pattern | Purpose | Membership |
|--------------------|---------|------------|
| `sg-coffee-corporate-hr` | HR content owners and corporate HR staff | Corporate HR team |
| `sg-coffee-corporate-ops` | Corporate operations and brand standards owners | Corporate operations team |
| `sg-coffee-corporate-finance` | Payroll guides and financial governance content | Finance and payroll team |
| `sg-coffee-corporate-legal` | Legal, compliance, and disciplinary procedure content | Legal and compliance team |
| `sg-coffee-corporate-training` | Global training content authors | L&D team |
| `sg-coffee-corporate-readonly` | Executives and auditors with read-only access to all content | Executive sponsors, internal audit |

#### Regional Groups

| Group Name Pattern | Purpose | Membership |
|--------------------|---------|------------|
| `sg-coffee-region-<region-code>-mgrs` | Regional managers with access to all stores in the region | Regional directors and area managers |
| `sg-coffee-region-<region-code>-ops` | Regional operations staff with access to regional operational content | Regional ops coordinators |
| `sg-coffee-region-<region-code>-readonly` | Regional read-only access (auditors, HR business partners) | Regional HR and audit staff |

Replace `<region-code>` with the region identifier used in the managed metadata term set (for example, `na-east`, `emea-west`).

#### Store Groups

| Group Name Pattern | Purpose | Membership |
|--------------------|---------|------------|
| `sg-coffee-store-<store-number>-managers` | Store manager and assistant manager | Store manager, assistant managers |
| `sg-coffee-store-<store-number>-leads` | Shift leads with access to operational and handover content | All shift leads at the store |
| `sg-coffee-store-<store-number>-baristas` | Barista-level access (recipes, training, menu, shift handover) | All barista staff at the store |

Replace `<store-number>` with the four- or five-digit store identifier from the store directory.

#### Franchise vs. Corporate Ownership Groups

Used specifically to enforce Information Barriers between franchise-operated and corporate-operated stores.

| Group Name Pattern | Purpose |
|--------------------|---------|
| `sg-coffee-ownership-franchise` | All staff from franchise-owned stores |
| `sg-coffee-ownership-corporate` | All staff from corporate-owned stores |

### Group Provisioning Guidance

1. Provision groups from the HR system of record using Entra ID Lifecycle Workflows or a scheduled provisioning script.
2. Use dynamic membership rules where feasible:
   - Barista group: `user.extensionAttribute1 -eq "<store-number>" -and user.extensionAttribute2 -eq "barista"`
   - Store manager group: `user.extensionAttribute1 -eq "<store-number>" -and user.extensionAttribute2 -eq "store-manager"`
3. Nest store groups into regional groups to avoid redundant permission assignments:
   - All `sg-coffee-store-<store-number>-*` groups nest under `sg-coffee-region-<region-code>-*` groups for the corresponding region.
4. Nest regional groups into corporate read-only where cross-region visibility is approved.
5. Review group membership quarterly using Entra ID Access Reviews.

---

## SharePoint Permissions Inheritance

### Three-Tier Model

```
Corporate Root Hub
    |-- Corporate libraries (HR, Operations, Brand, Legal, Finance)
    |
    +-- Regional Hub (region-na-east)
    |       |-- Regional libraries (regional operations, promotions)
    |       |
    |       +-- Store Site (store-00142)
    |       |       |-- Local libraries (shift-handover-list, local notices)
    |       |
    |       +-- Store Site (store-00143)
    |               |-- Local libraries (shift-handover-list, local notices)
    |
    +-- Regional Hub (region-emea-west)
            |-- ...
```

### Permissions Inheritance Rules

| Scope | Inherited From | Overrides Allowed | Assigned Groups |
|-------|---------------|-------------------|-----------------|
| Corporate Root Hub | None (root) | No | `sg-coffee-corporate-*` groups |
| Corporate HR library | Corporate Root Hub | Yes (break inheritance for restricted content) | `sg-coffee-corporate-hr`, `sg-coffee-corporate-legal`, `sg-coffee-corporate-readonly` |
| Corporate Finance library | Corporate Root Hub | Yes | `sg-coffee-corporate-finance`, `sg-coffee-corporate-hr`, `sg-coffee-corporate-readonly` |
| Regional Hub | Corporate Root Hub (read-only cascade) | Yes | `sg-coffee-region-<region-code>-*` groups |
| Store Site | Regional Hub | Yes | `sg-coffee-store-<store-number>-*` groups |
| Shift Handover list | Store Site | Yes (store-scoped only) | `sg-coffee-store-<store-number>-leads`, `sg-coffee-store-<store-number>-managers` |
| Local notices library | Store Site | Yes (store-scoped only) | `sg-coffee-store-<store-number>-*` groups |

### Configuring Hub-Site Permissions Inheritance

1. Enable permissions inheritance at hub level using PnP PowerShell:

   ```powershell
   Connect-PnPOnline -Url "https://<tenant>.sharepoint.com/sites/coffee-corp-hub" -Interactive

   # Apply corporate-level security groups to hub
   Set-PnPGroupPermissions -Identity "sg-coffee-corporate-hr"    -AddRole "Read" -LibraryName "hr-policy-library"
   Set-PnPGroupPermissions -Identity "sg-coffee-corporate-ops"   -AddRole "Contribute" -LibraryName "operations-library"
   Set-PnPGroupPermissions -Identity "sg-coffee-corporate-readonly" -AddRole "Read"
   ```

2. Configure hub permissions propagation. Hub-associated sites inherit the hub navigation but do not automatically inherit document permissions. Assign regional and store groups explicitly.

3. Break permission inheritance for confidential libraries:

   ```powershell
   # Break inheritance on HR policy library to apply restricted access
   Set-PnPListPermission -Identity "hr-policy-library" -BreakRoleInheritance -CopyRoleAssignments:$false -SystemUpdate

   # Grant only HR and Legal groups access
   Set-PnPListPermission -Identity "hr-policy-library" -Group "sg-coffee-corporate-hr" -AddRole "Read"
   Set-PnPListPermission -Identity "hr-policy-library" -Group "sg-coffee-corporate-legal" -AddRole "Read"
   Set-PnPListPermission -Identity "sg-coffee-corporate-finance" -AddRole "Read"
   ```

4. Apply store-level overrides for local content:

   ```powershell
   Connect-PnPOnline -Url "https://<tenant>.sharepoint.com/sites/store-00142" -Interactive

   # Local notices library: readable by all store staff, manageable by store manager
   Set-PnPListPermission -Identity "local-notices-library" -Group "sg-coffee-store-00142-baristas" -AddRole "Read"
   Set-PnPListPermission -Identity "local-notices-library" -Group "sg-coffee-store-00142-leads"    -AddRole "Contribute"
   Set-PnPListPermission -Identity "local-notices-library" -Group "sg-coffee-store-00142-managers" -AddRole "Full Control"

   # Shift handover list: restricted to leads and managers only
   Set-PnPListPermission -Identity "shift-handover-list" -Group "sg-coffee-store-00142-baristas" -AddRole "Contribute"
   Set-PnPListPermission -Identity "shift-handover-list" -Group "sg-coffee-store-00142-leads"    -AddRole "Contribute"
   Set-PnPListPermission -Identity "shift-handover-list" -Group "sg-coffee-store-00142-managers" -AddRole "Full Control"
   ```

### Content-Level Permissions Summary

| Content Type | Baristas | Shift Leads | Store Managers | Regional Managers | Corporate HR | Corporate Finance | Corporate Legal |
|--------------|----------|-------------|----------------|-------------------|--------------|-------------------|-----------------|
| Drink recipes | Read | Read | Read | Read | Read | None | None |
| Training guides | Read | Read | Read | Read | Read | None | None |
| Operations guides | Read | Read | Read | Read | Read | None | None |
| Seasonal menu | Read | Read | Read | Read | Read | None | None |
| HR policy (general) | Read | Read | Read | Read | Full Control | None | Read |
| HR policy (disciplinary) | None | None | Read | Read | Full Control | None | Full Control |
| Payroll guides | None | None | None | None | Read | Full Control | Read |
| Shift handover list | Contribute | Contribute | Full Control | Read | None | None | None |
| Local notices | Read | Contribute | Full Control | Read | None | None | None |
| Store directory | Read | Read | Contribute | Full Control | None | None | None |

---

## Sensitivity Labels

### Label Taxonomy for Coffee Content

Sensitivity labels are configured in Microsoft Purview and applied to documents in the SharePoint libraries. The agent grounding layer respects label-based access restrictions when serving answers.

| Label Name | Scope | Applied To | Access Control |
|------------|-------|-----------|----------------|
| `Public` | File, Site | External-facing menu PDFs, public recipes | No restriction |
| `Internal` | File, Site | General operational guides, training materials, recipes | All authenticated staff |
| `Confidential - HR` | File | General HR policies, onboarding policies, codes of conduct | Store managers+, HR staff |
| `Confidential - Disciplinary` | File | Disciplinary procedures, performance improvement plans, grievance processes | Store managers+, HR, Legal |
| `Confidential - Payroll` | File | Payroll guides, compensation structures, pay scales | HR Finance, Finance only |
| `Restricted - Legal` | File | Legal holds, litigation-related HR matters, regulatory correspondence | Legal only |

### Applying Sensitivity Labels

1. In Microsoft Purview compliance portal, create labels matching the taxonomy above under **Information Protection > Labels**.
2. Publish the label policy to all users or the target Microsoft 365 group containing coffee-chain staff.
3. Configure automatic labeling rules for the SharePoint libraries:
   - `hr-policy-library`: auto-apply `Confidential - HR` based on content type `HrPolicy`.
   - Sub-folder or content-type override for disciplinary documents: auto-apply `Confidential - Disciplinary` based on content type `DisciplinaryRecord` or keyword classification.
   - `FinanceLibraryUrl` equivalent libraries: auto-apply `Confidential - Payroll`.
4. Configure label encryption for `Confidential - Disciplinary`, `Confidential - Payroll`, and `Restricted - Legal`:
   - Assign permissions to specific security groups only.
   - Enable co-authoring if SharePoint Online co-authoring with sensitivity labels is enabled in the tenant.
5. In SharePoint admin center, enable sensitivity labels for SharePoint and OneDrive at tenant level:
   `SharePoint admin center > Settings > Default sensitivity labels`.

### Agent Grounding and Sensitivity Labels

Copilot Studio knowledge sources indexed from SharePoint inherit label-based access control automatically when:
- The user authenticates via Entra ID (SSO in Teams or web chat).
- The Copilot Studio knowledge connector uses user-delegated identity (not a service account).
- The SharePoint search index respects label-based access control (default when labels are published and SharePoint search is used as the grounding mechanism).

Do not use a service account with elevated permissions for knowledge retrieval. Using a service account bypasses label-based and permission-based access control and is not permitted for this deployment.

---

## Data Loss Prevention Policies

### Purview DLP Policies for SharePoint Content

Configure DLP policies in Microsoft Purview to prevent the agent from surfacing restricted content to unauthorized roles.

#### Policy 1: Block Payroll Content Outside Finance Group

| Setting | Value |
|---------|-------|
| Policy name | `DLP-Coffee-PayrollContentRestriction` |
| Scope | SharePoint libraries with `Confidential - Payroll` label |
| Condition | Content contains sensitive info type: Salary, Bank account, or `Confidential - Payroll` label |
| Action | Block sharing and access for users not in `sg-coffee-corporate-finance` or `sg-coffee-corporate-hr` |
| User notification | Notify user with a policy tip explaining why content is blocked |
| Override | Not allowed |

#### Policy 2: Block Disciplinary Content Below Manager Level

| Setting | Value |
|---------|-------|
| Policy name | `DLP-Coffee-DisciplinaryContentRestriction` |
| Scope | SharePoint libraries with `Confidential - Disciplinary` label |
| Condition | Content type is `DisciplinaryRecord` or label is `Confidential - Disciplinary` |
| Action | Block access for users not in `sg-coffee-store-<n>-managers`, `sg-coffee-corporate-hr`, or `sg-coffee-corporate-legal` |
| User notification | Notify user with a policy tip |
| Override | Not allowed |

#### Policy 3: Prevent Cross-Franchise-Corporate Content Sharing

| Setting | Value |
|---------|-------|
| Policy name | `DLP-Coffee-FranchiseCorporateBarrier` |
| Scope | All SharePoint sites in the coffee hub architecture |
| Condition | Content shared or accessed between members of `sg-coffee-ownership-franchise` and `sg-coffee-ownership-corporate` |
| Action | Block sharing and notify DLP administrator |
| Incident report | Send to compliance officer email |
| Override | Allowed with business justification only (logged) |

### Power Platform DLP Policy

In the Power Platform Admin Center, configure a DLP policy scoped to the coffee production environment:

| Connector | Group |
|-----------|-------|
| SharePoint Online | Business |
| Microsoft Teams | Business |
| Office 365 Outlook | Business |
| Dataverse | Business |
| Microsoft Forms | Business |
| HTTP (generic) | Blocked |
| Custom connectors (unapproved) | Blocked |
| Social media connectors | Blocked |
| Personal storage connectors (Dropbox, Box, personal OneDrive) | Blocked |

This prevents agent flows from routing restricted SharePoint content to unapproved external endpoints.

---

## Information Barriers

Information Barriers in Microsoft Purview prevent communication and collaboration between members of `sg-coffee-ownership-franchise` and `sg-coffee-ownership-corporate`. This enforces content isolation between franchise-operated and corporate-operated stores.

### Segment Definitions

| Segment Name | Associated Security Group | Description |
|--------------|--------------------------|-------------|
| `CoffeeFranchise` | `sg-coffee-ownership-franchise` | All staff employed by franchise operators |
| `CoffeeCorporate` | `sg-coffee-ownership-corporate` | All staff employed directly by the corporate entity |

### Information Barrier Policy Definitions

#### Policy: Block franchise-to-corporate collaboration

```powershell
# Connect to Security and Compliance PowerShell
Connect-IPPSSession

# Define segments
New-OrganizationSegment -Name "CoffeeFranchise" -UserGroupFilter "MemberOf -eq 'sg-coffee-ownership-franchise'"
New-OrganizationSegment -Name "CoffeeCorporate" -UserGroupFilter "MemberOf -eq 'sg-coffee-ownership-corporate'"

# Create barrier policies
New-InformationBarrierPolicy -Name "Block-Franchise-Corporate" -AssignedSegment "CoffeeFranchise" -SegmentsBlocked "CoffeeCorporate" -State Active
New-InformationBarrierPolicy -Name "Block-Corporate-Franchise" -AssignedSegment "CoffeeCorporate" -SegmentsBlocked "CoffeeFranchise" -State Active

# Apply policies
Start-InformationBarrierPoliciesApplication
```

### Content Isolation in SharePoint

After Information Barriers are activated:
- SharePoint enforces search result isolation for users in blocked segments.
- The Virtual Coach knowledge grounding layer will not return content from corporate libraries to franchise staff queries, and vice versa, because the search index applies IB policy filtering before returning results.
- Verify IB mode on the SharePoint tenant is set to `Owner Moderated` or `Explicit` to enforce document library access isolation, not only people-picker filtering.

### Exceptions and Escalation

Exceptions to Information Barriers require approval from the Legal or Compliance team. Document each exception in the compliance exception register. Temporary segment membership changes must be reviewed and reverted within 30 days.

---

## Agent Permission Validation (SharePoint ACL Pass-Through)

The Virtual Coach agent must serve answers using the calling user's Entra identity, not a service account, so SharePoint permission trimming applies to all knowledge retrieval.

### How Permission Trimming Works

1. User authenticates via Entra ID in Teams or web chat (SSO).
2. Copilot Studio issues knowledge queries against SharePoint search on behalf of the authenticated user identity.
3. SharePoint search returns only documents the user has permission to read (search-level trimming plus ACL-level trimming).
4. Generative answers are grounded only in trimmed search results.
5. The agent never exposes document metadata, URLs, or content from libraries the user cannot access.

### Configuration Requirements

| Setting | Required Value |
|---------|---------------|
| Copilot Studio authentication mode | Authenticate with Microsoft (Entra ID) |
| Knowledge source connection | Delegated identity (user context), not service account |
| Tenant restriction | Enforced (internal tenant only) |
| SSO in Teams channel | Enabled |
| `AllowExternalSharing` on HR libraries | Disabled |
| SharePoint search schema `SearchableAndQueryable` | Enabled for metadata properties used in filters |

### Validating Permission Trimming by Role

Run the following validation matrix after deployment. Test each persona using a dedicated test account that is a member of only the expected security groups.

| Test Persona | Groups | Expected: Sees Recipes | Expected: Sees General HR | Expected: Sees Disciplinary | Expected: Sees Payroll | Expected: Sees Store Operations |
|---|---|---|---|---|---|---|
| Barista (store 00142) | `sg-coffee-store-00142-baristas` | Yes | No | No | No | Yes |
| Shift lead (store 00142) | `sg-coffee-store-00142-leads` | Yes | Yes | No | No | Yes |
| Store manager (store 00142) | `sg-coffee-store-00142-managers` | Yes | Yes | Yes | No | Yes |
| Regional manager (na-east) | `sg-coffee-region-na-east-mgrs` | Yes | Yes | Yes | No | Yes |
| Corporate HR staff | `sg-coffee-corporate-hr` | Yes | Yes | Yes | Read | Yes |
| Corporate Finance staff | `sg-coffee-corporate-finance` | No | No | No | Yes | No |
| Corporate Legal staff | `sg-coffee-corporate-legal` | No | Yes | Yes | Read | No |
| Franchise barista (store 00501) | `sg-coffee-store-00501-baristas`, `sg-coffee-ownership-franchise` | Yes (franchise store only) | No | No | No | Yes (franchise store only) |

### Validation Test Procedure

For each persona:

1. Sign in to the Teams channel or web chat as the test account.
2. Submit a query targeting each content category (recipes, HR policy, disciplinary, payroll, operations).
3. Confirm the agent returns grounded content only for permitted categories.
4. Confirm the agent returns a fallback message (not a permission error disclosure) for restricted categories.
5. Verify no document URLs, file names, or content previews from restricted libraries appear in responses.
6. Log results against the matrix above in the validation register.

### Fallback Message Configuration for Restricted Content

When knowledge retrieval returns no results due to permission trimming, the agent must return a neutral message that does not reveal whether the content exists.

Recommended fallback message for restricted topics:

```text
I was not able to find information on that topic in the resources available to you.
Contact your store manager or HR representative for further guidance.
```

Do not surface messages such as "you do not have access to this document" because this reveals the existence of the restricted content.

---

## Governance Maintenance

| Task | Frequency | Owner |
|------|-----------|-------|
| Review Entra ID security group membership | Quarterly | Identity and Access Management team |
| Run Entra ID Access Reviews for store groups | Bi-annually | Store HR business partners |
| Audit SharePoint permission assignments (using SharePoint admin center > Active sites > Permissions) | Quarterly | SharePoint governance lead |
| Review sensitivity label coverage (Purview Content Explorer) | Monthly | Information Protection lead |
| Review DLP policy match reports (Purview Reports > DLP) | Monthly | Compliance officer |
| Validate Information Barrier policies are active and applied | Quarterly | Compliance officer |
| Run agent permission validation matrix (see above) | After each major permission change and quarterly | Platform Admin |
| Update store group provisioning for new store openings | On store opening event | Identity and Access Management team |
| Decommission store groups for closed stores | On store closure event | Identity and Access Management team |
