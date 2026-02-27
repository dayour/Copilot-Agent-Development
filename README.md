# Copilot-Agent-Development
Copilot Agent Development Resources

A showcase library of complete **Copilot Studio agents** for multiple industry verticals. Each vertical contains production-ready agents with runbooks, conversation templates, and solution definition files that can be imported directly into a Microsoft Power Platform / Copilot Studio environment.

## Repository Structure

| Folder | Vertical | Showcase Agents |
|--------|----------|-----------------|
| [coffee/](./coffee/) | Coffee | [Virtual Coach](./coffee/agents/virtual-coach/) |
| [clothing/](./clothing/) | Clothing | [Virtual Coach](./clothing/agents/virtual-coach/) |
| [insurance/](./insurance/) | Insurance | [Claims Assistant](./insurance/agents/claims-assistant/) |
| [tech/](./tech/) | Tech | [IT Help Desk](./tech/agents/it-help-desk/) |
| [transportation/](./transportation/) | Transportation | [Fleet Coordinator](./transportation/agents/fleet-coordinator/) |

## Agent Scaffold

Every agent follows the same four-file scaffold:

```
<vertical>/agents/<agent-name>/
├── README.md                    ← agent overview, topics, and quick-start guide
├── runbook.md                   ← prerequisites, deployment steps, monitoring, rollback
├── templates/
│   └── agent-template.yaml      ← Copilot Studio topic & conversation template
└── solution/
    └── solution-definition.yaml ← Power Platform solution definition (import-ready)
```

## Getting Started

1. Browse to the vertical folder that matches your industry.
2. Open the agent folder and read the `README.md` for an overview.
3. Follow the `runbook.md` to set up your Copilot Studio environment.
4. Import `solution/solution-definition.yaml` and map the environment variables to your tenant.
5. Customise `templates/agent-template.yaml` with your organisation's content.
6. Publish the agent to Microsoft Teams or your preferred channel.

