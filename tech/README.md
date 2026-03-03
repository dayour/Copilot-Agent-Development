# Tech

Showcase library of Copilot Studio agents for the Tech vertical. Each agent includes a runbook, conversation template, and solution definition file ready to import into your Power Platform environment.

## Agents

| Agent | Description |
|-------|-------------|
| [IT Help Desk](./agents/it-help-desk/) | First-line IT support covering password resets, software troubleshooting, hardware requests, ITSM ticket creation, and KB search |
| [Seller Prospect](./agents/seller-prospect/) | Sales pipeline management, lead qualification, CRM integration, and deal coaching |
| [Pipeline Analytics and Deal Coaching](./agents/pipeline-analytics/) | Pipeline visibility, deal health assessment, data-driven deal coaching, forecast roll-up, and win/loss analysis via Salesforce |
| [SupportBot](./agents/support-bot/) | Multi-agent orchestration primary support agent with WarrantyGuard handoff and generative AI routing |
| [Policy Advisor](./agents/policy-advisor/) | HR, Legal, and company policy knowledge retrieval with cited guidance, micro-stepping instructions, and ALM lifecycle |
| [Power Platform Advisor](./agents/power-platform-advisor/) | Power Platform guidance covering connectors, MCP flows, and platform best practices |

## Folder Structure

```
tech/
└── agents/
    ├── it-help-desk/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── seller-prospect/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── support-bot/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── policy-advisor/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    ├── pipeline-analytics/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    └── power-platform-advisor/
        ├── README.md
        ├── runbook.md
        ├── templates/
        │   └── agent-template.yaml
        └── solution/
            └── solution-definition.yaml
```
