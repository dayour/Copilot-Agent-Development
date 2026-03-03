# Prospect Web Chat Agent (Tech)

## Overview

Prospect Web Chat is a Copilot Studio agent for the Tech vertical that provides an external-facing web chat channel for inbound prospect engagement. It supports anonymous entry with a progressive authentication journey, a pre-chat intake form, product and pricing guidance, meeting scheduling with an authentication gate, live agent handoff, rate limiting, and GDPR compliance flows.

- Agent Name: Prospect Web Chat
- Vertical: Tech
- Primary Users: Website prospects (anonymous and authenticated)
- Channel: External custom website (web chat embed)

## Business Goals

1. Engage inbound website visitors and capture qualified leads before they bounce.
2. Progressively move prospects from anonymous to authenticated by prompting registration only at natural commitment points (scheduling a meeting, accessing gated content).
3. Route qualified prospects to the appropriate live sales representative via Dynamics 365 Omnichannel or a Microsoft Teams queue.
4. Meet GDPR and regional privacy requirements through cookie consent, a data processing notice at session start, and a right-to-erasure self-service flow.

## Channel Configuration

### External Channel: Custom Website Web Chat

| Field | Value |
|---|---|
| Channel type | Custom website (Copilot Studio embed) |
| Audience | Unauthenticated and authenticated website prospects |
| Authentication | Azure AD B2C with LinkedIn and Google social identity providers |
| Anonymous entry | Allowed; registration prompted only at commitment points |
| Allowed domains | Configured via `ProspectWebsiteDomain` environment variable |
| Branding | Company logo, primary brand color, and welcome message configurable |
| Escalation path | Dynamics 365 Omnichannel or Microsoft Teams sales queue |

## Key Topics

1. GDPR Consent and Privacy Notice -- presents cookie consent and data processing notice; gates data collection on acceptance
2. Pre-Chat Intake Form -- collects company name, role, and interest area to route the prospect to the correct topic
3. Prospect Welcome -- channel-aware greeting with quick-reply shortcuts
4. Product and Pricing Guidance -- public-safe generative answers over the product knowledge source
5. Anonymous Mode Guard -- checks authentication state; for anonymous users, responds freely up to the commitment gate
6. Meeting Schedule Request -- prompts Azure AD B2C sign-in before confirming meeting booking; invokes scheduling flow post-authentication
7. Live Agent Handoff -- escalates conversation with full context to the sales live agent queue
8. Right to Erasure -- allows a prospect to submit a data deletion request and confirms acknowledgement

## Integration Architecture Summary

- Copilot Studio hosts the external web chat channel with a generated embed script.
- Azure AD B2C handles prospect self-registration and social login (LinkedIn, Google) with progressive profiling.
- Power Automate flows handle lead creation in Dynamics 365 or Salesforce, meeting scheduling via Microsoft Graph, live agent handoff to Dynamics 365 Omnichannel or Teams, and erasure request logging.
- Rate limiting is enforced at the Azure API Management or Azure Front Door layer using per-IP throttling rules.
- Dataverse stores prospect interactions, consent records, and erasure requests.

## Folder Structure

```text
tech/agents/prospect-webchat/
  README.md
  runbook.md
  templates/
    agent-template.yaml
  solution/
    solution-definition.yaml
```

## Design Notes

- Only public-safe knowledge sources are queryable from this channel. Internal competitive content is blocked.
- The GDPR consent topic fires at session start before any data is collected or stored.
- Anonymous conversations are permitted for product Q&A and general inquiry; personal data is not persisted until consent is given.
- Rate limiting targets: maximum 10 messages per minute per session; maximum 100 sessions per hour per IP address.
- Embed script origin restriction must match `ProspectWebsiteDomain` exactly to prevent hotlinking.
