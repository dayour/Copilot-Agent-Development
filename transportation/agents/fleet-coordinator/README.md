# Fleet Coordinator — Transportation

A Copilot Studio agent that assists fleet managers and drivers with vehicle scheduling, maintenance alerts, compliance checks, and incident reporting — improving fleet uptime and ensuring regulatory compliance across the transportation operation.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Fleet Coordinator |
| **Vertical** | Transportation |
| **Primary Users** | Fleet managers, drivers, logistics coordinators |
| **Channel** | Microsoft Teams, mobile web chat |
| **Language** | English |

## Key Topics

- **Vehicle Scheduling** — availability lookup and trip assignment
- **Maintenance Alerts** — proactive service reminders and defect reporting
- **Compliance Checks** — MOT/inspection due dates, driver licence verification
- **Incident Reporting** — structured accident/breakdown intake with photo upload
- **Route Guidance** — integration with mapping APIs for real-time routing advice

## Folder Structure

```
fleet-coordinator/
├── README.md               ← this file
├── runbook.md              ← deployment & operations runbook
├── templates/
│   └── agent-template.yaml ← Copilot Studio topic/conversation template
└── solution/
    └── solution-definition.yaml ← Copilot Studio solution export definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and deployment steps.
2. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
3. Connect vehicle-scheduling and maintenance topics to your fleet management system via Power Automate.
4. Customise compliance rules in `templates/agent-template.yaml` for your region.
5. Publish the agent to Microsoft Teams and the mobile web chat channel.
