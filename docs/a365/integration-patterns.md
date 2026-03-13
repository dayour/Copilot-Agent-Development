# M365 Agents SDK Integration Patterns

## Overview

This document describes four production-grade integration patterns for connecting Microsoft 365 Agents SDK-based applications and agents to Copilot Studio. Each pattern addresses a distinct architecture scenario, deployment topology, and team ownership model.

## Pattern 1: Teams AI + Copilot Studio (MAD-Scheduler)

### Scenario

A Teams AI application acts as the user-facing orchestrator. When it identifies a request that falls within Copilot Studio's domain, it delegates the conversation turn to the Copilot Studio agent, awaits the response, and returns it to the Teams user.

This is referred to as the MAD-Scheduler pattern (Multi-Agent Delegation with Scheduling), because the Teams AI application schedules delegation decisions across a pool of specialized agents.

### Architecture

```
Teams User
    |
    v
Teams AI Application (TypeScript / Node.js)
    |   - Handles Teams channel lifecycle
    |   - Evaluates intent routing rules
    |   - Manages conversation state
    |
    | [Delegation: CopilotStudioClient]
    v
Copilot Studio Agent
    |   - Domain-specific topics
    |   - Knowledge retrieval
    |   - Power Automate action execution
    |
    v
Response Activity returned to Teams AI
    |
    v
Teams User (reply rendered in Teams)
```

### When to Use

- An existing Teams bot or Teams AI application already handles some user interactions.
- A subset of requests requires Copilot Studio's low-code topic management and knowledge grounding.
- The team wants to maintain the Teams bot for Teams-specific adaptive cards and meeting integrations while offloading domain conversations to Copilot Studio.

### Implementation Steps

1. Register a Bot in Azure Bot Service for the Teams AI application.
2. Configure a Copilot Studio agent and enable the Direct Line channel.
3. Store the Direct Line secret as an environment variable accessible to the Teams AI app.
4. In the Teams AI application's activity handler, add delegation logic that evaluates inbound messages against a routing policy.
5. On delegation, use `CopilotStudioClient` to open a session, send the user's message, and receive the Copilot Studio response.
6. Map the Copilot Studio response Activity back to the Teams conversation reference and send it as a proactive reply.
7. Preserve the Copilot Studio session ID in `ConversationState` to enable multi-turn delegation within a single user conversation.

### State Correlation

The Teams AI application maintains a correlation map keyed on Teams conversation ID:

```text
TeamsConversationId --> CopilotStudioSessionId
```

Each inbound Teams activity checks whether an active delegation session exists. If it does, the activity is forwarded directly to the existing Copilot Studio session rather than re-evaluating the routing policy.

### Routing Policy

Define routing rules in a configuration object rather than hard-coded logic:

```json
{
  "delegationRules": [
    { "intentPattern": "claim*", "target": "copilot-studio" },
    { "intentPattern": "policy*", "target": "copilot-studio" },
    { "intentPattern": "meeting*", "target": "teams-ai-local" }
  ]
}
```

Evaluate rules in order. Fall through to a local handler if no rule matches.

### Key Considerations

| Consideration | Guidance |
|---|---|
| Latency | Each delegation adds one round trip. Profile under realistic load. |
| Session lifetime | Copilot Studio sessions expire after inactivity. Reset the session ID in state on expiry. |
| Adaptive Cards | Cards returned by Copilot Studio may require reformatting for Teams-specific card schema versions. |
| Error surfacing | Wrap delegation in try/catch and fall back to a local error topic if Copilot Studio is unreachable. |

---

## Pattern 2: Copilot Studio + External Agent (Agent-to-Agent Protocol)

### Scenario

A Copilot Studio agent needs to invoke a specialized external agent built on the M365 Agents SDK or another Bot Framework-compatible runtime. The two agents communicate using the standard Activity protocol without a human in the loop at the handoff boundary.

This is called the Agent-to-Agent (A2A) protocol pattern.

### Architecture

```
User
 |
 v
Copilot Studio Agent (Orchestrator)
 |   - Identifies request type
 |   - Packages context into Activity payload
 |
 | [HTTP POST to external agent endpoint]
 v
External Agent (Skill or Specialized Agent)
 |   - Processes sub-task
 |   - Returns result Activity
 |
 v
Copilot Studio (continues conversation with result)
 |
 v
User
```

