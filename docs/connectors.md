# Connectors Reference

## Overview
Copilot Studio agents in this solution use Power Automate cloud flows to integrate with Microsoft 365, Dataverse, analytics platforms, and external line-of-business APIs. Connectors provide standardized integration surfaces for authentication, request/response shaping, retry behavior, and operational error handling. In practice, each vertical composes these connectors differently, but all implementations should follow common governance, ALM, and security controls.

## Connector Inventory

| Connector Type | Vertical(s) | Auth Type | License Requirement |
|---|---|---|---|
| Microsoft Teams | Coffee, Clothing, Insurance, Transportation, Tech | Delegated (user) or service account connection | Standard |
| SharePoint | Coffee (primary knowledge), Clothing, Insurance, Transportation, Tech | Microsoft Entra ID delegated | Standard |
| Office 365 Outlook | Coffee, Insurance, Transportation | Delegated (user) or service mailbox connection | Standard |
| Microsoft Dataverse | Clothing, Insurance, Transportation, Tech | Environment-native connection (Entra-backed) | Premium (Dataverse entitlement dependent) |
| Azure Active Directory | Tech, plus all verticals for identity lookup | Delegated or app permissions (Graph-backed) | Premium |
| Power BI | Clothing | Service account or service principal | Premium |
| Salesforce CRM (Custom Connector) | Tech | OAuth 2.0 (Salesforce Connected App) | Premium (custom connector) |
| Fuel Card Provider API (Custom Connector) | Transportation | API key or OAuth 2.0 | Premium (custom connector) |
| Telematics API (Custom Connector) | Transportation | API key or OAuth 2.0 | Premium (custom connector) |
| Fleet Management API (Custom Connector) | Transportation | OAuth 2.0 or API key | Premium (custom connector) |
| Fuel Price API (Custom Connector) | Transportation | API key | Premium (custom connector) |
| Mapping/Routing API (Custom Connector) | Transportation | API key | Premium (custom connector) |
| Claims Management System API (Custom Connector) | Insurance | OAuth 2.0 | Premium (custom connector) |
| HTTP (Generic) | All verticals (fallback/one-off) | API key, OAuth 2.0, Basic | Premium |
| AI Builder | Insurance, Clothing | AI Builder connection in environment | AI Builder credits |

## Standard Connectors

### Microsoft Teams

**What it does in agent context**
- Sends operational notifications from agent workflows.
- Delivers escalation payloads to support or operations channels.
- Posts channel alerts for time-sensitive events.

**Authentication**
- Delegated: actions run in the signed-in user context.
- Application/service account: uses shared connection or service mailbox/user for operational consistency.

**Key actions used**
- `PostMessageToChannel`
- `SendNotification`

**Rate limits and throttling**
- Subject to Microsoft Graph and Teams service throttling policies.
- Implement controlled retry with exponential backoff for burst scenarios.

**Setup steps**
1. Create/select a Teams connector connection in the target environment.
2. Decide identity model (delegated vs service account).
3. Grant required channel/team access to that identity.
4. Bind connector via solution-aware connection reference.
5. Validate posting behavior in lower environments before production cutover.

### SharePoint

**Used by**
- Coffee: primary knowledge backbone.
- All verticals: document storage and retrieval.

**Authentication**
- Delegated Microsoft Entra ID connection.

**Key actions**
- `GetItems`
- `CreateItem`
- `GetFileContent`
- `Search`

**Knowledge source integration**
SharePoint document libraries and sites are indexed and used as knowledge inputs for grounded responses. Content quality, metadata hygiene, and access permissions directly affect response quality.

**Managed properties and search schema configuration**
- Promote business-critical metadata to managed properties.
- Ensure refinable/searchable flags are set where needed.
- Use consistent content types and taxonomy for better retrieval precision.

**Rate limits**
- REST API planning target: 600 requests/minute.
- Batch where possible and avoid high-frequency polling patterns.

### Office 365 Outlook

**Used by**
- Coffee: shift handover emails.
- Insurance: escalation emails.
- Transportation: maintenance alerts.

**Key actions**
- `SendEmail`
- `SendEmailV2`

**Setup and delegated auth**
- Configure mailbox identity model (individual vs shared/service mailbox).
- Ensure mailbox send permissions are established.
- Use connection references so identity is consistent across environments.

### Microsoft Dataverse

**Used by**
- Clothing: primary data fabric.
- Insurance: claims records, fraud signals, SLA tracking.
- Transportation: fuel transactions, incident reports.
- Tech: prospect interaction logs.

