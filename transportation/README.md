# Transportation

Showcase library of Copilot Studio agents for the Transportation vertical. Each agent includes a runbook, conversation template, and solution definition file ready to import into your Power Platform environment.

## Agents

| Agent | Description |
|-------|-------------|
| [Fleet Coordinator](./agents/fleet-coordinator/) | Assists fleet managers and drivers with scheduling, maintenance alerts, compliance checks, incident reporting, and route guidance |
| [Fuel Tracking](./agents/fuel-tracking/) | Provides fuel spend analytics, anomaly detection, fuel card management, and route-aware fuel price recommendations |
| [Route Optimization Scheduler](./agents/route-optimizer/) | Automates multi-stop route planning, real-time ETA tracking, HOS compliance checks, and certification-aware driver assignment |

See [Cross-Agent Validation](./agents/cross-agent-validation.md) for integration test cases covering all three agents working together.

## Folder Structure

```
transportation/
└── agents/
    ├── cross-agent-validation.md
    ├── fleet-coordinator/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── fuel-tracking/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    └── route-optimizer/
        ├── README.md
        ├── runbook.md
        ├── templates/
        │   └── agent-template.yaml
        └── solution/
            └── solution-definition.yaml
```