### Activity Payload Structure for A2A

The orchestrating Copilot Studio agent invokes the external agent via an HTTP action in Power Automate. The payload conforms to the Bot Framework Activity schema:

```json
{
  "type": "message",
  "text": "Calculate freight cost for shipment ID SH-20845",
  "from": { "id": "copilot-studio-orchestrator", "name": "Copilot Studio" },
  "conversation": { "id": "cs-session-abc123" },
  "channelId": "directline",
  "value": {
    "shipmentId": "SH-20845",
    "originZip": "98001",
    "destinationZip": "30301"
  }
}
```

### Response Handling

The external agent returns a response Activity. Copilot Studio extracts the relevant data from the `text` or `value` fields and continues the conversation topic.

Expected response shape:

```json
{
  "type": "message",
  "text": "Estimated freight cost: $142.50, 3-day transit",
  "value": {
    "estimatedCost": 142.50,
    "transitDays": 3,
    "carrier": "UPS Ground"
  }
}
```

### Power Automate Flow Integration

Because Copilot Studio cannot directly issue outbound HTTP calls to arbitrary endpoints from within a topic, the invocation is performed via a Power Automate cloud flow triggered from a topic action:

1. Topic sends the sub-task parameters to a Power Automate flow.
2. The flow constructs the Activity payload and POSTs to the external agent's endpoint with the bot token in the Authorization header.
3. The flow parses the response and returns structured output to the topic.
4. The topic continues with the returned result.

### Authentication Between Agents

The external agent endpoint requires a valid bot token. The Power Automate flow acquires this token using a service principal with the `https://api.botframework.com/.default` scope. See the Authentication Guide for token acquisition details.

### When to Use

- Copilot Studio needs capabilities from a specialized agent not representable as a Power Platform connector.
- The external agent is independently developed and owned by a different team.
- The integration requires passing structured payloads beyond what a simple HTTP connector supports.

---

## Pattern 3: M365 Copilot Extension (Declarative Agent with Copilot Studio Backend)

### Scenario

A declarative agent is published to Microsoft 365 Copilot as an extension. The declarative agent's conversation handling is backed by a Copilot Studio agent, giving authors access to Copilot Studio's topic management, knowledge grounding, and Power Automate action integration while surfacing the agent natively in M365 Copilot Chat.

### Architecture

```
M365 Copilot Chat (User)
    |
    v
Microsoft 365 Copilot Orchestrator
    |   - Routes extension requests
    |
    v
Declarative Agent Manifest (app package)
    |   - API plugin descriptor
    |   - Capability declarations
    |
    v
Plugin API Endpoint (Azure Function or APIM)
    |   - Validates token
    |   - Calls CopilotStudioClient
    |
    v
Copilot Studio Agent
    |   - Executes topic and returns structured response
    |
    v
Response flows back to M365 Copilot Chat
```

### Declarative Agent Manifest

The declarative agent is described in a `manifest.json` that declares:

- `name` and `description` (used by M365 Copilot for routing and display)
- `capabilities` array listing the plugin capabilities (conversation, action)
- `plugins` array pointing to the OpenAPI-described API plugin

```json
{
  "schema_version": "v2.3",
  "name_for_human": "Claims Assistant",
  "description_for_human": "Handles insurance claim inquiries and status updates.",
  "description_for_model": "Use this extension when the user asks about insurance claims, claim status, FNOL intake, or policy documents.",
  "capabilities": {
    "conversation_starters": [
      { "text": "Check my claim status" },
      { "text": "Start a new claim" },
      { "text": "Upload a document for my claim" }
    ]
  },
  "plugins": [
    {
      "file": "copilot-studio-plugin.json"
    }
  ]
}
```

### API Plugin Descriptor

The API plugin descriptor maps M365 Copilot's function calling to the plugin API endpoint:

```json
{
  "schema_version": "v1",
  "name_for_model": "ClaimsAssistantPlugin",
  "description_for_model": "Provides access to claims data and supports FNOL intake via Copilot Studio.",
  "functions": [
    {
      "name": "SendMessage",
      "description": "Send a user message to the Claims Assistant agent and receive the response.",
      "parameters": {
        "type": "object",
        "properties": {
          "message": { "type": "string", "description": "The user message to send" },
          "sessionId": { "type": "string", "description": "Existing session ID for multi-turn conversations" }
        },
        "required": ["message"]
      }
    }
  ],
  "runtimes": [
    {
      "type": "OpenApi",
      "auth": { "type": "OAuthPluginVault" },
      "spec": { "url": "https://api.contoso.com/claims-assistant/openapi.json" }
    }
  ]
}
```