**Key actions**
- `ListRows`
- `GetRow`
- `CreateRow`
- `UpdateRow`
- `DeleteRow`

**Connection behavior**
- Automatically available within the same Power Platform environment.

**Security roles and row-level security**
- Enforce least privilege through Dataverse security roles.
- Use business unit/team ownership and row-level access controls.
- Validate access paths for all service identities used by production flows.

**Performance considerations**
- Use pagination for large sets.
- Prefer selective queries with explicit column projection.
- Choose FetchXML for complex query semantics; OData for straightforward filtering/sorting.

### Azure Active Directory

**Used by**
- Tech: password reset workflows.
- All verticals: user identity and group membership lookup.

**Key actions**
- `GetUser`
- `GetGroupMembers`
- `InitiatePasswordReset`

**Permissions required**
- `User.Read`
- `GroupMember.Read.All`

### Power BI

**Used by**
- Clothing: primary analytics engine.

**Key actions**
- `ExecuteDAXQuery`
- `RefreshDataset`
- `GetReportEmbedUrl`

**Authentication**
- Service account (or service principal where supported) with minimum required workspace/report access.
- Viewer access is minimum for read/embed patterns; higher rights only where refresh/write operations require it.

**Row-level security pass-through**
- Ensure identity propagation strategy is explicit (effective identity, service identity, or hybrid model).

**Rate limits**
- Planning baseline: 120 requests/hour per user context (validate against tenant-specific limits).

## Custom Connectors

### Salesforce CRM (Tech vertical)

**Purpose**
Lead, Opportunity, Account, Contact, Task, and Event lifecycle operations.

**Authentication**
OAuth 2.0 via Salesforce Connected App.

**Key actions**
- `GetLead`
- `CreateLead`
- `GetOpportunity`
- `UpdateOpportunityStage`
- `SearchContacts`
- `GetActivities`

**Setup**
1. Create Salesforce Connected App.
2. Configure OAuth scopes: `api`, `refresh_token`.
3. Configure callback URL for Power Platform custom connector.
4. Import OpenAPI definition and test operations.

**Rate limits**
- Governed by Salesforce org edition and API allocation.

**Error handling**
- Enable token refresh handling.
- Apply exponential backoff for 429/limit responses.

### Fuel Card Provider API (Transportation vertical)

**Purpose**
Fuel transaction ingestion, card state management, and merchant-level analysis.

**Providers**
WEX, Comdata, FLEETCOR.

**Authentication**
API key or OAuth 2.0.

**Key actions**
- `GetTransactions`
- `GetCardDetails`
- `GetMerchantInfo`
- `SuspendCard`

**Setup**
- Complete vendor API onboarding.
- Provision keys/secrets.
- Configure source IP allowlisting where required.

**Data format**
Typical transaction payload includes latitude/longitude, gallons, unit price, merchant, and timestamp.

### Telematics API (Transportation vertical)

**Purpose**
Vehicle telemetry acquisition: position, fuel sensors, engine utilization, and driver hours-of-service.

**Authentication**
API key or OAuth 2.0.

**Key actions**
- `GetVehiclePosition`
- `GetFuelLevel`
- `GetEngineHours`
- `GetDriverHOS`

**Common providers**
Samsara, Geotab, Omnitracs.

### Fleet Management API (Transportation vertical)

**Purpose**
Vehicle scheduling, compliance state retrieval, and maintenance workflow integration.

**Authentication**
OAuth 2.0 or API key.

**Key actions**
- `GetVehicleAvailability`
- `GetComplianceStatus`
- `LogMaintenanceAlert`

### Fuel Price API (Transportation vertical)

**Purpose**
Location-aware fuel price retrieval for route and cost optimization.

**Providers**
GasBuddy API, OPIS.

**Authentication**
API key.

**Key actions**
- `GetPricesByLocation`
- `GetPricesByRoute`

### Mapping/Routing API (Transportation vertical)

**Purpose**
Route computation, traffic analysis, and ETA calculation.

**Providers**
Azure Maps, Google Maps Platform, HERE.

**Authentication**
API key.

**Key actions**
- `GetRoute`
- `GetTrafficFlow`
- `CalculateETA`

### Claims Management System API (Insurance vertical)

**Purpose**
Policy and claims operations including reserve updates and payment history.

**Providers**
Guidewire ClaimCenter, Duck Creek Claims.

**Authentication**
OAuth 2.0.

