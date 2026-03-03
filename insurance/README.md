# Insurance

Showcase library of Copilot Studio agents for the Insurance vertical. Each agent includes a runbook, conversation template, and solution definition file ready to import into your Power Platform environment.

## Agents

| Agent | Description |
|-------|-------------|
| [Claims Assistant](./agents/claims-assistant/) | Guides customers and handlers through FNOL, coverage Q&A, claim status, document submission, and escalation |
| [Self-Service Portal](./agents/self-service-portal/) | Authenticated customer portal for claim status, document upload with OCR, payment history, policy summary, and communication preferences |

## Folder Structure

```
insurance/
└── agents/
    ├── claims-assistant/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── CHANGELOG.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    └── self-service-portal/
        ├── README.md
        ├── runbook.md
        ├── CHANGELOG.md
        ├── templates/
        │   └── agent-template.yaml
        └── solution/
            └── solution-definition.yaml
```