### Plugin API Implementation

The plugin API endpoint is a thin adapter that:

1. Validates the inbound M365 Copilot token using the OBO flow.
2. Retrieves or creates a Copilot Studio session for the user.
3. Sends the user message to Copilot Studio via `CopilotStudioClient`.
4. Returns the Copilot Studio response in the API response body.

### When to Use

- The agent must appear natively in M365 Copilot Chat alongside other M365 Copilot capabilities.
- Copilot Studio is the preferred authoring environment for topics and knowledge.
- The organization wants to control the extension's schema and routing hints in the declarative manifest independently of the Copilot Studio agent authoring.

---

## Pattern 4: Custom Client + Copilot Studio (Direct Line SDK)

### Scenario

A custom web application, mobile application, or backend service communicates directly with a Copilot Studio agent using the Direct Line REST API or WebSocket API. There is no intermediary Teams or M365 Copilot layer.

### Architecture

```
Custom Web / Mobile App
    |   - Manages UI and session
    |
    | [Direct Line REST or WebSocket]
    v
Copilot Studio Direct Line Endpoint
    |
    v
Copilot Studio Agent
    |
    v
Response Activities streamed or returned to client
```

### Direct Line Token Acquisition

Clients should never embed the Direct Line Secret in client-side code. Instead, a server-side token endpoint exchanges the secret for a short-lived token:

```text
POST https://directline.botframework.com/v3/directline/tokens/generate
Authorization: Bearer {DirectLineSecret}

Response:
{
  "conversationId": "abc123",
  "token": "short-lived-token",
  "expires_in": 1800
}
```

The client receives only the short-lived token. The server holds the secret.

### Conversation Lifecycle

1. Client calls the server-side token endpoint to get a token and initial `conversationId`.
2. Client opens a WebSocket connection using the `streamUrl` returned in the start conversation response, or polls the activity endpoint with `GET /activities?watermark=`.
3. Client sends user messages with `POST /activities`.
4. Client receives response activities via WebSocket or polling.
5. On token expiry (30 minutes), client requests a token refresh from the server endpoint.
6. On disconnect, client reconnects with the last received watermark to replay any missed activities.

### Adaptive Card Handling

When Copilot Studio returns an Adaptive Card attachment:

1. The client receives an Activity with `attachments` containing `contentType: application/vnd.microsoft.card.adaptive`.
2. The client renders the card using the Adaptive Cards rendering library for the target platform (JavaScript, iOS, Android).
3. On card submission, the client sends a `message` or `invoke` Activity with the card's `data` payload in `value`.
4. Copilot Studio processes the submission and continues the topic.

### When to Use

- No Teams or M365 Copilot dependency.
- Custom branding and UX requirements.
- Mobile applications.
- Embedded agents in third-party portals or kiosk displays.

### Key Considerations

| Consideration | Guidance |
|---|---|
| Token security | Never expose Direct Line Secret in client-side code. Always use server-side token exchange. |
| Reconnection | Implement watermark-based reconnection to handle WebSocket drops without losing activities. |
| Adaptive Cards version | Align the Adaptive Cards rendering library version with the version used in Copilot Studio topics. |
| CORS | Configure CORS on the server-side token endpoint to allow only trusted client origins. |

---

## Pattern Comparison

| Pattern | Entry point | Delegation mechanism | Copilot Studio role | Best for |
|---|---|---|---|---|
| Teams AI + Copilot Studio | Teams bot | CopilotStudioClient delegation | Domain specialist | Teams-first orgs with existing bots |
| Copilot Studio + External Agent | Copilot Studio topic | Power Automate HTTP action | Orchestrator | Extending Copilot Studio with specialized external agents |
| M365 Copilot Extension | M365 Copilot Chat | Declarative agent plugin API | Conversation backend | Native M365 Copilot Chat integration |
| Custom Client + Copilot Studio | Custom app | Direct Line REST or WebSocket | Full agent | Custom web, mobile, embedded deployments |
