# Copilot Coding Agent Instructions

## Project Context

This repository contains production-ready Copilot Studio agent templates across five industry verticals: Coffee, Clothing, Insurance, Tech, and Transportation. Each vertical has agents with solution definitions, conversation templates, and deployment runbooks.

## Repository Structure

```
<vertical>/agents/<agent-name>/
  README.md                    -- agent overview, topics, quick-start
  runbook.md                   -- prerequisites, deployment, monitoring
  templates/agent-template.yaml -- Copilot Studio topic/conversation template
  solution/solution-definition.yaml -- Power Platform solution (import-ready)
```

Verticals: coffee, clothing, insurance, tech, transportation.
Cross-cutting docs: docs/ (connectors, auth, architecture, extensibility, publishing, admin, lifecycle).

## Code Standards

1. YAML files: 2-space indentation, valid syntax required.
2. Markdown: proper heading hierarchy (h1 for title, h2 for sections, h3 for subsections).
3. Every new agent MUST include: README.md, runbook.md, templates/agent-template.yaml, solution/solution-definition.yaml.
4. No emoji characters in any output. Use plain text, proper punctuation, and clear language.
5. Tables use GitHub Flavored Markdown pipe syntax with header separators.
6. File names use kebab-case (lowercase, hyphens).

## Agent Template Conventions

- solution-definition.yaml must include: schemaVersion, solutionName, publisher, components array, environmentVariables.
- agent-template.yaml must include: agentName, description, topics array (each with name, triggerPhrases, nodes).
- Trigger phrases: minimum 4 per topic for reliable routing.
- Topic descriptions are the PRIMARY routing signal in generative orchestration mode.

## When Working on Issues

- Issues are tagged by vertical: [Coffee], [Clothing], [Insurance], [Tech], [Transportation].
- Respect the existing directory structure. New agents go under <vertical>/agents/<agent-name>/.
- Follow the four-file scaffold pattern for every new agent.
- Reference the docs/ guides for connector patterns, auth architecture, and publishing steps.
- Validate YAML syntax before committing.

## Copilot Studio Platform Rules

- Agent instructions use a three-part structure: constraints, response format, guidance.
- Agent-level instructions: 8,000 character limit.
- Topic descriptions are more important than instructions for routing accuracy.
- Knowledge sources are searched via Conversational Boosting (fallback/OnUnknownIntent).
- Maximum 128 topics/actions per agent in generative orchestration mode.
- Performance degrades beyond 30-40 choices; split into connected agents if needed.

## Testing and Validation

- Every agent must have validation criteria in its runbook.
- Test cases should cover: happy path, boundary conditions, escalation, fallback.
- Authentication must be verified per channel (Teams, Web Chat, etc.).

## Prohibited

- Emoji characters in any file.
- Committing secrets or credentials.
- Modifying agents in other verticals when working on a vertical-specific issue.
- Skipping YAML validation.