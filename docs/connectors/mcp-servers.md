# MCP Server Ecosystem and Integration Guide

## Overview

Model Context Protocol (MCP) is an open standard that enables Copilot Studio agents and other LLM-based systems to call external tools and data sources through a uniform interface. Each MCP server exposes a named set of tools with structured input/output schemas. The LLM selects tools based on name and description at runtime, making tool description quality the primary factor in correct routing.

MCP is an actively evolving specification. Server availability, tool schemas, and Copilot Studio integration mechanics may change as the standard matures. Always refer to the official MCP specification at modelcontextprotocol.io and the Copilot Studio release notes for the latest integration requirements before deploying to production.

This document covers the MCP servers relevant to Copilot Studio and Power Platform, per-server integration guides, and a decision framework for choosing between MCP, custom connectors, and Power Automate flows.

## MCP Server Inventory

### Microsoft Official

| Server | Domain | Status | Integration |
|--------|--------|--------|-------------|
| Dataverse MCP | CRM/ERP data | GA | Native in Copilot Studio |
| SharePoint MCP | Document management | Preview | Knowledge + actions |
| Graph MCP | M365 workloads | Preview | User context |
| Azure MCP | Cloud resources | Preview | Infrastructure operations |
| Playwright MCP | Browser automation | GA | Testing and scraping |

### Community and Third-Party

| Server | Domain | Primary Use Case |
|--------|--------|------------------|
| GitHub MCP | Code repositories | Agent-assisted development |
| Slack MCP | Messaging | Cross-platform notifications |
| Database MCP | SQL and NoSQL | Direct data access |
| Web Search MCP | Internet search | Real-time information retrieval |

### Custom MCP Servers

