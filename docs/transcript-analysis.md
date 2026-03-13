# Conversation Transcript Analysis Pipeline

This document describes the `tools/transcript-analysis.py` pipeline, which
analyses Copilot Studio conversation transcripts to identify agent improvement
opportunities across all verticals.

## Overview

The pipeline consumes a conversation transcript export from Copilot Studio
analytics or a Dataverse conversation log and produces a weekly report
covering six analysis categories:

| Category | What it detects |
|----------|-----------------|
| Unrecognized Intent Clustering | Groups fallback conversations by intent pattern to surface missing topics |
| Topic Confusion Matrix | Identifies topic pairs where routing frequently goes wrong |
| Knowledge Gap Detection | Finds questions where knowledge sources return no results |
| Sentiment Drift | Detects conversations where user sentiment degrades over turns |
| Escalation Pattern Analysis | Identifies common topic paths leading to human handoff |
| Response Quality Sampling | Random sample of conversations scored by heuristic quality judge |

At the end of each report, the pipeline emits a prioritised list of
actionable recommendations mapped to specific agent and topic improvements.

## Quick Start

```bash
# Basic usage -- reads a CSV export and prints a Markdown report
python tools/transcript-analysis.py --input transcripts.csv

# Write the report to a file
python tools/transcript-analysis.py --input transcripts.csv --output report.md

# JSON input and JSON output
python tools/transcript-analysis.py \
  --input transcripts.json \
  --format json \
  --report-format json \
  --output report.json

# Reduce the retention window to the last 30 days
python tools/transcript-analysis.py \
  --input transcripts.csv \
  --retention-days 30
```

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--input FILE` | required | Path to the transcript export file (CSV or JSON) |
| `--format {csv,json}` | `csv` | Input file format |
| `--output FILE` | stdout | Path to write the report |
| `--report-format {markdown,json}` | `markdown` | Output format |
| `--retention-days DAYS` | `90` | Exclude conversations older than this many days |
| `--sample-size N` | `50` | Number of conversations in the quality sample |
| `--similarity-threshold FLOAT` | `0.30` | Cosine similarity threshold for intent and gap clustering |
| `--drift-threshold FLOAT` | `-0.40` | Sentiment drift delta below which a conversation is flagged |
| `--seed INT` | none | Random seed for reproducible quality sampling |

Exit codes: `0` = success, `1` = input error, `2` = argument error.

## Input Format

The pipeline accepts any CSV or JSON export that includes a `conversation_id`
column. All other columns are optional; the pipeline auto-detects fallback and
escalation turns from message text when the explicit flag columns are absent.

See `tools/transcript-analysis-config.yaml` for the full field schema and
accepted column name aliases.

### Minimum required columns

| Column | Description |
|--------|-------------|
| `conversation_id` | Unique session identifier (no user identity) |

### Recommended columns for full analysis

| Column | Description |
|--------|-------------|
| `timestamp` | UTC turn timestamp (enables retention filtering) |
| `speaker` | `user` or `agent` |
| `text` | Message text (used only for in-process analysis, never written to output) |
| `topic_triggered` | Matched Copilot Studio topic name |
| `is_fallback` | Boolean flag for unrecognised turns |
| `is_escalation` | Boolean flag for human-handoff turns |
| `knowledge_result_count` | Number of knowledge-source results (0 = no-result turn) |

### Exporting from Copilot Studio

1. Navigate to **Analytics** in Copilot Studio.
2. Select the date range (recommended: last 7 days for weekly cadence).
3. Export conversation transcripts to CSV.
4. Optionally redact or pseudonymize PII in the `text` / `message` column
   before running the pipeline.

### Exporting from Dataverse

Query the `msdyn_conversationtranscript` table using the Dataverse Web API or
Power Automate:

```
GET /api/data/v9.2/msdyn_conversationtranscripts
    ?$select=msdyn_conversationid,msdyn_createdon,msdyn_content,cr_topictriggered,
             cr_isfallback,cr_isescalation,cr_knowledgeresultcount
    &$filter=msdyn_createdon ge <cutoff_date>
    &$orderby=msdyn_conversationid,msdyn_createdon
