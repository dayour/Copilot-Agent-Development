# Policy Advisor -- Browser Automation Runbook Index

> Complete MCP copilotbrowser command sequence to build and configure the Policy Advisor agent in Copilot Studio from scratch.

## Agent Summary

| Field | Value |
|---|---|
| Agent Name | Policy Advisor |
| Model | GPT-5 Chat |
| Environment | GenAIClippy (or target Copilot Studio environment) |
| Knowledge Sources | Company public website + SharePoint policy libraries |
| Channels | Teams, M365 Copilot, SharePoint |
| Solution | PolicyAdvisor v1.0.0.1 |

## Execution Order

Execute the runbook files in strict sequential order. Each file depends on the prior file completing successfully.

| File | Title | Description |
|---|---|---|
| 01-create-agent.md | Create Policy Advisor Agent | Navigate to Copilot Studio and create a new agent using the Agent tab |
| 02-configure-details.md | Configure Agent Details and Model | Set agent name, description, and verify GPT-5 Chat model selection |
| 03-set-instructions.md | Configure Agent Instructions | Apply the V1 micro-stepping instruction pattern (Purpose, Guidelines, Skills, Steps, Error Handling, Feedback) |
| 04-add-knowledge-sources.md | Add Knowledge Sources | Add public website and SharePoint policy libraries as knowledge sources |
| 05-knowledge-descriptions.md | Configure Knowledge Source Descriptions | Replace auto-generated descriptions with meaningful orchestrator-guidance text |
| 06-publishing-and-polishing.md | Publish and Polish the Agent | Complete the 10-item publishing checklist and enable channels |
| 07-alm-pipeline.md | Configure ALM and Solution Pipeline | Set up Dev/Sandbox/Prod deployment pipeline and managed solution export |
| 08-validation.md | Post-Build Validation | Validate the complete agent build with test queries and a PASS/FAIL checklist |

## Prerequisites

- Access to Copilot Studio with agent creation permissions
- Target environment provisioned (GenAIClippy or equivalent)
- SharePoint sites provisioned for HR and Legal policy libraries
- MCP copilotbrowser tools available in the agent runtime

## Notes

- All placeholder URLs use https://company.example.com and https://contoso.sharepoint.com
- Replace placeholder URLs with actual deployment targets before execution
- Each file is self-contained with prerequisites, steps, verification, and rollback sections
