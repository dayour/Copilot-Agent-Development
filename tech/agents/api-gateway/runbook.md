# Runbook — API Gateway (Tech)

## Overview

This runbook covers the end-to-end deployment, configuration, and ongoing operations of the API Gateway agent for the Tech vertical. The agent provides guided assistance for operators managing the Azure API Management (APIM) layer that secures external web chat integrations with Power Automate and Salesforce backends.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Azure subscription | Contributor or API Management Service Contributor role |
| Azure API Management | Consumption, Developer, or Standard tier instance |
| Azure Front Door | Premium tier (required for WAF integration) |
| Log Analytics workspace | For APIM diagnostic logs and security audit |
| Microsoft 365 licence | Teams + Power Platform included |
| Copilot Studio licence | Per-tenant or per-user |
| Power Automate | For alert and monitoring notification flows |
| Azure AD | For managed identity and operator authentication |
| Dataverse environment | To store conversation and configuration logs |

---

## Deployment Steps

### 1. Provision the Azure API Management Instance

1. In the Azure portal, navigate to **Create a resource** → **API Management**.
2. Select your subscription, resource group, and region.
3. Set the pricing tier to **Standard** or higher for production workloads.
4. Enable **System-assigned managed identity** for internal agent authentication.
5. Record the **Gateway URL** — you will need it for the `ApimGatewayUrl` environment variable.

### 2. Configure Rate Limiting Policies

1. In the APIM instance, open **APIs** → select the target API → **All operations** → **Inbound processing** → **Add policy**.
2. Add the `rate-limit-by-key` policy for per-IP throttling:

   ```xml
   <rate-limit-by-key calls="100" renewal-period="60"
       counter-key="@(context.Request.IpAddress)" />
   ```

3. Add a second `rate-limit-by-key` entry for per-session throttling using the subscription key:

   ```xml
   <rate-limit-by-key calls="200" renewal-period="60"
       counter-key="@(context.Subscription.Id)" />
   ```

4. Save and deploy the policy.

### 3. Configure Request Validation

1. Upload your OpenAPI or JSON Schema definition to **APIs** → **Design** → **Frontend**.
2. In the inbound policy section, add the `validate-content` policy:

   ```xml
   <validate-content unspecified-content-type-action="prevent"
       max-size="102400" size-exceeded-action="prevent">
     <content type="application/json" validate-as="json"
         action="prevent" schema-id="WebChatRequestSchema" />
   </validate-content>
   ```

3. Upload the request schema under **APIs** → **Schemas**.
4. Test with a malformed request to confirm the policy returns HTTP 400.

### 4. Configure API Keys and Subscription Management

1. In APIM, navigate to **Products** → **Add product** for the web chat consumer group.
2. Enable **Requires subscription** and set approval to **Manual** for production.
3. Create a subscription for the web chat application under **Subscriptions** → **Add subscription**.
4. Store the primary key in Azure Key Vault and reference it from the web chat configuration.
5. For the internal agent, assign the APIM instance's system-assigned managed identity the **API Management Service Reader** role on the backend resources.
6. Map the managed identity in the backend policy:

   ```xml
   <authentication-managed-identity resource="https://management.azure.com/" />
   ```

### 5. Configure Logging and Monitoring

1. In the APIM instance, go to **Diagnostics logs** → **Add diagnostic setting**.
2. Enable **GatewayLogs** and **Metrics** and direct them to your Log Analytics workspace.
3. Record the **Log Analytics Workspace ID** for the `LogAnalyticsWorkspaceId` environment variable.
4. In Azure Monitor, create the following alert rules:
   - **High error rate** — alert when 5xx responses exceed 5% over 5 minutes.
   - **Quota exceeded** — alert on `RateLimit` policy rejections exceeding 50 per minute.
   - **Latency spike** — alert when p95 backend latency exceeds 3 seconds.
5. Configure action groups to notify the platform engineering team via email and Teams.

### 6. Configure CORS

1. In the APIM inbound policy for the web chat API, add the `cors` policy:

   ```xml
   <cors allow-credentials="true">
     <allowed-origins>
       <origin>${AllowedCorsOrigins}</origin>
     </allowed-origins>
     <allowed-methods>
       <method>GET</method>
       <method>POST</method>
       <method>OPTIONS</method>
     </allowed-methods>
     <allowed-headers>
       <header>Content-Type</header>
       <header>Authorization</header>
       <header>Ocp-Apim-Subscription-Key</header>
     </allowed-headers>
   </cors>
   ```

