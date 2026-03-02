# Seller Prospect Agent (Tech)

## Overview
Seller Prospect is a Copilot Studio agent solution for enterprise sales organizations using Salesforce CRM. It is designed for a large technology company with 2,000+ sales users and supports both internal sales execution and external prospect engagement.

- Agent Name: Seller Prospect
- Vertical: Tech
- Primary Users:
  - Account Executives
  - Sales Development Representatives (SDRs)
  - Sales Managers
  - Website Prospects

## Business Goals
1. Enable internal reps to manage pipeline and receive deal coaching in Microsoft Teams.
2. Qualify inbound website prospects in external web chat using BANT.
3. Create and update Salesforce CRM records automatically through Power Automate + Salesforce connector.

## Channel Strategy

### Internal Channel: Microsoft Teams
- Audience: AEs, SDRs, Sales Managers
- Auth: Microsoft Entra ID (Azure AD)
- Data Access: Full CRM-connected workflows, internal knowledge, deal coaching context
- Use Cases:
  - Opportunity lookup
  - Pipeline summary
  - Deal health risk detection
  - Meeting scheduling assistance

### External Channel: Web Chat
- Audience: Website prospects
- Auth: Azure AD B2C (progressive anonymous-to-authenticated journey)
- Data Access: Public-safe product and case-study knowledge only
- Use Cases:
  - Product Q and A
  - Pricing guidance boundaries
  - Lead intake and qualification
  - Escalation to live sales queue

## Key Topics
1. Lead Qualification (BANT)
2. Opportunity Lookup
3. Pipeline Summary
4. Deal Health Check
5. Meeting Scheduler
6. Prospect Chat (external-facing)
7. Competitive Intelligence
8. Escalation

## Integration Architecture Summary
- Copilot Studio orchestrates conversation, topics, tools, and channels.
- Power Automate flows execute Salesforce actions via prebuilt Salesforce connector.
- Microsoft Graph integration supports calendar-based scheduling.
- Knowledge split:
  - Public product library (external-safe)
  - Internal competitive intelligence library (internal-only)

## Folder Structure

```text
tech/agents/seller-prospect/
  README.md
  runbook.md
  templates/
    agent-template.yaml
  solution/
    solution-definition.yaml
```

## Design Notes
- Salesforce connector latency target: 2 to 6 seconds per action.
- BANT scoring should be stored in Dataverse for analytics and routing.
- External responses must enforce public-safe content boundaries.
- Internal and external topic behaviors must branch by channel and auth context.
