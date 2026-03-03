# Content Approval Workflows - Virtual Coach (Coffee)

This document describes the three Power Automate content approval workflows that govern knowledge quality for the Virtual Coach agent. All workflows use SharePoint document library triggers and maintain version history to ensure only verified content is served by the agent.

## Overview

| Flow Name | Library | Reviewers | Auto-Refresh |
|-----------|---------|-----------|--------------|
| RecipeApprovalFlow | `recipes-library` | Training Lead | Yes, on approval |
| PolicyUpdateFlow | `hr-policy-library` | Legal, then Compliance | Yes, on dual approval |
| TrainingMaterialFlow | `training-library` | Regional Manager | Yes, on approval |

All three flows share common behaviors:

- SharePoint major/minor versioning is used for version history. Draft submissions are minor versions. Approved content is promoted to a major version.
- On approval, the corresponding Copilot Studio knowledge source is refreshed automatically so the agent serves up-to-date content.
- When the number of content items changing approval status within any rolling 60-minute window meets or exceeds the configured threshold (default: 5), the Copilot Studio admin is notified by email to perform manual knowledge source validation.

---

## Recipe Approval Flow

### Purpose

Ensures that only Training Lead-verified recipes are available to baristas through the Virtual Coach agent.

### Trigger

SharePoint: when a file is created or modified in `recipes-library` with `ApprovalStatus` equal to `Pending`.

### Steps

1. Author creates or updates a recipe document in `recipes-library`. The document is saved as a minor version with `ApprovalStatus` set to `Pending`.
2. The flow sends an approval request email and adaptive card to the Training Lead (`TrainingLeadEmail`).
3. **If approved:**
   - The document is promoted to the next major version.
   - `ApprovalStatus` is updated to `Approved`.
   - The `recipes-library` knowledge source in Copilot Studio is refreshed.
   - The author receives a confirmation notification.
4. **If rejected:**
   - The document remains at the current minor version with `ApprovalStatus` set to `Rejected`.
   - The author receives an email with the Training Lead's rejection comments.

### Version History

SharePoint versioning is enabled with both major and minor versions tracked. The full version history is visible in the SharePoint library version history pane for each document.

### Bulk Change Notification

When five or more recipe documents transition from `Pending` to a terminal status (`Approved` or `Rejected`) within any 60-minute rolling window, an email notification is sent to the Copilot Studio admin (`CopilotStudioAdminEmail`) to prompt manual validation of the `recipes-library` knowledge source.

---

## Policy Update Flow

### Purpose

Ensures that HR policy documents undergo both Legal review and Compliance sign-off before reaching agents and store staff.

### Trigger

SharePoint: when a file is created or modified in `hr-policy-library` with `ApprovalStatus` equal to `Pending`.

### Steps

1. HR author creates or updates a policy document in `hr-policy-library`. The document is saved as a minor version with `ApprovalStatus` set to `Pending`.
2. The flow sends an approval request to the Legal team (`LegalTeamEmail`).
3. **If Legal rejects:**
   - `ApprovalStatus` is set to `Rejected`.
   - The author receives an email with Legal's rejection comments.
   - The workflow ends.
4. **If Legal approves:**
   - `ApprovalStatus` is updated to `Legal Approved`.
   - A second approval request is sent to the Compliance team (`ComplianceTeamEmail`).
5. **If Compliance rejects:**
   - `ApprovalStatus` is set to `Rejected`.
   - The author receives an email with Compliance's rejection comments.
   - The workflow ends.
6. **If Compliance approves:**
   - The document is promoted to the next major version.
   - `ApprovalStatus` is updated to `Approved`.
   - The `hr-policy-library` knowledge source in Copilot Studio is refreshed.
   - The author receives a confirmation notification.

### Version History

SharePoint versioning is enabled with both major and minor versions tracked. Each stage of review is recorded as a minor version so auditors can trace the full review history.

### Bulk Change Notification

When five or more policy documents transition through the approval chain within any 60-minute rolling window, an email notification is sent to the Copilot Studio admin (`CopilotStudioAdminEmail`) to prompt manual validation of the `hr-policy-library` knowledge source.

---

## Training Material Flow

### Purpose

Ensures that training content is approved by a Regional Manager and correctly tagged for role-based delivery before the agent serves it to staff.

### Trigger

SharePoint: when a file is created or modified in `training-library` with `ApprovalStatus` equal to `Pending`.

### Steps

1. Author creates or updates a training document in `training-library`. The document is saved as a minor version with `ApprovalStatus` set to `Pending` and `JobRole` and `StoreRegion` metadata pre-filled by the author.
2. The flow sends an approval request to the Regional Manager (`RegionalManagerEmail`).
3. **If approved:**
   - The document is promoted to the next major version.
   - `ApprovalStatus` is updated to `Approved`.
   - The flow validates and applies `JobRole` and `StoreRegion` metadata tags for role-based knowledge retrieval in Copilot Studio.
   - The `training-library` knowledge source in Copilot Studio is refreshed.
   - The author receives a confirmation notification.
4. **If rejected:**
   - The document remains at the current minor version with `ApprovalStatus` set to `Rejected`.
   - The author receives an email with the Regional Manager's rejection comments.

### Role-Based Delivery

After approval, the `JobRole` and `StoreRegion` managed metadata fields on the document are used by Copilot Studio knowledge filters. Baristas receive barista-tagged content; shift leads receive shift-lead-tagged content; store managers receive manager-tagged content. Authors must populate both fields before submission.

### Version History

SharePoint versioning is enabled with both major and minor versions tracked. The full version history is visible in the SharePoint library version history pane for each document.

### Bulk Change Notification

When five or more training documents transition from `Pending` to a terminal status within any 60-minute rolling window, an email notification is sent to the Copilot Studio admin (`CopilotStudioAdminEmail`) to prompt manual validation of the `training-library` knowledge source.

---

## Environment Variables

The following environment variables must be configured in the solution before enabling these workflows:

| Variable | Description |
|----------|-------------|
| `TrainingLeadEmail` | Email of the Training Lead reviewer for recipe approvals |
| `LegalTeamEmail` | Email of the Legal team reviewer for policy approvals |
| `ComplianceTeamEmail` | Email of the Compliance team reviewer for policy approvals |
| `RegionalManagerEmail` | Email of the Regional Manager reviewer for training approvals |
| `CopilotStudioAdminEmail` | Email of the Copilot Studio admin for bulk change notifications |
| `BulkChangeThreshold` | Number of approvals within 60 minutes that triggers admin notification (default: 5) |

---

## SharePoint Configuration Requirements

For each library (`recipes-library`, `hr-policy-library`, `training-library`):

1. Enable both major and minor versioning.
2. Enable content approval (moderated content).
3. Ensure the `ApprovalStatus` column is present and set to `Pending` on all new submissions.
4. Confirm that `JobRole` and `StoreRegion` managed metadata columns are present on `training-library`.
5. Grant the Power Automate service account `Approve` permission on each library.

---

## Testing the Workflows

1. Submit a test document to each library with `ApprovalStatus` set to `Pending`.
2. Confirm the reviewer receives an approval request.
3. Approve the request and verify that the document is promoted to a major version with `ApprovalStatus` set to `Approved`.
4. Confirm the Copilot Studio knowledge source shows updated content.
5. Submit five or more documents within 60 minutes and confirm the Copilot Studio admin receives a bulk change notification.
6. Reject a test document and confirm the author receives a notification with comments.
