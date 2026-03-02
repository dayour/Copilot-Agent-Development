# CLAUDE.md - Project Guidelines for Claude Code

## Project Overview
This is the Copilot Agent Development repository containing agent solution templates across multiple industry verticals (clothing, coffee, insurance, tech, transportation).

## Code Standards
- Follow existing file structure conventions (agents/ subfolder per vertical with solution/ and templates/ directories)
- YAML files should use 2-space indentation
- Markdown files should use proper heading hierarchy
- All agent definitions must include a README.md and runbook.md

## Review Guidelines
- Verify YAML syntax is valid before approving changes
- Ensure new agents follow the established directory pattern
- Check that solution-definition.yaml and agent-template.yaml are present for new agents
- Documentation should be clear and actionable

## Repository Structure
```
├── clothing/agents/       # Clothing industry agents
├── coffee/agents/         # Coffee industry agents
├── docs/                  # Documentation
├── insurance/agents/      # Insurance industry agents
├── tech/agents/           # Tech industry agents
└── transportation/agents/ # Transportation industry agents
```
