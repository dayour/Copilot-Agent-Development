# Knowledge Base — Tech

A Copilot Studio specialist agent that answers employee questions by performing semantic search over internal SharePoint documentation, policies, and FAQs. Deployed as a backend for the A365 Orchestrator and usable as a standalone channel in Microsoft Teams.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Knowledge Base |
| **Vertical** | Tech |
| **Primary Users** | All employees |
| **Channel** | Microsoft Teams, A365 Orchestrator |
| **Language** | English |

## Key Topics

- **Policy Search** — find HR, IT, and compliance policies from SharePoint
- **How-To Guides** — step-by-step instructions for common tasks (VPN, MFA, expenses)
- **FAQ** — instant answers to frequently asked questions
- **Document Retrieval** — surface the most relevant internal documents for a query
- **Escalation** — escalate unanswered questions to the appropriate team or subject-matter expert

## Folder Structure

```
knowledge-base/
├── README.md               <- this file
├── runbook.md              <- deployment and operations runbook
├── templates/
│   └── agent-template.yaml <- Copilot Studio topic and conversation template
└── solution/
    └── solution-definition.yaml <- Power Platform solution export definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and deployment steps.
2. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
3. Add your SharePoint document libraries as knowledge sources.
4. Run a manual knowledge sync and verify topic coverage.
5. Publish the agent to Microsoft Teams, or connect it to the A365 Orchestrator.

## Related Agents

- [A365 Orchestrator](../a365-orchestrator/README.md) — routes requests to this agent
- [IT Help Desk](../it-help-desk/README.md) — handles technical support requests
- [MAD Scheduler / Calendar Manager](../mad-scheduler/README.md) — handles scheduling