Custom MCP servers are appropriate when a proprietary or internal API has no existing MCP implementation. See the [Custom MCP Server Development](#custom-mcp-server-development) section for SDK options, tool definition guidance, and testing methodology.

---

## Microsoft Official Servers

### Dataverse MCP

**Domain**: CRM and ERP data  
**Status**: Generally Available  
**Integration**: Native in Copilot Studio

**Tool inventory**

| Tool | Description |
|------|-------------|
| `query_rows` | Filter, sort, and project rows from any Dataverse table. |
| `get_row` | Retrieve a single row by primary key. |
| `create_row` | Insert a new row into a Dataverse table. |
| `update_row` | Patch one or more columns on an existing row. |
| `delete_row` | Remove a row by primary key. |
| `execute_action` | Invoke a Dataverse custom action or bound action. |
| `list_tables` | Enumerate available tables and their display metadata. |

**Authentication**

Dataverse MCP uses the Power Platform environment-native connection. The Copilot Studio agent runs under the signed-in user identity or a configured service principal. No additional credential provisioning is required for connections within the same environment.

**Registration in Copilot Studio**

1. Open your agent in Copilot Studio.
2. Navigate to Settings > Connections > MCP Servers.
3. Select Add server > Microsoft Dataverse.
4. Choose the target environment. The server registers automatically and tool definitions are loaded.
5. In each topic where Dataverse access is needed, enable the relevant tools under the topic's tool selection panel.

**Rate limits and quotas**

- Subject to Power Platform API limits: 6,000 requests per 5 minutes per user for the Dataverse connector tier.
- Batch reads using `query_rows` pagination rather than repeated single `get_row` calls to reduce request count.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | Connection expired or insufficient role | Re-authenticate; verify Dataverse security role on service identity |
| 403 Forbidden | Row-level security restriction | Check business unit ownership and team membership |
| 429 Too Many Requests | API limit exceeded | Implement exponential backoff; cache frequent reads |
| 404 Not Found | Row or table does not exist | Validate table name and primary key before calling |

**Example agent topic**

```yaml
topic:
  name: LookupClaimStatus
  triggerPhrases:
    - "what is the status of my claim"
    - "check claim status"
    - "where is my claim at"
    - "claim status update"
  description: >
    Retrieve the current status and summary of a Dataverse claim record for the
    authenticated user. Use this topic when the user asks about their claim
    progress, status, or next steps.
  nodes:
    - type: question
      prompt: "Please provide your claim number."
      outputVariable: ClaimNumber
    - type: mcpToolCall
      server: dataverse
      tool: query_rows
      inputs:
        table: cr_claims
        filter: "cr_claimnumber eq '{ClaimNumber}'"
        select: cr_claimnumber,cr_status,cr_lastupdated,cr_adjustername
      outputVariable: ClaimResult
    - type: condition
      expression: "ClaimResult.value.length > 0"
      ifTrue:
        - type: message
          text: "Claim {ClaimNumber} is currently {ClaimResult.value[0].cr_status}. Last updated: {ClaimResult.value[0].cr_lastupdated}."
      ifFalse:
        - type: message
          text: "No claim found for number {ClaimNumber}. Please verify the number and try again."
```

---

### SharePoint MCP

**Domain**: Document management  
**Status**: Preview  
**Integration**: Knowledge grounding and write-back actions

**Tool inventory**

| Tool | Description |
|------|-------------|
| `search_content` | Full-text and metadata search across SharePoint sites and libraries. |
| `get_file` | Retrieve file content by site URL and file path. |
| `list_items` | Enumerate list items with optional OData filter. |
| `create_item` | Create a new list item. |
| `update_item` | Update fields on an existing list item. |
| `get_site_metadata` | Retrieve site display name, URL, and managed property schema. |

**Authentication**

Delegated Microsoft Entra ID connection. The agent runs actions in the context of the authenticated user. Ensure the user or service account has at minimum Read access to targeted libraries and Contribute access where write-back is required.

**Registration in Copilot Studio**

1. Navigate to Settings > Connections > MCP Servers.
2. Select Add server > Microsoft SharePoint.
3. Authorize the Entra ID connection using an account with appropriate site permissions.
4. Specify the site collection scope if access should be restricted to specific sites.
5. Test the `search_content` tool from the test panel to validate indexing coverage.

**Knowledge source integration**

SharePoint MCP complements the static knowledge source configuration. Use the static configuration for well-structured reference content and the MCP `search_content` tool for dynamic or user-parameterized document retrieval. Ensure consistent content types and managed property mappings to maximize retrieval precision.

**Rate limits and quotas**

- SharePoint REST API planning target: 600 requests per minute.
- Avoid high-frequency polling patterns; prefer event-driven triggers via Power Automate for write-back workflows.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | Expired or missing Entra ID token | Re-consent connector connection in Power Platform Admin Center |
| 403 Forbidden | Insufficient site or library permissions | Grant Read or Contribute at the appropriate scope |
| 404 Not Found | Site URL or file path does not exist | Validate site URL and file path before calling |
| 429 Too Many Requests | Throttling from SharePoint service | Apply exponential backoff; reduce request concurrency |

**Example agent topic**

```yaml
topic:
  name: FindPolicyDocument
  triggerPhrases:
    - "find the policy document"
    - "search for a policy"
    - "where is the HR policy"
    - "look up policy"
  description: >
    Search SharePoint for a specific policy document and return a summary and
    link. Use when the user is looking for a named policy, procedure, or
    guideline document.
  nodes:
    - type: question
      prompt: "What policy document are you looking for?"
      outputVariable: PolicyQuery
    - type: mcpToolCall
      server: sharepoint
      tool: search_content
      inputs:
        query: "{PolicyQuery}"
        rowLimit: 3
        selectProperties: Title,Path,LastModifiedTime,Author
      outputVariable: SearchResults
    - type: condition
      expression: "SearchResults.PrimaryQueryResult.RelevantResults.TotalRows > 0"
      ifTrue:
        - type: message
          text: >
            Found {SearchResults.PrimaryQueryResult.RelevantResults.TotalRows} result(s).
            Top result: {SearchResults.PrimaryQueryResult.RelevantResults.Table.Rows[0].Cells[0].Value}
            Link: {SearchResults.PrimaryQueryResult.RelevantResults.Table.Rows[0].Cells[1].Value}
      ifFalse:
        - type: message
          text: "No documents found matching '{PolicyQuery}'. Please refine your search terms."
```

---

### Graph MCP

**Domain**: Microsoft 365 workloads  
**Status**: Preview  
**Integration**: User context, calendar, email, and Teams data

**Tool inventory**

| Tool | Description |
|------|-------------|
| `get_user` | Retrieve profile, department, and manager details for a user. |
| `get_group_members` | List members of an Entra ID group or Teams team. |
| `list_calendar_events` | Retrieve calendar events for a user within a time range. |
| `send_mail` | Send an email on behalf of the authenticated user or shared mailbox. |
| `get_teams_channel_messages` | Retrieve recent messages from a Teams channel. |
| `post_teams_channel_message` | Post a message to a Teams channel. |
| `list_onedrive_files` | Enumerate files in a OneDrive folder. |

**Authentication**

Microsoft Entra ID with delegated or application permissions depending on the operation. Delegated permissions require user sign-in; application permissions require admin consent and are appropriate for service account patterns.

Required permissions by tool:

| Tool | Permission Scope |
|------|-----------------|
| `get_user` | `User.Read` or `User.Read.All` |
| `get_group_members` | `GroupMember.Read.All` |
| `list_calendar_events` | `Calendars.Read` |
| `send_mail` | `Mail.Send` |
| `get_teams_channel_messages` | `ChannelMessage.Read.All` |
| `post_teams_channel_message` | `ChannelMessage.Send` |
| `list_onedrive_files` | `Files.Read` or `Files.Read.All` |

**Registration in Copilot Studio**

1. Register an Entra ID app registration with the required permission scopes.
2. Grant admin consent in the Azure portal for application-permission scopes.
3. In Copilot Studio, navigate to Settings > Connections > MCP Servers.
4. Select Add server > Microsoft Graph.
5. Provide the client ID, tenant ID, and client secret or certificate reference.
6. Validate by calling `get_user` with a known user ID from the test panel.

**Rate limits and quotas**

- Subject to Microsoft Graph service-level throttling per resource type and tenant tier.
- Priority calls receive 10,000 requests per 10 minutes; standard calls are lower.
- Use delta queries and webhooks for high-frequency change detection instead of polling.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | Token expired or wrong audience | Refresh token; verify token audience matches Graph endpoint |
| 403 Forbidden | Missing consent or insufficient scope | Grant and re-consent required permission scope |
| 429 Too Many Requests | Service throttling | Respect Retry-After header; implement exponential backoff |
| 404 Not Found | User, group, or resource not found | Validate object ID; check soft-delete and recycle bin state |

**Example agent topic**

```yaml
topic:
  name: LookupUserManager
  triggerPhrases:
    - "who is my manager"
    - "find my manager"
    - "who do I report to"
    - "look up reporting line"
  description: >
    Look up the manager of the current authenticated user using Microsoft Graph.
    Use when the user wants to know who their manager is or who to escalate to.
  nodes:
    - type: mcpToolCall
      server: graph
      tool: get_user
      inputs:
        userId: "{System.User.Id}"
        select: displayName,mail,department,manager
      outputVariable: UserProfile
    - type: message
      text: >
        Your manager is {UserProfile.manager.displayName}
        ({UserProfile.manager.mail}).
```

---

### Azure MCP

**Domain**: Azure cloud resources  
**Status**: Preview  
**Integration**: Infrastructure operations and diagnostics

**Tool inventory**

| Tool | Description |
|------|-------------|
| `list_resources` | List Azure resources by subscription, resource group, or type. |
| `get_resource` | Retrieve configuration and state for a specific resource. |
| `get_resource_metrics` | Pull Azure Monitor metrics for a resource. |
| `run_cli_command` | Execute a scoped Azure CLI command (read-only by default). |
| `list_subscriptions` | Enumerate Azure subscriptions accessible to the identity. |
| `get_cost_summary` | Retrieve Azure Cost Management summary for a scope. |

**Authentication**

Azure Managed Identity or service principal with role-based access control (RBAC). Apply the principle of least privilege: Reader role for diagnostic and listing operations; Contributor only where write actions are explicitly required.

**Registration in Copilot Studio**

1. Create or select a Managed Identity or service principal in Azure.
2. Assign the Reader role (or narrower custom role) at the target subscription or resource group scope.
3. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Azure.
4. Provide the tenant ID and client credential reference (stored in an environment variable of type secret).
5. Restrict the subscription and resource group scope in the server configuration to enforce least privilege.

**Rate limits and quotas**

- Azure Resource Manager throttling: 12,000 read requests per hour per subscription.
- Azure Monitor metrics: 12,000 requests per hour per subscription.
- Implement response caching for frequently read static configurations (resource SKU, region, tags).

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | Token expired or wrong tenant | Refresh Managed Identity token; verify tenant ID |
| 403 Forbidden | Insufficient RBAC role | Assign minimum required role at correct scope |
| 429 Too Many Requests | ARM throttling | Respect Retry-After header; reduce request concurrency |
| 404 Not Found | Resource does not exist or wrong subscription | Validate resource ID and subscription scope |

**Example agent topic**

```yaml
topic:
  name: GetVmStatus
  triggerPhrases:
    - "check the VM status"
    - "is the virtual machine running"
    - "what is the state of the server"
    - "VM health check"
  description: >
    Retrieve the power state and health of a specific Azure virtual machine.
    Use when an operator asks about whether a VM is running, stopped, or
    deallocated.
  nodes:
    - type: question
      prompt: "Please provide the resource group and VM name."
      outputVariable: VmReference
    - type: mcpToolCall
      server: azure
      tool: get_resource
      inputs:
        resourceId: "/subscriptions/{System.Env.AzureSubscriptionId}/resourceGroups/{VmReference.resourceGroup}/providers/Microsoft.Compute/virtualMachines/{VmReference.vmName}"
      outputVariable: VmResource
    - type: message
      text: >
        VM {VmReference.vmName} in {VmReference.resourceGroup}:
        Power state: {VmResource.properties.instanceView.statuses[1].displayStatus}.
```

---

### Playwright MCP

**Domain**: Browser automation  
**Status**: Generally Available  
**Integration**: Testing and web scraping

**Tool inventory**

| Tool | Description |
|------|-------------|
| `navigate` | Navigate the browser to a specified URL. |
| `click` | Click an element identified by CSS selector or accessible role. |
| `fill` | Type text into an input field. |
| `screenshot` | Capture a screenshot of the current page state. |
| `get_text` | Extract visible text content from a page or element. |
| `evaluate` | Execute JavaScript in the page context. |
| `wait_for_element` | Wait until an element matching a selector is present and visible. |

**Authentication**

The Playwright MCP server runs as a local or containerized process. For protected sites, inject credentials via `fill` actions or pre-seeded browser storage. Do not hard-code credentials in topic definitions; use environment variables.

**Registration in Copilot Studio**

1. Deploy the Playwright MCP server as a containerized service (see the official Microsoft Playwright MCP repository for the Docker image reference).
2. Expose the server endpoint over HTTPS with an API key or mutual TLS.
3. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Custom.
4. Provide the server endpoint URL and authentication header configuration.
5. Test using the `screenshot` tool to confirm browser connectivity.

**Rate limits and quotas**

- Limited by compute resources of the hosting environment.
- Each `navigate` + `get_text` round trip typically takes 1 to 5 seconds depending on page complexity.
- Run one browser instance per concurrent user session to avoid state collision.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| Timeout | Page did not load within the configured timeout | Increase timeout; check target site availability |
| Element not found | Selector does not match current page state | Use more robust selectors (ARIA role, test ID); add `wait_for_element` before `click` or `fill` |
| Navigation blocked | Target URL is blocked by DLP or network policy | Review DLP policies; use an allow-listed proxy for external URLs |
| Screenshot empty | Headless rendering issue | Verify browser binary is correctly installed in the container |

**Example agent topic**

```yaml
topic:
  name: CapturePublicPriceList
  triggerPhrases:
    - "get the current price list"
    - "scrape the pricing page"
    - "retrieve published prices"
    - "fetch current prices from the website"
  description: >
    Navigate to the product pricing page and extract the current published
    price list for use in quotation responses.
  nodes:
    - type: mcpToolCall
      server: playwright
      tool: navigate
      inputs:
        url: "{System.Env.PublicPricingPageUrl}"
    - type: mcpToolCall
      server: playwright
      tool: wait_for_element
      inputs:
        selector: "[data-testid='price-table']"
        timeout: 10000
    - type: mcpToolCall
      server: playwright
      tool: get_text
      inputs:
        selector: "[data-testid='price-table']"
      outputVariable: PriceTableText
    - type: message
      text: "Current prices: {PriceTableText}"
```

---

## Community and Third-Party Servers

### GitHub MCP

**Domain**: Code repositories  
**Primary use case**: Agent-assisted development, code review, issue triage

**Tool inventory**

| Tool | Description |
|------|-------------|
| `list_repositories` | List repositories accessible to the authenticated user or organization. |
| `get_file_contents` | Retrieve file content at a specified ref. |
| `create_or_update_file` | Commit a file change to a branch. |
| `list_issues` | List issues with label, state, and assignee filters. |
| `create_issue` | Open a new issue with title, body, and labels. |
| `list_pull_requests` | List open or closed pull requests. |
| `create_pull_request` | Open a pull request from a head branch to a base branch. |
| `search_code` | Search code across repositories using GitHub search syntax. |

**Authentication**

GitHub Personal Access Token (classic) or Fine-Grained Personal Access Token stored as an environment variable of type secret. For organization-owned repositories, use a GitHub App installation token for least-privilege access.

Required scopes for read-only operations: `repo:read`, `issues:read`.  
Required scopes for write operations: `repo`, `issues:write`, `pull_requests:write`.

**Registration in Copilot Studio**

1. Generate a GitHub token with the minimum required scopes.
2. Store the token in a Power Platform environment variable of type secret.
3. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Custom.
4. Enter the GitHub MCP server endpoint URL and configure the Authorization header to use the secret environment variable.
5. Test with `list_repositories` to confirm authentication.

**Rate limits and quotas**

- GitHub REST API: 5,000 requests per hour for authenticated requests.
- GitHub Search API: 30 requests per minute.
- GitHub Apps receive higher limits per installation.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | Invalid or expired token | Rotate token and update environment variable |
| 403 Forbidden | Insufficient token scope | Regenerate token with required scopes |
| 422 Unprocessable Entity | Invalid request body | Validate required fields (title, head, base) before calling |
| 429 Too Many Requests | Rate limit exceeded | Respect X-RateLimit-Reset header; implement backoff |

**Example agent topic**

```yaml
topic:
  name: FindOpenBugs
  triggerPhrases:
    - "show me open bugs"
    - "list unresolved issues"
    - "what bugs are open in the repo"
    - "find open defects"
  description: >
    Retrieve a list of open bug issues from the configured GitHub repository.
    Use when a developer or project manager asks about current open defects.
  nodes:
    - type: mcpToolCall
      server: github
      tool: list_issues
      inputs:
        owner: "{System.Env.GitHubOrgName}"
        repo: "{System.Env.GitHubRepoName}"
        state: open
        labels: bug
        perPage: 10
      outputVariable: OpenBugs
    - type: message
      text: >
        There are {OpenBugs.total_count} open bug(s). Most recent:
        {OpenBugs.items[0].title} ({OpenBugs.items[0].html_url})
```

---

### Slack MCP

**Domain**: Messaging  
**Primary use case**: Cross-platform notifications, channel message retrieval

**Tool inventory**

| Tool | Description |
|------|-------------|
| `post_message` | Post a message to a channel or direct message thread. |
| `list_channels` | List public and private channels the bot has access to. |
| `get_channel_history` | Retrieve recent messages from a channel. |
| `upload_file` | Upload a file and share it to a channel. |
| `set_topic` | Update the topic of a channel. |

**Authentication**

Slack Bot Token (`xoxb-...`) with required OAuth scopes granted to the Slack app. Store the bot token as an environment variable of type secret. For workspace-wide access, use a Slack App-level token with socket mode or event subscriptions.

Required scopes: `chat:write`, `channels:read`, `channels:history`, `files:write`.

**Registration in Copilot Studio**

1. Create a Slack app in the Slack API portal.
2. Add the required OAuth permission scopes to the bot token.
3. Install the app to the target workspace and retrieve the bot token.
4. Store the bot token in a Power Platform environment variable of type secret.
5. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Custom.
6. Configure the server endpoint and Bearer token header using the secret environment variable.

**Rate limits and quotas**

- Slack Web API Tier 3 methods: 50 requests per minute.
- Tier 4 methods (e.g., `chat.postMessage`): 1 request per second.
- Burst requests are queued; sustained overload returns HTTP 429.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| `not_in_channel` | Bot is not a member of the target channel | Invite the bot to the channel; check channel visibility settings |
| `channel_not_found` | Channel ID or name is incorrect | Verify channel ID using `list_channels` |
| `invalid_auth` | Bot token is expired or revoked | Rotate the Slack app token |
| HTTP 429 | Rate limit | Respect Retry-After header; use message queuing for high-volume notifications |

**Example agent topic**

```yaml
topic:
  name: PostMaintenanceAlert
  triggerPhrases:
    - "send a maintenance alert to Slack"
    - "notify the ops channel"
    - "post a maintenance notice"
    - "alert Slack about downtime"
  description: >
    Post a maintenance notification to the designated Slack operations channel.
    Use when a system alert or planned downtime needs to be communicated to the
    operations team via Slack.
  nodes:
    - type: question
      prompt: "What is the maintenance message?"
      outputVariable: MaintenanceMessage
    - type: mcpToolCall
      server: slack
      tool: post_message
      inputs:
        channel: "{System.Env.SlackOpsChannelId}"
        text: "[MAINTENANCE] {MaintenanceMessage}"
      outputVariable: SlackPostResult
    - type: message
      text: "Maintenance alert posted to Slack (message ID: {SlackPostResult.ts})."
```

---

### Database MCP

**Domain**: SQL and NoSQL data stores  
**Primary use case**: Direct read/write access to relational and document databases

**Tool inventory**

| Tool | Description |
|------|-------------|
| `execute_query` | Execute a parameterized read query and return rows. |
| `execute_statement` | Execute a parameterized write statement (INSERT, UPDATE, DELETE). |
| `list_tables` | List tables or collections in the connected database. |
| `describe_table` | Retrieve column definitions and types for a table. |
| `call_stored_procedure` | Invoke a named stored procedure with parameters. |

**Authentication**

Connection string stored as an environment variable of type secret. Support for username/password, managed identity, and certificate-based authentication depending on the database provider. Never include connection strings directly in topic definitions or solution manifests.

**Registration in Copilot Studio**

1. Provision the Database MCP server as a containerized or managed service with access to the target database.
2. Configure the connection string as a deployment-time environment variable.
3. Restrict network access: the MCP server should be the only path to the database; do not expose database ports publicly.
4. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Custom.
5. Provide the server endpoint and API key or mutual TLS configuration.

**Security considerations**

- Use parameterized queries in all tool calls; never interpolate user input directly into SQL strings.
- Grant the database user account only SELECT, INSERT, UPDATE privileges on required tables. Do not grant DDL or admin rights.
- Enable query logging and auditing at the database level.
- Rotate connection credentials on the standard credential rotation schedule.

**Rate limits and quotas**

- Governed by the target database's connection pool size and query concurrency limits.
- Implement connection pool sizing appropriate for expected concurrent agent sessions.
- Use read replicas for read-heavy workloads to preserve primary capacity.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| Connection timeout | Database unreachable or pool exhausted | Check network connectivity; increase pool size or use read replica |
| Query timeout | Complex query exceeded timeout limit | Add indexes; simplify query; increase timeout for known long-running operations |
| Constraint violation | Duplicate key or foreign key violation | Validate uniqueness before insert; handle conflict in response logic |
| Authentication failure | Credentials expired or incorrect | Rotate credentials; update environment variable |

**Example agent topic**

```yaml
topic:
  name: QueryOrderHistory
  triggerPhrases:
    - "show my order history"
    - "look up past orders"
    - "what orders have I placed"
    - "retrieve order records"
  description: >
    Query the orders database for the authenticated user's recent order history.
    Use when a customer asks about previous purchases or order status.
  nodes:
    - type: mcpToolCall
      server: database
      tool: execute_query
      inputs:
        query: "SELECT order_id, order_date, total_amount, status FROM orders WHERE customer_id = @customerId ORDER BY order_date DESC LIMIT 5"
        parameters:
          customerId: "{System.User.Id}"
      outputVariable: OrderHistory
    - type: message
      text: >
        Your most recent {OrderHistory.rows.length} order(s):
        {OrderHistory.rows[0].order_id} placed {OrderHistory.rows[0].order_date}
        for {OrderHistory.rows[0].total_amount} -- Status: {OrderHistory.rows[0].status}.
```

---

### Web Search MCP

**Domain**: Internet search  
**Primary use case**: Real-time information retrieval beyond the agent's knowledge cutoff

**Tool inventory**

| Tool | Description |
|------|-------------|
| `search` | Execute a web search query and return ranked results with titles, URLs, and snippets. |
| `get_page_content` | Fetch and parse the main text content of a specific URL. |
| `news_search` | Search recent news articles with an optional date range filter. |

**Authentication**

API key from the chosen search provider (Bing Search API, Brave Search API, or similar). Store the API key as an environment variable of type secret.

**Registration in Copilot Studio**

1. Subscribe to a web search API (Bing Search v7, Brave Search, or equivalent).
2. Store the API key as a Power Platform environment variable of type secret.
3. In Copilot Studio, navigate to Settings > Connections > MCP Servers > Add server > Custom.
4. Enter the Web Search MCP server endpoint URL and configure the API key header.
5. Test using the `search` tool with a known query from the test panel.

**Content safety and DLP**

- Configure a URL allow/block list in the MCP server to prevent retrieval from disallowed domains.
- Do not expose raw search results directly to external users without review; use the agent to summarize and cite sources.
- Apply Power Platform DLP policies to classify the web search connector as Business data.

**Rate limits and quotas**

- Bing Search API: varies by tier (Free tier: 3 requests per second; S1 and above: higher limits).
- Brave Search API: varies by subscription.
- Cache repeat queries with identical terms within a session to reduce API consumption.

**Error handling patterns**

| Error | Cause | Remediation |
|-------|-------|-------------|
| 401 Unauthorized | API key invalid or missing | Rotate API key and update environment variable |
| 403 Forbidden | Subscription quota exhausted or tier restriction | Upgrade subscription tier or implement request caching |
| 429 Too Many Requests | Rate limit exceeded | Implement exponential backoff; cache repeated queries |
| Empty results | No results for query | Broaden query terms; notify user and suggest alternative phrasing |

**Example agent topic**

```yaml
topic:
  name: SearchRecentNews
  triggerPhrases:
    - "search for news about"
    - "what is the latest news on"
    - "find recent articles about"
    - "look up current news"
  description: >
    Search the web for recent news articles on a user-specified topic and
    summarize the top results. Use when the user asks about current events,
    recent developments, or news that may be beyond the agent's built-in
    knowledge.
  nodes:
    - type: question
      prompt: "What topic would you like news about?"
      outputVariable: NewsQuery
    - type: mcpToolCall
      server: websearch
      tool: news_search
      inputs:
        query: "{NewsQuery}"
        count: 5
        freshness: Week
      outputVariable: NewsResults
    - type: message
      text: >
        Top news for "{NewsQuery}":
        1. {NewsResults.value[0].name} -- {NewsResults.value[0].url}
        2. {NewsResults.value[1].name} -- {NewsResults.value[1].url}
        3. {NewsResults.value[2].name} -- {NewsResults.value[2].url}
```

---

## Custom MCP Server Development

### When to Build a Custom Server

Build a custom MCP server when:

- A proprietary or internal API has no existing MCP implementation.
- You need precise tool definitions optimized for LLM routing quality.
- Multiple agents across verticals will reuse the same API surface.
- Security, compliance, or data residency requirements prevent use of third-party MCP services.

### SDK Options

| SDK | Language | Recommended When |
|-----|----------|-----------------|
| `@modelcontextprotocol/sdk` | TypeScript | Node.js services; browser-compatible scenarios |
| `mcp` (PyPI) | Python | Data science integrations; Azure Functions; Lambda |
| `ModelContextProtocol` (NuGet) | C# | .NET workloads; Azure App Service; Power Platform extensions |

### Tool Definition Best Practices

Good tool definitions are the primary driver of correct LLM routing. Apply these principles:

1. **Name tools with verb-noun patterns.** Examples: `get_invoice`, `create_support_ticket`, `search_products`. Avoid generic names like `call_api` or `do_thing`.

2. **Write description sentences that include the business context.** The description is the primary routing signal. Compare:
   - Poor: "Returns data about an order."
   - Good: "Retrieve the full order details including line items, shipping address, and payment status for a given order ID. Use when the user asks about a specific order they have placed."

3. **Use precise input schemas.** Define required versus optional parameters explicitly. Include description fields on every parameter.

4. **Return structured output.** Define a JSON schema for the output so the agent can reliably extract fields without parsing free text.

5. **Expose minimum necessary tools.** Each additional tool increases LLM context usage and routing ambiguity. Group related operations and avoid exposing administrative or destructive operations unless the agent requires them.

### Minimal TypeScript Custom Server Example

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "inventory-server",
  version: "1.0.0",
});

