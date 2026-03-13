# Extensibility and Customization Guide

## Overview
This guide covers how to extend the showcase agents in this repository -- adding topics, integrating new data sources, building custom connectors, and creating entirely new verticals.

Use this guide when the base scaffold is working and you are ready to customize behavior for real-world business workflows.

---

## Adding New Topics

### Topic anatomy
Every Copilot Studio topic should include these core building blocks:

1. Trigger phrases
2. Entity extraction
3. Conditions and branching
4. Actions (flows, connectors, HTTP calls, prompts)
5. Response messages

### Step-by-step: add a topic to an existing agent
1. Open the target agent in Copilot Studio.
2. Go to **Topics** and select **New topic**.
3. Name the topic with a clear intent-focused name (for example, `Menu Allergen Check`).
4. Add trigger phrases (minimum 5 to 10).
5. Add question nodes to collect missing entities.
6. Add condition branches for business rules.
7. Add action nodes for data lookups or automation.
8. Add final response message(s) and fallback response(s).
9. Save and test in the test canvas.
10. Publish when validated.

### Trigger phrase best practices
- Use at least 5 to 10 phrases per topic.
- Include synonyms and natural user wording.
- Include phrases with and without explicit entity values.
- Avoid overly similar phrases that only differ by punctuation.

Example set for an allergen topic:
- "Does the mocha contain nuts?"
- "Check allergens for cappuccino"
- "Is there dairy in oat latte?"
- "Show allergens for espresso menu"
- "I have a peanut allergy, what can I drink?"

### Entity types
Use entity types based on data strictness:
- `string`: free text (for example, beverage name)
- `choice`: controlled values (for example, allergy type)
- `date`: incident or reservation date
- `number`: quantity or threshold
- `boolean`: yes/no confirmation
- `custom entities`: domain-specific extraction models

### Condition branching
Use `if / else-if / else` to route based on:
- Entity values
- Missing required fields
- User profile or context variables
- External response status (for example, API result)

### Message formatting options
- Plain text for simple responses
- Adaptive Cards for structured responses
- Quick replies for constrained choices

### Example: "Menu Allergen Check" topic for Coffee Virtual Coach
Flow:
1. Trigger: user asks about allergens.
2. Question: collect beverage item and allergy type if missing.
3. Action: invoke menu metadata lookup flow.
4. Condition:
   - If allergen is present: return warning and alternatives.
   - Else: confirm item is suitable.
5. Message: include substitution suggestions.

Example topic sketch (YAML):
```yaml
kind: AdaptiveDialog
beginDialog:
  kind: OnRecognizedIntent
  id: menu_allergen_check
  intent:
    displayName: Menu Allergen Check
    triggerQueries:
      - Check allergens for my drink
      - Does this coffee contain nuts
      - I need allergy-safe options
  actions:
    - kind: Question
      id: q_beverage
      variable: Topic.BeverageName
      prompt: Which menu item should I check?
      entity: StringPrebuiltEntity
    - kind: Question
      id: q_allergen
      variable: Topic.AllergenType
      prompt: Which allergen should I screen for?
      entity: StringPrebuiltEntity
    - kind: InvokeFlowAction
      id: lookup_allergen
      input:
        beverageName: =Topic.BeverageName
        allergenType: =Topic.AllergenType
      output:
        containsAllergen: Topic.ContainsAllergen
        alternatives: Topic.Alternatives
    - kind: ConditionGroup
      id: allergen_branch
      conditions:
        - id: has_allergen
          condition: =Topic.ContainsAllergen = true
          actions:
            - kind: SendMessage
              id: msg_warning
              message: This item may contain {Topic.AllergenType}. Recommended alternatives: {Topic.Alternatives}
      elseActions:
        - kind: SendMessage
          id: msg_safe
          message: This item does not contain {Topic.AllergenType} based on current menu metadata.
```

---

## Topic Chaining and Multi-Turn Conversations

### Context variables
Use explicit variables for cross-step state:
- Declare at first use with clear names.
- Keep naming consistent (`Topic.*` for local, global for cross-topic session state).
- Reset variables when they should not persist.

### Topic redirect
Use redirect when one topic needs specialized logic from another topic:
1. Parent topic captures initial request.
2. Parent redirects to child topic with input parameters.
3. Child returns output variables.
4. Parent resumes and synthesizes answer.

### Conversation memory
- Persists across turns: session/global variables, recent context.
- Resets on topic exit: topic-local variables (unless passed out).
- Resets on session end: session state.

### Pattern: decomposition chain (Clothing root cause analysis)
1. Parent topic collects business question.
2. Redirect to `Query Sales` sub-topic; store `Topic.SalesResult`.
3. Redirect to `Query Inventory` sub-topic; store `Topic.InventoryResult`.
4. Return to parent topic.
5. Synthesize both variables into one diagnostic response.

