# Virtual Coach — Coffee

A Copilot Studio agent that acts as an always-available virtual coach for coffee shop employees. It helps staff with onboarding, policy questions, drink preparation guides, shift handover notes, and performance tips — reducing manager workload and improving employee confidence.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Virtual Coach |
| **Vertical** | Coffee |
| **Primary Users** | Baristas, shift supervisors, new hires |
| **Channel** | Microsoft Teams, web chat |
| **Language** | English |

## Key Topics

- **Onboarding & Training** — step-by-step guides for new employees
- **Drink Recipes** — preparation instructions for all menu items
- **HR & Policy Q&A** — answers to leave, dress-code, and conduct questions
- **Shift Handover** — structured handover checklist assistant
- **Performance Tips** — coaching prompts and motivational nudges

## Folder Structure

```
virtual-coach/
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
3. Customise topics using the files in `templates/` to match your shop's branding and menu.
4. Publish the agent to the Microsoft Teams channel.
