# Cross-Vertical Evaluation Framework

## Purpose

This framework provides a structured approach to evaluating Copilot Studio agents across all verticals in this repository. It uses an LLM-as-judge pattern for ground truth scoring, enabling consistent, repeatable quality measurement across agents without requiring manual review of every response.

The framework covers five verticals: coffee, clothing, insurance, tech, and transportation. Each vertical has agent-specific test sets that exercise the full range of capabilities documented in the agent templates.

---

## Architecture

The evaluation pipeline moves data through five stages:

```
Test Set (YAML) -> Eval Runner -> Direct Line Client -> Agent -> Response -> LLM Judge -> Score Report
```

1. **Test Set**: YAML files under `evals/test-sets/<vertical>/<agent>/test-cases.yaml` define the queries, expected outputs, and grading configuration for each test case.
2. **Eval Runner**: `evals/runner.py` orchestrates loading test cases, dispatching them to the agent, invoking graders, and assembling the final report.
3. **Direct Line Client**: The runner communicates with deployed Copilot Studio agents via the Bot Framework Direct Line API v3.
4. **Agent**: The deployed Copilot Studio agent processes the inbound activity and returns a response.
5. **LLM Judge**: Grader modules in `evals/graders/` score the agent response against expected outputs and quality dimensions.
6. **Score Report**: Results are written to `evals/reports/` as JSON, and a human-readable table is printed to stdout.

---

## Eval Dimensions

Each agent response is scored across five dimensions on a 1-5 scale. The weighted score determines pass or fail.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Groundedness | 25% | Response is factually accurate and free of hallucinations. Claims are supported by retrieved context or known facts. |
| Completeness | 20% | Response fully addresses the user query. No required information is omitted. |
| Relevance | 20% | Response stays on topic. No tangential content or unnecessary elaboration. |
| Safety | 25% | Response contains no harmful content, policy violations, PII exposure, or inappropriate material. |
| Tone | 10% | Response uses a professional, appropriate register consistent with the vertical and agent persona. |

A weighted score of 1.0 to 5.0 is produced per test case. Scores below the tier threshold are marked as failing.

---

## Test Set Tiers

Test cases are organized into tiers that reflect different testing concerns and are run at different points in the development lifecycle.

| Tier | Method | Pass Rate | When |
|------|--------|-----------|------|
| Critical | Keyword + exact match | 100% | Every iteration |
| Functional | LLM judge + keyword | 70% | Per capability |
| Integration | Action verification | 80% | After tool config |
| Conversational | LLM judge multi-turn | 60% | After functional |
| Regression | Full suite | 70% | Final gate |

- **Critical**: Core facts that must always be present. Graded by keyword or exact match with zero tolerance for failure.
- **Functional**: Capability-level quality scored by LLM judge. Failures indicate a significant capability regression.
- **Integration**: Verifies that connector-backed actions return structured, verifiable output. Requires live connector configuration.
- **Conversational**: Multi-turn exchanges graded for coherence, context retention, and quality across the full dialogue.
- **Regression**: Full test suite run as a final quality gate before promotion to production.

---

## Multi-Model Consensus

When `--judge-model consensus` is specified, the LLM judge grader calls both GPT-4o and Claude Sonnet and applies the following reconciliation rules:

- For each dimension, if the two scores differ by 0.5 or less on the 1-5 scale, the scores are averaged.
- If the two scores differ by more than 0.5 on any dimension, that dimension is flagged as a disagreement in the report.
- Flagged dimensions are surfaced for human review in the JSON report under `"disagreements"`.
- The 2/3 agreement threshold means that at least two of three possible scoring perspectives (GPT-4o score, Claude score, and averaged consensus) must agree within 0.5 for the dimension to be considered resolved without human review.

API keys are read from the `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` environment variables.

---

## Usage

### Prerequisites

```
python3 evals/runner.py --help
```

The runner requires Python 3.9 or later. All graders function with the Python standard library. LLM judge grading additionally requires the `openai` and `anthropic` packages:

```
pip install openai anthropic
```

YAML test set loading additionally requires `pyyaml`:

```
pip install pyyaml
```

### Basic run (dry run, table output)

```
python3 evals/runner.py \
  --test-set evals/test-sets/coffee/virtual-coach/test-cases.yaml \
  --dry-run
```

### Run a specific tier with LLM judge

```
export OPENAI_API_KEY=<your-key>
export DIRECT_LINE_SECRET=<your-bot-secret>

python3 evals/runner.py \
  --test-set evals/test-sets/coffee/virtual-coach/test-cases.yaml \
  --tier critical \
  --judge-model gpt-4o \
  --direct-line-secret DIRECT_LINE_SECRET \
  --output table
```

### Run with consensus scoring and save JSON report

```
export OPENAI_API_KEY=<your-key>
export ANTHROPIC_API_KEY=<your-key>
export DIRECT_LINE_SECRET=<your-bot-secret>

python3 evals/runner.py \
  --test-set evals/test-sets/tech/it-help-desk/test-cases.yaml \
  --vertical tech \
  --agent it-help-desk \
  --judge-model consensus \
  --direct-line-secret DIRECT_LINE_SECRET \
  --output json > evals/reports/it-help-desk-$(date +%Y%m%d).json
```

### CLI arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--test-set` | Path to a YAML test set file | Required |
| `--vertical` | Filter to a specific vertical | All verticals |
| `--agent` | Filter to a specific agent | All agents |
| `--tier` | Filter to a specific tier | All tiers |
| `--output` | Output format: `table` or `json` | `table` |
| `--judge-model` | LLM judge model: `gpt-4o`, `claude-sonnet-4-5`, or `consensus` | `gpt-4o` |
| `--direct-line-secret` | Name of the environment variable holding the Direct Line secret | None |
| `--dry-run` | Parse and validate test cases without calling the agent | False |

---

## Directory Structure

```
evals/
  README.md                                   -- this file
  runner.py                                   -- eval runner CLI
  graders/
    __init__.py                               -- exports all grader classes
    exact_match.py                            -- exact match grader
    keyword_match.py                          -- keyword match grader
    llm_judge.py                              -- LLM-as-judge grader (openai + anthropic)
    safety_check.py                           -- keyword-based safety grader
    semantic_similarity.py                    -- TF-IDF cosine similarity grader
  test-sets/
    coffee/virtual-coach/test-cases.yaml
    clothing/power-analysis/test-cases.yaml
    insurance/claims-assistant/test-cases.yaml
    tech/it-help-desk/test-cases.yaml
    tech/kusto-analytics/test-cases.yaml
    transportation/fleet-coordinator/test-cases.yaml
    transportation/fuel-tracking/test-cases.yaml
    transportation/route-optimizer/test-cases.yaml
  reports/
    .gitkeep                                  -- placeholder; generated reports go here
```

---

## Test Case Schema

Each test case in a YAML test set file follows this structure:

```yaml
- id: string                          # unique identifier within the file
  tier: critical|functional|integration|conversational|regression
  query: string                       # the user utterance sent to the agent
  expected_keywords: [list]           # keywords that must appear in the response
  expected_response: string           # exact expected response (optional)
  context: string                     # background context provided to the LLM judge
  grader: exact_match|keyword_match|llm_judge|safety_check|semantic_similarity
  dimensions: [list]                  # eval dimensions for llm_judge grader
  pass_threshold: float               # minimum score to pass (e.g. 0.7)
  description: string                 # human-readable description of what this case tests
```

---

## Adding New Test Cases

1. Locate or create the test set file for the target vertical and agent under `evals/test-sets/`.
2. Add one or more test case entries following the schema above.
3. Choose the grader appropriate for the tier: `keyword_match` or `exact_match` for critical, `llm_judge` for functional and conversational.
4. Set `pass_threshold` to match the tier pass rate (1.0 for critical, 0.7 for functional, etc.).
5. Run the runner with `--dry-run` to validate the YAML before executing against a live agent.
