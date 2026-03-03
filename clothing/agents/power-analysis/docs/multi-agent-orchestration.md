# Multi-Agent Orchestration — Power Analysis Agent

This document describes the three multi-agent orchestration patterns implemented
in the Power Analysis agent for the Clothing vertical.

---

## Overview

Multi-agent orchestration enables the Power Analysis agent to answer complex
business questions by coordinating specialized sub-agents or sequencing
analytical stages. Each orchestration run is tracked in the
`AgentOrchestrationSessions` Dataverse table, providing a full audit trail
and enabling analytics on agent interaction quality.

Three patterns are supported:

| Pattern | Use Case | Entry Topic |
|---------|----------|-------------|
| Hub-and-Spoke | Broad analytical questions requiring multiple perspectives at once | Hub Routing |
| Pipeline | Complex multi-stage workflows such as the weekly business review | Weekly Business Review |
| Consensus | Balanced recommendations requiring synthesis of multiple viewpoints | Markdown Recommendation |

---

## Hub-and-Spoke Pattern

### Design

Power Analysis acts as the central hub and dispatches requests to four
specialized spoke topics. Each spoke queries its own domain of the Power BI
semantic model and records its result to the shared orchestration session.
The Hub and Spoke Synthesis topic then combines all spoke results into a
unified response.

```
User Request
    |
    v
Hub Routing (creates session, sets context variables)
    |
    +----> Sales Analyst Spoke
    +----> Inventory Analyst Spoke
    +----> Customer Analyst Spoke
    +----> Operations Analyst Spoke
    |
    v
Hub and Spoke Synthesis (aggregates and narrates)
    |
    v
User Response
```

### Spokes

| Spoke Topic | Domain | Key Metrics |
|-------------|--------|-------------|
| Sales Analyst Spoke | Revenue and target performance | Net sales, comparable-store growth, sell-through rate, category contribution |
| Inventory Analyst Spoke | Stock management | Units on hand, weeks of cover, reorder recommendations, overstock SKUs |
| Customer Analyst Spoke | Customer behaviour | Segment mix, loyalty redemption rate, average basket size, transaction frequency |
| Operations Analyst Spoke | Store operations | Labour efficiency, shrinkage rate, conversion rate, transactions per hour |

### Context Handoff

The Hub Routing topic sets the following global variables before dispatching to spokes:

- `Orchestration.SessionId` -- unique session identifier from `AgentOrchestrationSessions`
- `Orchestration.Pattern` -- set to `hub_and_spoke`
- `Analysis.Store` -- store or region scope
- `Analysis.Period` -- analysis period
- `Analysis.Question` -- the original user question

Each spoke appends its result to `Orchestration.SpokeResults` using a
pipe-delimited format: `spoke_name:summary_text`.

### Timeout and Fallback

- Each spoke flow is bounded by the `OrchestratorTimeoutSeconds` environment variable (default 30 seconds).
- If a spoke times out or fails, it appends `unavailable(SpokeFallbackMessage)` to `Orchestration.SpokeResults`.
- The synthesis topic proceeds with any available spoke results.

### Session Logging

Each spoke and the synthesis topic call `OrchestrationSessionUpdate` to record:

- Spoke name
- Result summary
- Status (completed, failed, timed_out)

The hub synthesis records the `FinalResult` and marks the session as `completed`.

---

## Pipeline Pattern

### Design

For the weekly business review, the agent chains four sequential stages.
Each stage receives a structured JSON payload from the previous stage via
`Orchestration.BusinessReviewPayload` and enriches it before passing it on.

```
User Request ("Prepare my weekly business review")
    |
    v
Weekly Business Review (creates session, validates inputs)
    |
    v
Stage 1: Business Review - Data Collection
    |     Queries all KPI scopes from Dataverse and Power BI
    v
Stage 2: Business Review - Insight Generation
    |     Identifies anomalies, trends, and notable changes
    v
Stage 3: Business Review - Narrative Construction
    |     Builds executive summary and callout sections
    v
Stage 4: Business Review - Delivery
          Posts to Teams or generates PowerPoint via Graph API
    |
    v
User Confirmation
```

### Payload Structure

Each stage enriches the `Orchestration.BusinessReviewPayload` variable:

| After Stage | Payload Contents |
|-------------|-----------------|
| Data Collection | Raw KPIs: sales summary, inventory summary, labour summary, customer summary |
| Insight Generation | KPIs + insights JSON (ranked anomalies and trends) |
| Narrative Construction | KPIs + insights + narrative JSON (formatted sections) |
| Delivery | Full payload + delivery reference |

### Partial Failure Handling

