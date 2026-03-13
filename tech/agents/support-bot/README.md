# SupportBot — Tech

A Copilot Studio multi-agent orchestration primary support agent for the Tech vertical. SupportBot serves as the front-door for customer and staff support inquiries, routing general requests through generative AI (GPT-4o), handing off warranty issues to the WarrantyGuard agent, and escalating complex cases to human agents.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | SupportBot |
| **Vertical** | Tech (cross-cutting support) |
| **Primary Users** | Customers, support staff |
| **Channels** | Web chat, Microsoft Teams |
| **Language** | English |
| **Environment** | DYdev26 |
| **Orchestration** | Generative AI (GPT-4o) |

## Key Topics

- **General Support** — first-line inquiry handling via generative AI orchestration
- **Warranty Handoff** — routes warranty-related issues to the WarrantyGuard agent via connected agents
- **Complex Case Escalation** — transfers unresolved or high-severity cases to a human agent
- **Multi-Agent Collaboration** — orchestrates across connected agents and skills for specialised handling
- **FAQ and Knowledge Base Search** — semantic search over configured knowledge sources
- **Feedback Collection** — captures customer satisfaction and session feedback

## Folder Structure

```
support-bot/
├── README.md                        <- this file
├── settings-sitemap.md              <- Copilot Studio settings reference and configuration map
├── runbook.md                       <- deployment and operations runbook
├── templates/
│   └── agent-template.yaml          <- Copilot Studio topic/conversation template
└── solution/
    └── solution-definition.yaml     <- Power Platform solution export definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and deployment steps.
2. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
3. Configure multi-agent orchestration: enable connected agents, add WarrantyGuard as a skill, and update the security allowlist.
4. Connect knowledge sources and Power Automate flows per the runbook.
5. Publish the agent to Microsoft Teams and web chat channels.
6. Refer to `settings-sitemap.md` for detailed Copilot Studio configuration reference.
