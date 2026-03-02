# Copilot-Agent-Development
Copilot Agent Development Resources

A showcase library of complete **Copilot Studio agents** for multiple industry verticals. Each vertical contains production-ready agents with runbooks, conversation templates, and solution definition files that can be imported directly into a Microsoft Power Platform / Copilot Studio environment.

## Repository Structure

| Folder | Vertical | Showcase Agents |
|--------|----------|-----------------|
| [coffee/](./coffee/) | Coffee | [Virtual Coach](./coffee/agents/virtual-coach/) |
| [clothing/](./clothing/) | Clothing | [Power Analysis](./clothing/agents/power-analysis/) |
| [insurance/](./insurance/) | Insurance | [Claims Assistant](./insurance/agents/claims-assistant/) |
| [tech/](./tech/) | Tech | [IT Help Desk](./tech/agents/it-help-desk/), [Seller Prospect](./tech/agents/seller-prospect/), [SupportBot](./tech/agents/support-bot/), [Policy Advisor](./tech/agents/policy-advisor/), [Power Platform Advisor](./tech/agents/power-platform-advisor/) |
| [transportation/](./transportation/) | Transportation | [Fleet Coordinator](./transportation/agents/fleet-coordinator/), [Fuel Tracking](./transportation/agents/fuel-tracking/) |

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

## Documentation

Cross-cutting guides covering shared concerns across all verticals:

| Guide | Description |
|-------|-------------|
| [Connectors Reference](./docs/connectors.md) | All connector types, setup steps, auth patterns, rate limits, error handling |
| [Authentication Architecture](./docs/authentication.md) | Azure AD, Azure AD B2C, Salesforce SSO, service accounts, RLS pass-through |
| [Architecture and Flow Diagrams](./docs/architecture.md) | Mermaid diagrams for every agent conversation flow, data pipeline, and integration |
| [Extensibility Guide](./docs/extensibility.md) | Adding topics, custom connectors, knowledge sources, new verticals, adaptive cards |
| [Publishing Guide](./docs/publishing.md) | Channel deployment: Teams, web chat, mobile, Power Apps, external B2C channels |
| [Admin and Governance](./docs/admin-governance.md) | Licensing, DLP policies, analytics, GDPR, security hardening, audit logging |
| [Agent Lifecycle](./docs/agent-lifecycle.md) | Development, testing, staging, production, monitoring, updates, retirement |
| [Agent Configuration Guide](./docs/agent-config-guide.md) | End-to-end Copilot Studio agent creation: architecture layers, instructions design, knowledge sources, publishing, ALM lifecycle |