server.tool(
  "get_inventory_level",
  {
    sku: z.string().describe("The product SKU to look up."),
    warehouseId: z.string().optional().describe("Optional warehouse ID to scope the lookup."),
  },
  async ({ sku, warehouseId }) => {
    // Call internal inventory API
    const level = await fetchInventoryLevel(sku, warehouseId);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            sku,
            warehouseId: warehouseId ?? "all",
            quantityOnHand: level.quantity,
            lastUpdated: level.timestamp,
          }),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Testing and Validation

| Stage | Method | Pass Criteria |
|-------|--------|---------------|
| Unit | Call each tool function directly with valid and invalid inputs | Correct output schema; informative error messages for invalid inputs |
| Integration | Run the MCP server locally and call tools via the MCP Inspector tool | All tools listed; each tool returns expected output for sample inputs |
| Routing | Register the server in a test Copilot Studio agent and use the test panel | Agent selects the correct tool for at least 90% of representative trigger phrases |
| Load | Send concurrent requests at expected peak volume | No degradation in response time; no unhandled exceptions |

### Deployment Considerations

- Host custom MCP servers as containerized services (Azure Container Apps or Azure Kubernetes Service) for scalability and lifecycle management.
- Use Azure Managed Identity for server-to-server authentication to downstream APIs where possible.
- Store all secrets (API keys, connection strings) in Azure Key Vault and reference them via Managed Identity; do not inject secrets as plain environment variables in container definitions.
- Version the server using semantic versioning. Publish a changelog when tool schemas change to enable dependent agent configurations to be updated in advance.

