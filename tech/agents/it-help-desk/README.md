# IT Help Desk — Tech

A Copilot Studio agent that provides first-line IT support to employees across a technology organisation. It handles password resets, software troubleshooting, hardware request intake, and service-desk ticket creation — deflecting Level 1 tickets and freeing engineers for higher-value work.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | IT Help Desk |
| **Vertical** | Tech |
| **Primary Users** | All employees, IT support staff |
| **Channel** | Microsoft Teams, web chat |
| **Language** | English |

## Key Topics

- **Account & Access** — password reset, MFA setup, VPN access requests
- **Software Support** — installation guides, licence queries, version troubleshooting
- **Hardware Requests** — device procurement intake and approval workflow
- **Incident Logging** — automatic ticket creation in ServiceNow / Jira Service Management
- **Knowledge Base Search** — semantic search over internal KB articles

## Folder Structure

```
it-help-desk/
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
3. Connect the ticket-creation topic to your ITSM platform via Power Automate.
4. Upload your internal KB articles to the knowledge source configuration.
5. Publish the agent to Microsoft Teams.
