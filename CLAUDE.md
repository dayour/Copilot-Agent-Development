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


## Coding Agent Coordination

This repository is configured for two coding agents:

### GitHub Copilot Coding Agent
- Triggered by assigning issues to `Copilot` or via the Agents tab.
- Configuration: `.github/copilot-instructions.md`
- Environment: `.github/workflows/copilot-setup-steps.yml`
- Custom agent: `.github/agents/copilot-studio-builder.md`
- Works autonomously on assigned issues, creates branches prefixed with `copilot/`, and opens PRs.

### Claude Code Agent
- Triggered by mentioning `@claude` in issues, comments, or PR reviews.
- Configuration: `CLAUDE.md` (this file) and `.github/workflows/claude.yml`
- Works on tasks when explicitly mentioned.

### Coordination Rules
- Both agents follow the same repository conventions and directory structure.
- Neither agent should merge its own PRs -- human review is required.
- If both agents are assigned to the same issue, Copilot takes the implementation lead and Claude handles review.
- All agent-generated PRs must pass YAML validation before merge.