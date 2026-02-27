# Virtual Coach — Clothing

A Copilot Studio agent that serves as a virtual coach for clothing retail employees. It supports staff with product knowledge, styling advice to pass on to customers, store policies, visual merchandising guidelines, and shift briefings — enabling a more confident and consistent in-store experience.

## Agent Details

| Field | Value |
|-------|-------|
| **Agent Name** | Virtual Coach |
| **Vertical** | Clothing |
| **Primary Users** | Sales associates, store managers, new hires |
| **Channel** | Microsoft Teams, web chat |
| **Language** | English |

## Key Topics

- **Product Knowledge** — fabric types, care instructions, size guides
- **Styling Tips** — outfit-pairing suggestions to help staff advise customers
- **Store Policies** — returns, exchanges, loyalty programme rules
- **Visual Merchandising** — planogram guidance and display standards
- **Shift Briefing** — daily targets, promotions, and task reminders

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
3. Customise topics using the files in `templates/` to reflect your product catalogue and brand voice.
4. Publish the agent to the Microsoft Teams channel.
