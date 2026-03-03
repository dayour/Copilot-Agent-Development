# Virtual Coach - Coffee

Virtual Coach is a Copilot Studio agent for a large coffee chain operating 500+ stores. It provides a single conversational entry point for baristas, shift leads, and store managers to access operational knowledge stored in SharePoint Online.

## SharePoint-Native Knowledge Backbone

The solution uses a three-tier SharePoint hub architecture:

1. Corporate Root Hub for enterprise standards, HR policies, and brand controls.
2. Regional Hubs for market-specific operations, promotions, and compliance overlays.
3. Store Sites for local handover logs, staffing context, and store-level notices.

Copilot Studio knowledge grounding is aligned to hub-associated libraries with managed metadata (drink category, policy type, region, role) for accurate retrieval and permission-trimmed responses.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Virtual Coach |
| **Vertical** | Coffee |
| **Primary Users** | Baristas, shift leads, store managers |
| **Channels** | Microsoft Teams (desk staff), mobile web chat (floor staff) |
| **Language** | English |

## Topic-to-Library Mapping

- **Drink Recipes** -> `recipes-library`
- **HR and Policy** -> `hr-policy-library`
- **Onboarding and Training** -> `training-library`
- **Store Operations** -> `operations-library`
- **Menu Update** -> `seasonal-menu-library`
- **Shift Handover** -> `shift-handover-list` (writeback)
- **Store Lookup** -> `store-directory-list` (lookup)

## Folder Structure

```text
virtual-coach/
|-- README.md
|-- runbook.md
|-- templates/
|   |-- agent-template.yaml
|-- solution/
|   `-- solution-definition.yaml
`-- sharepoint-pages/
    |-- README.md
    |-- store-dashboard.yaml
    |-- new-hire-onboarding-hub.yaml
    |-- recipe-reference-center.yaml
    |-- manager-portal.yaml
    |-- spfx-web-parts.yaml
    `-- page-permissions.yaml
```

## SharePoint Site Pages

Four SharePoint site pages embed the Virtual Coach agent for in-context assistance. See `sharepoint-pages/README.md` for the full deployment guide and responsive design details.

| Page | Audience | Key Features |
|------|----------|-------------|
| Store Dashboard | Baristas, shift leads | Daily ops summary, shift handover viewer, embedded agent |
| New Hire Onboarding Hub | New hires | Step-by-step checklist, training library, embedded agent |
| Recipe Reference Center | Baristas, shift leads | Searchable recipe catalog, seasonal highlights, embedded agent |
| Manager Portal | Store and regional managers | Shift management, performance tracking, reporting, embedded agent |

Page templates and SPFx web part definitions are in `sharepoint-pages/`. Permission configuration aligned to Azure AD security groups is in `sharepoint-pages/page-permissions.yaml`.

## Quick Start

1. Review `runbook.md` for SharePoint and Copilot Studio prerequisites.
2. Import `solution/solution-definition.yaml` into the target environment.
3. Validate knowledge sources and list bindings against your hub-associated libraries.
4. Publish to Teams and mobile web chat channels.
5. Deploy the SPFx solution package from `sharepoint-pages/spfx-web-parts.yaml` to the App Catalog.
6. Provision the four SharePoint pages using the templates in `sharepoint-pages/`.
7. Apply page and library permissions from `sharepoint-pages/page-permissions.yaml`.
