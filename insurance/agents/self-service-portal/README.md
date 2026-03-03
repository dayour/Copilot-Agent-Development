# Self-Service Portal — Insurance Customer Portal

The Self-Service Portal is a Microsoft Copilot Studio solution that extends the Claims Assistant to power a full customer self-service experience. Authenticated policyholders can check claim status, view and submit documents, review payment history, read plain-language policy summaries, and manage their communication preferences — all without calling the contact center.

## Solution Scope

| Field | Value |
|-------|-------|
| Agent Name | Self-Service Portal |
| Industry | Property and Casualty Insurance |
| Lines of Business | Auto, Property, Casualty |
| Primary Users | Policyholders (external, authenticated) |
| Target Outcomes | Contact-center call deflection, 24/7 self-service availability, increased digital engagement |
| Core Runtime | Microsoft Copilot Studio + Dataverse + Power Automate |
| Authentication | Azure AD B2C (mandatory for all portal interactions) |

## Portal Components

| Component | Description |
|-----------|-------------|
| Claim Status Portal | Policyholders check claim status, view attached documents, and message their assigned adjuster without calling |
| Document Upload Portal | Secure document submission with AI Builder OCR or Azure Document Intelligence to auto-extract data from police reports, medical bills, and repair estimates |
| Payment Status | Claim payment history, upcoming scheduled payments, and payment method on file |
| Policy Summary | Plain-language summary of policy terms, coverage limits, and deductibles specific to the authenticated customer |
| Communication Preferences | Customer-controlled notification settings for email, SMS, and Microsoft Teams |

## Agent vs Human Decision Boundary

| Portal Activity | Agent Ownership | Human Required | Notes |
|-----------------|----------------|----------------|-------|
| Claim status display | Yes | No | Read-only status from claims management API |
| Document upload and OCR extraction | Yes | No | Documents routed to claims record automatically |
| Payment history display | Yes | No | Read-only from payment gateway API |
| Payment method update | No | Yes | PCI-sensitive operation; agent captures intent and routes |
| Policy summary display | Yes | No | Generative summary from policy knowledge source |
| Communication preference update | Yes | No | Written to customer profile via Dataverse |
| Coverage decision questions | No | Yes | Escalated to claims handler |
| Adjuster messaging | Yes | Conditional | Secure messaging routed to assigned adjuster queue |

## Deployment Channel

Single channel: custom website embed secured with Azure AD B2C. All conversations require authentication before any claim, policy, or payment data is exposed.

## Core Integrations

- Claims management system API (Guidewire ClaimCenter or Duck Creek) for claim status and document retrieval
- AI Builder OCR or Azure Document Intelligence for police report, medical bill, and repair estimate extraction
- Payment gateway API for payment history and upcoming disbursements
- Policy administration system API for coverage limits and deductible data
- Dataverse customer profile for communication preference storage and retrieval
- Azure Communication Services for SMS and email notification dispatch

## Repository Structure

```text
self-service-portal/
├── README.md
├── runbook.md
├── CHANGELOG.md
├── templates/
│   └── agent-template.yaml
└── solution/
    └── solution-definition.yaml
```

## Quick Start

1. Complete all environment and integration prerequisites in `runbook.md`.
2. Import `solution/solution-definition.yaml` into the target Dataverse solution.
3. Configure environment variables for claims, payment, policy, and communication APIs.
4. Configure Azure AD B2C tenant, application registration, and user flows.
5. Embed the agent in the customer portal using the webchat embed code from Copilot Studio.
6. Validate all five portal component topics and OCR extraction before going live.
