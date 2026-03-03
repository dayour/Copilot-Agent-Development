# API Gateway — Tech

A Copilot Studio agent that guides operators and developers through the configuration, monitoring, and troubleshooting of the Azure API Management (APIM) gateway layer used to secure external web chat integrations with internal systems.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | API Gateway |
| **Vertical** | Tech |
| **Primary Users** | Platform engineers, security operators, API developers |
| **Channel** | Microsoft Teams, web chat |
| **Language** | English |

## Key Topics

- **APIM Configuration** — guides users through provisioning the APIM instance, importing API definitions, and setting up products and subscriptions
- **Rate Limiting Policies** — assists with configuring per-IP and per-session throttling policies to prevent abuse
- **Request Validation** — step-by-step schema validation setup for inbound requests before forwarding to Power Automate or Salesforce
- **API Key and Subscription Management** — walks through subscription key rotation, managed identity configuration for internal agents, and consumer onboarding
- **Logging and Monitoring** — connects APIM diagnostic settings to Log Analytics and surfaces Azure Monitor alert configuration
- **CORS Configuration** — helps restrict allowed origins to approved company website domains
- **WAF Integration** — guides Azure Front Door provisioning with WAF rules for DDoS protection on the public endpoint

## Folder Structure

```
api-gateway/
├── README.md               <- this file
├── runbook.md              <- deployment and operations runbook
├── templates/
│   └── agent-template.yaml <- Copilot Studio topic/conversation template
└── solution/
    └── solution-definition.yaml <- Power Platform solution export definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and deployment steps.
2. Import `solution/solution-definition.yaml` into your Copilot Studio environment.
3. Map the environment variables to your Azure subscription and APIM instance.
4. Connect the logging topic to your Log Analytics workspace via Power Automate.
5. Publish the agent to Microsoft Teams.