---

## Decision Framework

### When to Use MCP vs Custom Connector vs Power Automate Flow

| Criteria | MCP Server | Custom Connector | Power Automate Flow |
|----------|-----------|-----------------|---------------------|
| **Invocation model** | Direct tool call from LLM at inference time | HTTP action inside Power Automate | Flow triggered by agent topic action |
| **Best for** | Low-latency, interactive lookups; actions the LLM selects dynamically | Standardized REST APIs used across many flows; OpenAPI-defined surfaces | Multi-step orchestration; long-running processes; human approvals |
| **Latency profile** | Lowest (single round-trip at inference time) | Medium (flow overhead + connector call) | Highest (flow startup + sequential action chain) |
| **Token usage** | Higher (tool definitions consume context tokens) | None beyond agent topic | None beyond agent topic |
| **Complexity ceiling** | Low to medium (single tool invocations) | Low to medium (parameterized API calls) | High (branching, looping, parallel branches, error handling) |
| **State management** | Stateless per call | Stateless per call | Stateful (variables, run history) |
| **Reuse surface** | Agent-scoped | Flow-scoped; shareable via solution | Solution-scoped; shareable |
| **DLP enforcement** | Via MCP server network policy + DLP on connection | Via Power Platform DLP policy | Via Power Platform DLP policy |
| **Monitoring** | Custom logging in MCP server; no built-in Power Platform telemetry | Power Automate run history and connector analytics | Power Automate run history and connector analytics |