2. Replace `${AllowedCorsOrigins}` with your approved company domain(s).
3. Test a preflight OPTIONS request from the web chat origin to confirm a 200 response with the correct headers.

### 7. Configure Azure Front Door with WAF

1. In the Azure portal, create an **Azure Front Door** (Premium tier) resource.
2. Add an **Origin group** pointing to the APIM gateway URL.
3. Under **Security** → **WAF policies**, create a new WAF policy in **Prevention** mode.
4. Enable the following managed rule sets:
   - **Microsoft_DefaultRuleSet** (latest version) for OWASP coverage.
   - **Microsoft_BotManagerRuleSet** for bot and DDoS protection.
5. Add a custom rule to block requests from countries outside your operating regions if applicable.
6. Associate the WAF policy with the Front Door endpoint.
7. Update the `FrontDoorEndpointUrl` environment variable with the assigned Front Door hostname.
8. Restrict APIM's built-in firewall to accept traffic only from Azure Front Door service tags.

### 8. Import and Configure the Copilot Studio Solution

1. Navigate to [https://copilotstudio.microsoft.com](https://copilotstudio.microsoft.com).
2. Select or create the target Dataverse environment.
3. Go to **Solutions** → **Import solution** and upload `solution/solution-definition.yaml`.
4. Map environment variables:
   - `ApimGatewayUrl` — APIM gateway base URL
   - `ApimResourceId` — Azure resource ID of the APIM instance
   - `FrontDoorEndpointUrl` — Azure Front Door hostname
   - `LogAnalyticsWorkspaceId` — Log Analytics workspace resource ID
   - `AllowedCorsOrigins` — comma-separated list of approved website domains
   - `ApimSubscriptionKeyVaultUri` — Azure Key Vault URI for the web chat subscription key
   - `AlertActionGroupId` — Azure resource ID of the Monitor action group for notifications
5. Complete the import and verify all components show **Healthy**.

---

## Post-Deployment Validation

- [ ] APIM gateway URL returns HTTP 200 for a valid authenticated request
- [ ] Rate limiting policy returns HTTP 429 after exceeding the configured threshold
- [ ] Invalid JSON body returns HTTP 400 from the request validation policy
- [ ] Web chat subscription key authenticates successfully
- [ ] Internal agent managed identity can invoke the backend without a subscription key
- [ ] APIM diagnostic logs appear in Log Analytics within 5 minutes of a test request
- [ ] CORS preflight OPTIONS request returns 200 with correct `Access-Control-Allow-Origin` header
- [ ] Request from a non-allowed origin is blocked with HTTP 403
- [ ] Azure Front Door WAF blocks a simulated SQL injection request
- [ ] Azure Monitor alerts fire correctly when thresholds are breached

---

## Monitoring and Operations

| Task | Frequency | Owner |
|------|-----------|-------|
| Review APIM error rate and latency dashboards | Daily | Platform Engineer |
| Rotate web chat subscription keys | Quarterly | Security Operator |
| Review WAF rule hit reports | Weekly | Security Operator |
| Review Log Analytics query for anomalous IP patterns | Weekly | Security Operator |
| Update CORS allowed origins when domains change | On change | Platform Engineer |
| Review and apply APIM and WAF managed rule set updates | Monthly | Platform Engineer |
| Audit API subscriptions for unused or expired keys | Quarterly | API Developer |

---

## Escalation Matrix

| Issue | First Contact | Escalation |
|-------|--------------|------------|
| APIM gateway unavailable | Platform Engineer | Azure Support |
| WAF false positive blocking valid traffic | Security Operator | Platform Engineer |
| Subscription key compromised | Security Operator | Security Lead |
| Log Analytics ingestion gap | Platform Engineer | Azure Support |
| CORS misconfiguration causing web chat failure | Platform Engineer | Web Application Team |

---

## Rollback Procedure

1. In the Azure portal, revert the APIM policy to the previous version using **Policy** → **Revision history**.
2. If the Front Door WAF change caused the issue, switch the WAF policy to **Detection** mode while investigating.
3. In Copilot Studio, navigate to **Solutions** and unpublish the agent.
4. Restore the previous solution version from source control and re-import.
5. Notify the platform engineering team of the reversion and open a post-incident review.
