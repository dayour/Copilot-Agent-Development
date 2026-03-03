# Claims Assistant — Enterprise P&C Carrier

The Claims Assistant is a Microsoft Copilot Studio solution for a large multi-line Property and Casualty carrier operating at enterprise scale (3M+ policies in force and 500K+ annual claims). The agent is designed to handle full digital intake while preserving strict regulatory and operational boundaries for human adjusters.

## Solution Scope

| Field | Value |
|-------|-------|
| Agent Name | Claims Assistant |
| Industry | Property and Casualty Insurance |
| Lines of Business | Auto, Property, Casualty |
| Primary Users | Policyholders (external), Claims handlers and supervisors (internal) |
| Target Outcomes | 40 percent call-center deflection, faster FNOL capture, compliant state-by-state handling |
| Core Runtime | Microsoft Copilot Studio + Dataverse + Power Automate |

## Agent vs Human Decision Boundary

| Claims Activity | Agent Ownership | Human Adjuster Required | Notes |
|-----------------|----------------|-------------------------|-------|
| First Notice of Loss (FNOL) digital intake | Yes | No | Full structured intake with line-specific fields |
| Policy lookup and eligibility check | Yes | No | Real-time policy and coverage checks |
| Claim number generation | Yes | No | Generated via claims management API |
| Document upload prompting and status tracking | Yes | No | Includes OCR extraction for intake acceleration |
| Automated assignment for low-complexity claims | Yes | Conditional | Uses workload/capacity rules; supervisor override allowed |
| Payment status communication | Yes | No | Communicates status only; does not authorize payment decisions |
| Coverage denial letter generation | No | Yes | Regulatory and legal control point |
| Bodily injury valuation | No | Yes | Requires licensed adjuster decisioning |
| Liability decisions with disputed facts | No | Yes | Must be handled by adjuster/investigator |
| Recorded statements | No | Yes | Human-led process |
| Claims with attorney representation | No | Yes | Immediate escalation with full context |

## Regulatory Compliance Engine

This solution includes a state-driven compliance engine backed by Dataverse rules. It applies jurisdiction-specific timing and disclosure logic (for example, acknowledgment and payment timelines), enforces required fraud warning statements, and exposes SLA risk indicators for handler action.

## Deployment Channels

1. External policyholder channel: Azure AD B2C authenticated web portal.
2. Internal handler channel: Microsoft Teams (Azure AD internal identity).

## Core Integrations

- Claims management system API (Guidewire ClaimCenter or Duck Creek)
- Document management storage for evidence and correspondence
- Payment system API for claim disbursement status
- Optional valuation enrichment (CCC ONE or Mitchell)
- AI Builder OCR for extraction from police reports and repair estimates

## Repository Structure

This project uses the **Copilot Studio code-first format** compatible with the
[VS Code extension](https://learn.microsoft.com/microsoft-copilot-studio/visual-studio-code-extension-overview).

```text
claims-assistant/
├── agent.mcs.yml                          # Agent definition (auth, recognizer, AI settings)
├── settings.mcs.yml                       # Instructions, persona, conversation starters
├── README.md
├── CHANGELOG.md
├── runbook.md
├── topics/
│   ├── greeting.mcs.yml                   # Welcome and routing
│   ├── fnol.mcs.yml                       # First notice of loss intake
│   ├── claim-status.mcs.yml              # Claim status lookup
│   ├── document-submission.mcs.yml       # Document upload
│   ├── escalate.mcs.yml                  # Handoff to human handler
│   └── fallback.mcs.yml                  # Unrecognized input handling
├── actions/
│   ├── create-claim-flow.mcs.yml         # Power Automate: create claim
│   ├── get-claim-status-flow.mcs.yml     # Power Automate: get status
│   └── calculate-fraud-score.mcs.yml     # Power Automate: fraud scoring
├── knowledge/
│   ├── claims-policy-site.mcs.yml        # SharePoint policy documents
│   └── claims-faq-site.mcs.yml           # Public FAQ site
└── deployment/
    └── deployment-settings.json           # Environment variables and connection refs
```

## Quick Start

1. Complete environment and integration prerequisites in `runbook.md`.
2. Open the project in VS Code with the Copilot Studio extension installed.
3. Clone or sync the agent to your target Copilot Studio environment.
4. Update `deployment/deployment-settings.json` with environment-specific values.
5. Replace placeholder flow GUIDs in topic and action files with actual Power Automate flow IDs.
6. Configure authentication (Azure AD B2C for external, Azure AD for internal) in Copilot Studio settings.
7. Validate FNOL, status, document, and escalation scenarios.
8. Publish to the external web portal and internal Teams channel.

## Key References

- [Copilot Studio VS Code extension](https://learn.microsoft.com/microsoft-copilot-studio/visual-studio-code-extension-overview)
- [Topic authoring](https://learn.microsoft.com/microsoft-copilot-studio/authoring-create-edit-topics)
- [Agent flows (Power Automate)](https://learn.microsoft.com/microsoft-copilot-studio/advanced-flow-create)
- [Generative orchestration](https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions)
- [Knowledge sources](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio)
- [Solutions and ALM](https://learn.microsoft.com/microsoft-copilot-studio/authoring-solutions-overview)
