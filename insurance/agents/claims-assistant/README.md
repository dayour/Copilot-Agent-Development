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

```text
claims-assistant/
├── README.md
├── runbook.md
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```

## Quick Start

1. Complete environment and integration prerequisites in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Dataverse solution.
3. Configure environment variables, connections, and state compliance rules.
4. Validate FNOL, compliance, fraud, and escalation scenarios.
5. Publish to the external web portal and internal Teams channel.
