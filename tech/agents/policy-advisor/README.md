# Policy Advisor -- Tech

A Copilot Studio agent that assists employees by providing accurate, policy-compliant guidance on HR, Legal, and other company policies. It searches across internal knowledge sources, interprets policy language, and delivers clear, actionable advice with verifiable citations.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Policy Advisor |
| **Vertical** | Tech |
| **Primary Users** | All employees, HR staff, Legal team |
| **Channels** | Microsoft Teams, M365 Copilot, SharePoint, web chat |
| **Language** | English |
| **Model** | GPT-5 Chat |

## Key Topics

- **HR Policy Guidance** -- employee handbook, code of conduct, compensation policies
- **Legal Compliance Queries** -- regulatory requirements, data privacy, corporate governance
- **Workplace Accommodations** -- accessibility, reasonable adjustments, ADA compliance
- **Remote Work Policies** -- eligibility, approval process, equipment provisions
- **Benefits and Leave Inquiries** -- PTO, FMLA, health insurance, retirement plans
- **Escalation to HR/Legal** -- handoff to human agents when policy interpretation requires expert review

## Folder Structure

```
policy-advisor/
+-- README.md               <- this file
+-- config-guide.md         <- full configuration guide (18-section reference)
+-- runbook.md              <- deployment and operations runbook
+-- templates/
|   +-- agent-template.yaml <- Copilot Studio topic/conversation template
+-- solution/
    +-- solution-definition.yaml <- Power Platform solution definition
```

## Quick Start

1. Review `config-guide.md` for the full agent architecture and configuration reference.
2. Review `runbook.md` for prerequisites and deployment steps.
3. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
4. Configure knowledge sources: connect SharePoint policy libraries and the company website.
5. Customize topics in `templates/agent-template.yaml` to match your organization's policy structure.
6. Publish the agent to Microsoft Teams, M365 Copilot, and SharePoint.