```

Export to CSV and run with `--input transcripts.csv`.

## Privacy

The pipeline is designed to produce output that contains no PII:

- Message text is never written to output; only aggregate patterns and
  conversation IDs appear in the report.
- Clustering output uses privacy-safe SHA-256 hashes of normalized query
  text, not the raw text itself.
- User-turn text is tokenised, stop-word filtered, and discarded after
  in-process analysis.
- The `--retention-days` flag (default: 90) ensures old conversations are
  excluded from analysis, supporting configurable data retention policies.
- Conversation IDs are included to enable drill-through investigation, but
  these must not contain or resolve to user identity information.

Ensure that PII redaction or pseudonymization is applied to the `text` column
of the input file upstream of this pipeline.

## Scheduling (Weekly)

The following Power Automate flow snippet illustrates a weekly scheduled run:

```
Trigger: Recurrence -- Weekly, Monday 06:00 UTC
Action 1: Export transcripts from Dataverse (last 7 days) to Azure Blob Storage
Action 2: Run script via Azure Automation or Logic App HTTP action
           Input: transcript CSV from Blob
           Args:  --retention-days 7 --output report.md --seed 42
Action 3: Send report.md to analytics Teams channel
```

Alternatively, use a scheduled GitHub Actions workflow or Azure DevOps
pipeline to run the script and publish the report as an artefact.

## Analysis Details

### 1. Unrecognized Intent Clustering

Fallback user turns are grouped by cosine similarity of their token vectors.
Clusters with two or more members are reported with their most common terms.
Each cluster represents a potential missing topic.

Tuning: increase `--similarity-threshold` (towards 1.0) to produce tighter,
more specific clusters. Decrease it to merge more loosely related turns.

### 2. Topic Confusion Matrix

A confusion event is recorded when a fallback turn immediately follows a
turn that was routed to a topic, suggesting the previous routing led the
user to retry with a rephrasing. Pairs with two or more occurrences are
included in the matrix.

Action: review trigger phrases for the intended topic and add rephrasings
that cover the patterns observed in the confused conversations.

### 3. Knowledge Gap Detection

Agent turns containing zero-result knowledge responses (either via the
`knowledge_result_count` field or auto-detected from response text) are
attributed to the preceding user query. Queries are clustered by token
similarity to surface recurring topics not covered by current knowledge
sources.

Action: add documents, SharePoint pages, or structured knowledge entries
covering the terms identified in each gap cluster.

### 4. Sentiment Drift

User-turn sentiment is scored using a lexicon of positive and negative
words. Opening sentiment is the average of the first two user turns;
closing sentiment is the average of the last two. Conversations where the
closing-to-opening delta falls below `--drift-threshold` (default: -0.40)
are flagged for investigation.

Action: review the agent responses in flagged conversations, particularly
at the turn where sentiment first drops, and improve response quality,
add empathy language, or offer escalation earlier.

### 5. Escalation Pattern Analysis

Conversations that ended in a human-handoff escalation are grouped by the
ordered sequence of topics traversed before the escalation. Paths with two
or more occurrences are reported.

Action: for the most common paths, consider adding self-service automation,
improving the relevant topics, or adjusting the escalation trigger threshold.

### 6. Response Quality Sampling

A random sample of conversations is scored using a heuristic quality
function that combines fallback rate, knowledge hit rate, escalation
outcome, and closing sentiment. The score ranges from 0 (poor) to 1
(excellent).

In production deployments, replace the `_heuristic_quality_score` function
in the script with a call to an LLM judge (for example, an Azure OpenAI
GPT-4 prompt that evaluates the conversation transcript and returns a score
and justification).

## Mapping Recommendations to Agent Improvements

Each recommendation in the report includes the specific cluster ID, topic
name, or path signature to allow direct navigation to the affected agent
configuration in Copilot Studio:

1. Open Copilot Studio and select the agent identified in the recommendation.
2. Navigate to **Topics** and search for the topic name.
3. Add or update trigger phrases, knowledge sources, or flow actions as
   indicated.
4. Republish the agent and monitor the next weekly report for improvement.

## Dependencies

The pipeline has no mandatory third-party dependencies. It uses only the
Python 3.8+ standard library. Optional enhancements:

- Install `pyyaml` to load custom config files: `pip install pyyaml`
- Replace `_heuristic_quality_score` with an OpenAI call for LLM-judge
  scoring: `pip install openai`
- For higher-quality clustering at scale, replace the token-vector approach
  with sentence embeddings: `pip install sentence-transformers`