### Guidance Summary

- **Use MCP** when the agent needs to call a tool interactively during a conversation, the operation is a single-step read or write, and low latency is important to the user experience.
- **Use a custom connector** when the same API is called from many flows, you want OpenAPI-based discovery and sharing, and you need consistent DLP governance across environments.
- **Use a Power Automate flow** when the action involves multi-step orchestration, human approvals, branching logic, looping over collections, or integration with multiple connectors in sequence.
- **Combine approaches** for complex scenarios: use MCP for the interactive surface that the agent calls directly, and trigger a Power Automate flow via an HTTP action from the MCP tool handler for back-end orchestration.

### Performance Comparison

The figures below are representative ranges for planning purposes. Actual latency will vary based on network conditions, server location, API complexity, payload size, and load. Validate these numbers in your specific deployment environment before using them for SLA or capacity planning.

| Dimension | MCP | Custom Connector via Flow | Power Automate Flow |
|-----------|-----|--------------------------|---------------------|
| Typical round-trip latency | 200 ms to 1 s | 2 s to 5 s | 3 s to 15 s |
| Cold start penalty | Low (server already running) | Low (connector cached) | Medium (flow runtime startup) |
| Token overhead | 500 to 2,000 tokens for tool definitions | None | None |
| Parallel execution | Supported (multiple tool calls in one turn) | Only if flow supports parallel branches | Requires explicit parallel branch configuration |

