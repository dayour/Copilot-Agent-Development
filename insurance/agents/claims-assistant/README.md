# Claims Assistant — Insurance

A Copilot Studio agent that guides customers and claims handlers through the entire insurance claims lifecycle. It collects incident details, explains coverage, tracks claim status, and escalates complex cases to human agents — reducing call-centre volume and improving claimant satisfaction.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Claims Assistant |
| **Vertical** | Insurance |
| **Primary Users** | Policyholders, claims handlers, brokers |
| **Channel** | Web chat, Microsoft Teams, telephony (voice) |
| **Language** | English |

## Key Topics

- **First Notice of Loss (FNOL)** — structured incident intake and evidence collection
- **Coverage Q&A** — policy terms explained in plain language
- **Claim Status** — real-time status updates via back-end API connector
- **Document Submission** — guided document upload and checklist
- **Escalation** — smart handoff to human claims handler with full context

## Folder Structure

```
claims-assistant/
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
3. Connect the claims-status topic to your policy management system via Power Automate.
4. Customise escalation routing in `templates/agent-template.yaml`.
5. Publish the agent to your preferred customer channel.