### Pattern: progressive disclosure (Insurance FNOL)
1. Collect claimant identity and incident summary.
2. Branch by incident type (auto, property, liability).
3. Redirect to incident-specific follow-up topic.
4. Collect only fields needed for that branch.
5. Return consolidated claim intake output.

### Anti-patterns
- Infinite redirect loops between topics.
- Reusing generic variable names across topics (`Result`, `Data`) causing collisions.
- Overloading one topic with unrelated intents.

---

## Creating Custom Connectors

### When to use
Use a custom connector when an external API has no built-in Power Platform connector.

### Step-by-step: create from OpenAPI definition
1. Write or obtain an OpenAPI (Swagger) specification for the target API.
2. In Power Platform, go to **Custom Connectors > New > Import from OpenAPI**.
3. Configure authentication (API key, OAuth 2.0, or Basic Auth).
4. Define actions (one action per endpoint or business operation).
5. Test each action in the connector test pane.
6. Create and use a connection reference for ALM.

### Example: Salesforce custom connector (Tech vertical)
- Actions:
  - `GetAccountById`
  - `ListOpenCases`
  - `CreateServiceRequest`
- Typical use: enrich hardware request topic with CRM account context.

### Example: Fuel Card API connector (Transportation vertical)
- Actions:
  - `GetCardTransactions`
  - `GetDailySpendByVehicle`
  - `FlagSuspiciousPurchase`
- Typical use: incident or anomaly workflows.

### Best practices
- Version your OpenAPI spec and keep it in source control.
- Use clear, action-oriented names.
- Add descriptions to every input parameter.
- Return normalized output objects for easier topic branching.

Example OpenAPI fragment (JSON):
```json
{
  "openapi": "3.0.1",
  "info": {
    "title": "Fuel Card API",
    "version": "1.0.0"
  },
  "paths": {
    "/transactions": {
      "get": {
        "operationId": "GetCardTransactions",
        "parameters": [
          {
            "name": "vehicleId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "Fleet vehicle identifier"
          }
        ],
        "responses": {
          "200": {
            "description": "Transaction list"
          }
        }
      }
    }
  }
}
```

---

## Adding Knowledge Sources

### SharePoint sources
Supported patterns:
- Document libraries
- Site pages
- Lists

Guidance:
- Use short pages with clear headings.
- Keep metadata clean (managed properties improve relevance).
- Validate indexing behavior in test sessions.
- Choose refresh model based on volatility:
  - Continuous crawl for frequently updated content
  - Manual sync for controlled releases

### Dataverse
Use Dataverse tables for structured knowledge and operational records.

### Public websites
Use URL-based knowledge sources for externally hosted policy or reference docs.

### File uploads
Upload static content (PDF, Word, Excel) for focused grounding.

### Best practices
- Keep documents under 10 pages where practical.
- Prefer Q&A-style structure.
- Test with realistic user questions, not author phrasing.

---

## Adaptive Card Design

### When to use Adaptive Cards
- Structured input forms
- Structured output dashboards
- Action-driven UI responses

Schema reference:
- https://adaptivecards.io

### Common input types
- Text
- Number
- Date
- Time
- Toggle
- ChoiceSet

### Patterns used in this repo
- Insurance FNOL intake form (multi-field input)
- Transportation incident report (field input with photo upload handoff)
- Coffee shift handover checklist (boolean checks plus notes)
- Tech hardware request (multi-field request with approvals)
- Clothing KPI dashboard (structured output and actions)

### Submit actions
Use card `Action.Submit` payload to trigger a Power Automate flow and map returned outputs back into conversation variables.

### Versioning
Use Adaptive Cards version 1.4 or later for compatibility with Copilot Studio channel behavior.

Example card payload (JSON):
```json
{
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "text": "Insurance FNOL Intake",
      "weight": "Bolder",
      "size": "Medium"
    },
    {
      "type": "Input.Text",
      "id": "claimantName",
      "label": "Claimant name"
    },
    {
      "type": "Input.Date",
      "id": "incidentDate",
      "label": "Incident date"
    },
    {
      "type": "Input.ChoiceSet",
      "id": "incidentType",
      "label": "Incident type",
      "choices": [
        { "title": "Auto", "value": "auto" },
        { "title": "Property", "value": "property" },
        { "title": "Liability", "value": "liability" }
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Submit",
      "data": {
        "action": "submitFnol"
      }
    }
  ]
}
```

---

## AI Builder Integration

### Relevant AI Builder model types
- Document Processing
- Prediction
- Category Classification
- Sentiment Analysis

### Integration pattern
1. Topic invokes Power Automate flow.
2. Flow calls AI Builder model.
3. Flow maps model outputs to response object.
4. Topic receives outputs and formats user response.

