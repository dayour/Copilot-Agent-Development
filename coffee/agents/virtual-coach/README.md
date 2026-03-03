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
- **Shift Schedule** -> `shift-schedule-list` (query)
- **Shift Handover** -> `handover-log-list` (writeback)
- **Equipment Inventory** -> `equipment-inventory-list` (query)
- **Store Lookup** -> `store-contact-directory-list` (lookup)

## SharePoint List Schemas

| List | Columns |
|------|---------|
| Shift Schedule | Store, Date, Shift, Employee, Role, Status |
| Handover Log | Store, Date, FromEmployee, ToEmployee, CashBalanced, StockChecked, Issues, Timestamp |
| Equipment Inventory | Store, Item, SerialNumber, LastMaintenance, NextService, Status |
| Store Contact Directory | Store, Manager, RegionalDirector, Phone, Email |

## Folder Structure

```text
virtual-coach/
|-- README.md
|-- runbook.md
|-- CHANGELOG.md
|-- templates/
|   |-- agent-template.yaml
`-- solution/
    `-- solution-definition.yaml
```

## Quick Start

1. Review `runbook.md` for SharePoint and Copilot Studio prerequisites.
2. Import `solution/solution-definition.yaml` into the target environment.
3. Validate knowledge sources and list bindings against your hub-associated libraries.
4. Publish to Teams and mobile web chat channels.
