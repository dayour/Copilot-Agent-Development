# Insurance

Showcase library of Copilot Studio agents for the Insurance vertical. Each agent includes a runbook, conversation template, and solution definition file ready to import into your Power Platform environment.

## Agents

| Agent | Description |
|-------|-------------|
| [Claims Assistant](./agents/claims-assistant/) | Guides customers and handlers through FNOL, coverage Q&A, claim status, document submission, and escalation |
| [CAT Event Processor](./agents/cat-event-processor/) | Bulk claims processing for catastrophe events including CAT declaration, streamlined FNOL intake, automated triage, real-time dashboard, and proactive policyholder outreach |

## Folder Structure

```
insurance/
└── agents/
    ├── claims-assistant/
    │   ├── README.md
    │   ├── runbook.md
    │   ├── templates/
    │   │   └── agent-template.yaml
    │   └── solution/
    │       └── solution-definition.yaml
    └── cat-event-processor/
        ├── README.md
        ├── runbook.md
        ├── templates/
        │   └── agent-template.yaml
        └── solution/
            └── solution-definition.yaml
```