**Key actions**
- `GetPolicy`
- `CreateClaim`
- `GetClaimStatus`
- `UpdateReserve`
- `GetPaymentHistory`

**Setup**
- Configure claims platform/API gateway integration.
- Establish credential and secret lifecycle process.
- Validate schema mapping for policy, claimant, and reserve entities.

## HTTP Connector (Generic)

**When to use**
Use HTTP for APIs without a dedicated connector, rapid prototyping, or low-reuse one-off integrations.

**Authentication options**
- API key in header/query
- OAuth 2.0 (authorization code, client credentials)
- Basic authentication

**Best practices**
- Prefer custom connectors when integration will be reused.
- Standardize request/response contracts with explicit schemas.
- Externalize secrets into environment variables/secret stores.

**Error handling patterns**
- Configure retry policies for transient failures.
- Add dead-letter logging path for hard failures.
- Capture correlation IDs and response bodies for diagnostics.

## AI Builder

**Used by**
- Insurance: document OCR for police reports and estimate intake.
- Clothing: demand forecasting scenarios.

**Model types**
- Document Processing
- Prediction
- Category Classification

**Integration pattern**
Use AI Builder actions inside Power Automate cloud flows and map outputs into agent topics or Dataverse records.

**Licensing**
AI Builder credits are allocated per environment and must be capacity-planned before production scale-out.

## Connector Governance

- **DLP policies**: classify connectors as Business, Non-Business, or Blocked and enforce environment policy boundaries.
- **Connection references**: always use solution-aware connection references for deployable ALM.
- **Service accounts**: production flows should run on dedicated service identities, not personal user identities.
- **Credential rotation**: maintain periodic API key/client secret rotation with change windows and validation checks.
- **Monitoring**: use Power Platform Admin Center connector usage analytics and flow run telemetry for proactive control.

### Governance Configuration Example (ALM)

```yaml
environmentVariables:
  - name: EV_SALESFORCE_BASE_URL
    type: string
  - name: EV_FUEL_API_KEY
    type: secret
  - name: EV_CLAIMS_CLIENT_ID
    type: string
connectionReferences:
  - name: cr_dataverse_prod
    connector: shared_commondataserviceforapps
  - name: cr_sharepoint_prod
    connector: shared_sharepointonline
  - name: cr_custom_salesforce
    connector: custom_salesforcecrm
```

## Troubleshooting

| Issue | Likely Cause | Diagnostic Steps | Remediation |
|---|---|---|---|
| Authentication failures (401/403) | Expired secret, missing consent, wrong scope/role | Validate connector connection health, check app permissions and token claims | Re-consent app, rotate secret, align scopes/roles |
| Rate limiting (429) | Burst traffic or quota exceeded | Inspect run history for retry-after headers and call volume | Apply exponential backoff, reduce concurrency, cache frequent reads |
| Timeout errors | Slow downstream API, oversized payload, synchronous chaining | Measure action duration in run history, isolate slow action | Increase timeout where possible, paginate, split into child flows |
| Data type mismatches | Schema drift or incorrect field mapping | Compare runtime payload with connector/OpenAPI schema | Add explicit parse/transform steps, update schema and mapping |
| Pagination gaps | Not enabling pagination or incorrect continuation handling | Validate row counts vs source system totals | Enable pagination settings, implement continuation token loop |
| Search misses in SharePoint knowledge | Metadata/search schema misconfiguration | Validate crawled properties, managed property mapping, permissions | Fix schema mapping, normalize metadata, reindex content |
| Dataverse query slowness | Non-selective filters and wide column projection | Inspect query structure and returned payload size | Use indexed filters, select minimal columns, optimize FetchXML/OData |

### Retry Pattern Example (Pseudo-Flow Logic)

```text
Try API Action
If StatusCode in [429, 502, 503, 504]:
  Wait (2^attempt seconds, capped)
  Retry up to N attempts
Else If StatusCode >= 400:
  Log to dead-letter store (request, response, correlationId)
  Notify operations channel
Else:
  Continue processing
```

### Connector Design Checklist

| Control | Requirement |
|---|---|
| Identity model | Document delegated vs service-account execution per flow |
| Least privilege | Limit connector and API permissions to minimum required |
| ALM readiness | Use solution-aware connection references and environment variables |
| Resilience | Implement retries, timeout strategy, and dead-letter handling |
| Observability | Log correlation IDs, status codes, latency, and failure categories |
| Throughput planning | Validate quotas, throttling limits, and expected peak load |