### Example: Insurance document OCR
- Input: uploaded police report
- AI Builder extracts incident date, involved parties, description
- Agent pre-fills claim fields and asks user to confirm

### Example: Clothing demand forecasting
- Prediction model trained on historical sales
- Topic asks for SKU/time horizon
- Flow returns forecast, confidence, recommended action

### Operational guidance
- Establish retraining schedule (for example monthly or by drift threshold).
- Track model quality trends (precision/recall or error rate by segment).
- Define AI Builder credit budget and monitor consumption.

---

## Power Automate Flow Patterns

### Trigger types
- Copilot Studio topic action trigger
- Adaptive card submit
- Scheduled recurrence

### Input/output mapping
- Map conversation variables to flow inputs in the action node.
- Map flow response fields back to topic/global variables.
- Use strongly named outputs to simplify branching (`Status`, `ErrorCode`, `ResultPayload`).

### Error handling
- Use try/catch scopes.
- Add fallback user message path.
- Log failed transactions to a dead-letter store.

### Performance tuning
- Use parallel branches for independent API calls.
- Reduce sequential dependencies.
- Return early with minimal required payload when possible.

### Pattern: multi-measure query (Clothing)
- Input: array of KPI measures.
- Flow executes DAX queries in parallel branches.
- Flow merges outputs into one response object for card rendering.

### Pattern: anomaly detection (Transportation)
- Scheduled recurrence flow.
- Loop through current fleet events.
- Evaluate rules and thresholds.
- Trigger alert topic or notification on anomaly match.

### Pattern: SLA monitoring (Insurance)
- Scheduled flow checks all open claims.
- Compares claim age against state-specific deadlines.
- Creates escalation tasks for at-risk claims.

Example output schema (JSON):
```json
{
  "status": "ok",
  "result": {
    "measureCount": 4,
    "items": [
      { "name": "Revenue", "value": 128430.21 },
      { "name": "Margin", "value": 0.318 }
    ]
  },
  "error": null
}
```

---

## Building a New Vertical

Step-by-step guide to create a new industry vertical from scratch using the scaffold:

1. Create directory: `<vertical>/agents/<agent-name>/`
2. Copy scaffold template files:
   - `README.md`
   - `runbook.md`
   - `templates/agent-template.yaml`
   - `solution/solution-definition.yaml`
3. Define agent identity:
   - Name
   - Description
   - Primary users
   - Channels
4. Design topics:
   - Define 5 to 8 core topics that cover roughly 80 percent of user needs
5. Identify integrations:
   - Required APIs
   - Required internal systems
6. Design Dataverse schema (if applicable):
   - Tables
   - Columns
   - Relationships
7. Build Power Automate flows:
   - One per external system interaction
8. Configure knowledge sources:
   - SharePoint libraries
   - Uploaded documents
9. Set up authentication:
   - Internal-only or dual-channel model
10. Test conversation flows:
   - Use Copilot Studio test canvas and scripted scenarios
11. Deploy to channels:
   - Teams
   - Web chat
   - Mobile
12. Document implementation in `README` and `runbook`.

Recommended starter checklist (YAML):
```yaml
vertical: RetailBanking
agent:
  name: Retail Ops Assistant
  channels:
    - teams
    - webchat
topics:
  - Account Balance Inquiry
  - Dispute Card Transaction
  - Branch Appointment
  - Loan Status Check
integrations:
  - CoreBankingApi
  - CRMConnector
knowledge:
  - SharePointPolicyLibrary
  - ProductFAQDocs
```

---

## Environment Variable Management

### What they are
Environment variables are configurable values that differ by environment (dev, test, prod) without changing topic or flow logic.

### Common types
- String
- Secret (API keys, client secrets)
- Number

### How to define
Define variables in `solution-definition.yaml`.

Example:
```yaml
environmentVariables:
  - name: SalesforceClientId
    type: secret
    required: true
  - name: PowerBiWorkspaceId
    type: string
    required: true
  - name: RetryLimit
    type: number
    required: false
    default: 3
```

### How to map during import
1. Export solution from source environment.
2. Import into target environment.
3. Provide target-specific values for each variable.
4. Validate connector and flow bindings after import.

### Naming conventions
- Use PascalCase.
- Use descriptive names.
- Prefix by system where appropriate:
  - `SalesforceClientId`
  - `PowerBiWorkspaceId`
  - `FuelCardApiBaseUrl`

---

## Final Recommendations
- Keep topic scope narrow and intent-focused.
- Prefer reusable flows and connector actions over duplicated logic.
- Test with real user utterances before publishing.
- Use solution-aware ALM from the beginning.
- Treat this guide as a living document and update it as vertical implementations evolve.
