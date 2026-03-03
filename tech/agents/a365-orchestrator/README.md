# A365 Orchestrator — Tech

A reference implementation demonstrating the M365 Agents SDK pattern, where a Teams AI orchestrator agent routes conversations to specialist Copilot Studio agents and aggregates their responses with adaptive cards.

## Architecture

```
User (Teams) -> A365 Orchestrator (M365 Agents SDK, TypeScript)
                   |
                   +-> IT Help Desk (Copilot Studio)
                   |
                   +-> Calendar Manager (Copilot Studio / mad-scheduler)
                   |
                   +-> Knowledge Base (Copilot Studio)
```

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | A365 Orchestrator |
| **Vertical** | Tech |
| **Primary Users** | All employees |
| **Channel** | Microsoft Teams |
| **Language** | English |
| **Runtime** | Node.js 20, M365 Agents SDK |

## Key Capabilities

- **Intent routing** — classifies every user message and forwards it to the correct specialist agent
- **IT Help Desk** — password resets, software support, hardware requests, ITSM ticket creation
- **Calendar Manager** — meeting scheduling, availability queries, calendar management
- **Knowledge Base** — semantic search over SharePoint-hosted internal documentation
- **Adaptive cards** — structured response rendering for tickets, events, and KB results
- **Conversation state** — maintains context across turns so specialist agents receive full history
- **Application Insights** — telemetry for all routing decisions and backend call durations

## Folder Structure

```
a365-orchestrator/
├── README.md                         <- this file
├── runbook.md                        <- deployment and operations runbook
├── package.json                      <- Node.js project manifest
├── tsconfig.json                     <- TypeScript compiler config
├── tsup.config.js                    <- build bundler config
├── teamsapp.yml                      <- M365 Agents Toolkit provisioning lifecycle
├── aad.manifest.json                 <- Entra ID app registration manifest
├── .env                              <- local environment variables (not committed)
├── src/
│   ├── index.ts                      <- app entry point; starts HTTP server
│   ├── router.ts                     <- intent classifier and agent dispatcher
│   ├── adapters/
│   │   ├── it-help-desk.ts           <- IT Help Desk Copilot Studio client
│   │   ├── calendar-manager.ts       <- Calendar Manager Copilot Studio client
│   │   └── knowledge-base.ts         <- Knowledge Base Copilot Studio client
│   └── cards/
│       └── index.ts                  <- adaptive card builders
├── infra/
│   ├── azure.bicep                   <- App Service, Key Vault, App Insights
│   ├── azure.parameters.json         <- ARM parameter file
│   └── botRegistration/
│       └── azurebot.bicep            <- Bot Framework / Teams channel registration
├── appPackage/
│   └── manifest.json                 <- Teams app manifest
├── env/
│   └── .env.testtool                 <- Teams App Test Tool environment
├── tests/
│   └── router.test.ts                <- integration tests for the router module
├── templates/
│   └── agent-template.yaml           <- Copilot Studio routing agent template
└── solution/
    └── solution-definition.yaml      <- Power Platform solution definition
```

## Quick Start

1. Review `runbook.md` for prerequisites and full deployment steps.
2. Copy `.env.example` to `.env` and fill in all required values.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build and run locally:
   ```bash
   npm run build
   npm start
   ```
5. Open the DevTools interface at `http://localhost:3979/devtools` to test routing.
6. Deploy to Azure using the M365 Agents Toolkit:
   ```bash
   teamsfx provision --env dev
   teamsfx deploy --env dev
   ```

## Specialist Agents

| Agent | Schema Name | Purpose |
|-------|-------------|---------|
| IT Help Desk | `cr123_itHelpDesk` | Password resets, incidents, hardware requests |
| Calendar Manager | `dystudio_calendarManager` | Meeting scheduling and calendar queries |
| Knowledge Base | `cr123_knowledgeBase` | Internal document and FAQ search |

## Related Agents

- [IT Help Desk](../it-help-desk/README.md)
- [MAD Scheduler / Calendar Manager](../mad-scheduler/README.md)
- [Knowledge Base](../knowledge-base/README.md)