### Security and DLP Implications

- MCP server connections are currently not subject to Power Platform DLP policy in the same way that standard connectors are. Enforce data-boundary controls at the MCP server network layer and through Copilot Studio's content moderation settings.
- Custom connectors and Power Automate flows are fully governed by Power Platform DLP policies. Classify connectors as Business or Non-Business appropriately.
- For MCP servers that access sensitive data (PII, financial records, health information), implement output filtering in the MCP server layer before returning content to the agent.
- Audit logging for MCP tool calls must be implemented in the MCP server itself; Power Platform run history does not capture MCP invocations.

### Maintenance and Versioning

| Aspect | MCP Server | Custom Connector | Power Automate Flow |
|--------|-----------|-----------------|---------------------|
| Schema changes | Update tool definitions; re-register in Copilot Studio | Update OpenAPI definition; re-import connector | Update flow actions; solution-aware ALM |
| Backward compatibility | Additive tool additions are safe; removing or renaming tools requires agent reconfiguration | Additive property changes are safe; breaking changes require connector update and reconnection | Breaking changes require flow update before deployment |
| Environment promotion | Deploy server to each environment; update connection endpoint environment variable | Export/import as part of solution | Export/import as part of solution |
| Dependency tracking | Manual; not tracked by Power Platform solutions | Tracked in solution as connection reference | Tracked in solution |