| Stage | Failure Behaviour |
|-------|------------------|
| Data Collection | Pipeline halts. Reports error to user with session ID for retry. |
| Insight Generation | Pipeline continues to narrative with available data. Logs failure to session. |
| Narrative Construction | Always completes; uses available payload. No fallback needed. |
| Delivery | Reports delivery error to user. Narrative is preserved in session for retry. |

### Delivery Formats

| Format | Mechanism |
|--------|-----------|
| teams | Posts adaptive card to `BusinessReviewTeamsChannelId` |
| powerpoint | Generates deck from `BusinessReviewPowerPointTemplateId` via Microsoft Graph API |
| email | Sends formatted email to the specified recipients |

---

## Consensus Pattern

### Design

For markdown or promotional decisions, the agent queries five analytical
perspectives and synthesizes a balanced recommendation with a confidence level.

```
User Request ("Should we markdown this category?")
    |
    v
Markdown Recommendation (creates session, collects inputs)
    |
    +----> Consensus - Sales Velocity
    +----> Consensus - Inventory Position
    +----> Consensus - Margin Analysis
    +----> Consensus - Competitive Intelligence
    +----> Consensus - Historical Precedent
    |
    v
Consensus - Recommendation Synthesis
    |
    v
Recommendation with Confidence Level
```

### Perspectives

| Perspective Topic | Signal Output | Supports Markdown When |
|-------------------|--------------|------------------------|
| Consensus - Sales Velocity | sell_fast / sell_slow | sell_slow |
| Consensus - Inventory Position | high_cover / low_cover | high_cover |
| Consensus - Margin Analysis | margin_healthy / margin_at_risk | margin_at_risk (if cover is also high) |
| Consensus - Competitive Intelligence | competitive_pressure / no_pressure | competitive_pressure |
| Consensus - Historical Precedent | precedent_supports / precedent_cautions | precedent_supports |

### Confidence Levels

The synthesis topic uses the following heuristic to assign a confidence level:

| Signals Supporting Markdown | Confidence Level |
|-----------------------------|-----------------|
| 4 or 5 | high |
| 3 | medium |
| 0, 1, or 2 | low |

The recommendation output includes:

- A clear recommendation: proceed with markdown / hold / consider partial markdown
- The confidence level (high, medium, or low)
- Per-perspective signals
- Supporting evidence from each perspective

### Competitive Intelligence Fallback

If the competitive intelligence perspective is unavailable (no market data
configured), its signal is set to `unknown` and excluded from the confidence
calculation. The synthesis prompt is instructed to note this caveat in the
recommendation.

---

## Dataverse Session Table

All orchestration sessions are tracked in `AgentOrchestrationSessions`:

| Column | Purpose |
|--------|---------|
| SessionId | Unique session identifier |
| Pattern | hub_and_spoke, pipeline, or consensus |
| PipelineName | Specific workflow name (WeeklyBusinessReview, MarkdownRecommendation) |
| Status | in_progress, completed, failed, timed_out |
| StartedAt | Session start timestamp |
| CompletedAt | Session completion timestamp |
| OwnerEntraId | Entra ID of the user who initiated the session |
| InputParameters | JSON serialization of session inputs |
| SpokeResults | Pipe-delimited spoke result summaries |
| FinalResult | Synthesized final response or recommendation |
| ConfidenceLevel | high, medium, or low (consensus sessions only) |
| ErrorDetails | JSON error details for failed or partially failed sessions |

---

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| OrchestratorTimeoutSeconds | Maximum seconds per spoke or stage before fallback | 30 |
| SpokeFallbackMessage | Message inserted when a spoke is unavailable | See solution-definition.yaml |
| BusinessReviewTeamsChannelId | Teams channel for weekly business review delivery | (required for Teams delivery) |
| BusinessReviewPowerPointTemplateId | SharePoint file ID for PowerPoint generation | (required for PowerPoint delivery) |

---

## Runbook Notes

1. Provision the `AgentOrchestrationSessions` Dataverse table as part of the
   solution import. See `solution/solution-definition.yaml` for the full schema.
2. Set `OrchestratorTimeoutSeconds` based on the expected Power BI query
   response time in your environment. Start with 30 and increase if spokes
   time out frequently.
3. Configure `BusinessReviewTeamsChannelId` before enabling the weekly
   business review pipeline with Teams delivery.
4. For PowerPoint delivery, upload the review template to SharePoint and
   record the file ID in `BusinessReviewPowerPointTemplateId`.
5. Review `AgentOrchestrationSessions` records regularly to monitor session
   failure rates and identify underperforming spokes or pipeline stages.
