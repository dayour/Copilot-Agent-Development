# Caddy Reverse Proxy Architecture for Copilot Studio Web Chat

## Overview

This document describes the reference architecture for hosting Copilot Studio web chat endpoints behind a Caddy reverse proxy. Caddy provides automatic TLS certificate management via Let's Encrypt, clean declarative configuration, and a rich middleware model suited for production web chat deployments.

The architecture covers four deployment patterns:

1. Single Agent -- one custom domain proxied to one Copilot Studio web chat endpoint.
2. Multi-Agent Gateway -- one domain with URL path routing to multiple agents.
3. Multi-Tenant -- subdomain-based routing where each tenant gets an isolated agent endpoint.
4. Load Balanced -- multiple Caddy instances fronted by Azure Front Door for global scale and WAF protection.

---

## Component Map

```mermaid
flowchart TB
    client["Browser / Mobile Client"]
    caddy["Caddy Server\n(TLS termination, routing, headers)"]
    le["Let's Encrypt / ZeroSSL\n(Automatic certificate issuance)"]
    cs1["Copilot Studio Web Chat\nEndpoint A"]
    cs2["Copilot Studio Web Chat\nEndpoint B"]
    cs3["Copilot Studio Web Chat\nEndpoint C"]
    dl["Direct Line Token Service\n(Azure Bot Service)"]
    afd["Azure Front Door\n(Optional WAF + Global LB)"]

    client -->|HTTPS| afd
    afd -->|HTTP or HTTPS| caddy
    caddy <-->|ACME challenge| le
    caddy -->|reverse_proxy| cs1
    caddy -->|reverse_proxy| cs2
    caddy -->|reverse_proxy| cs3
    caddy -->|token proxy| dl
```

---

## Deployment Patterns

### Pattern 1: Single Agent

One Caddy host block maps a single custom domain to one Copilot Studio web chat URL. Suited for focused deployments where one agent handles all conversations on a branded domain.

```mermaid
flowchart LR
    browser["Browser"]
    caddy["Caddy\nagent.contoso.com"]
    cs["Copilot Studio\nWeb Chat Endpoint"]

    browser -->|HTTPS 443| caddy
    caddy -->|HTTP reverse proxy| cs
```

Key responsibilities of Caddy in this pattern:

- TLS termination with automatic certificate renewal.
- Security response headers (CSP, HSTS, X-Frame-Options).
- Rate limiting per client IP.
- Access log for audit trail.
- Health check endpoint at `/healthz`.

See `caddyfile-templates/single-agent.Caddyfile` for the full configuration.

---

### Pattern 2: Multi-Agent Gateway

One domain serves multiple agents differentiated by URL path prefix. Caddy matches the request path and proxies to the corresponding Copilot Studio endpoint.

```mermaid
flowchart LR
    browser["Browser"]
    caddy["Caddy\ngateway.contoso.com"]
    sales["Sales Agent\nCopilot Studio Endpoint"]
    support["Support Agent\nCopilot Studio Endpoint"]
    hr["HR Agent\nCopilot Studio Endpoint"]

    browser -->|/sales/*| caddy
    browser -->|/support/*| caddy
    browser -->|/hr/*| caddy
    caddy -->|route /sales| sales
    caddy -->|route /support| support
    caddy -->|route /hr| hr
```

Path routing rules:

| Path prefix | Target agent |
|---|---|
| `/sales` | Sales agent endpoint |
| `/support` | Support agent endpoint |
| `/hr` | HR agent endpoint |

See `caddyfile-templates/multi-agent-gateway.Caddyfile`.

---

### Pattern 3: Multi-Tenant

Each tenant receives a dedicated subdomain. Caddy uses a wildcard TLS certificate and routes based on the `Host` header to the correct Copilot Studio endpoint.

```mermaid
flowchart LR
    contoso["contoso.agent.example.com"]
    fabrikam["fabrikam.agent.example.com"]
    northwind["northwind.agent.example.com"]
    caddy["Caddy\n*.agent.example.com\n(Wildcard TLS)"]
    ep_a["Tenant A Copilot Studio Endpoint"]
    ep_b["Tenant B Copilot Studio Endpoint"]
    ep_c["Tenant C Copilot Studio Endpoint"]

    contoso --> caddy
    fabrikam --> caddy
    northwind --> caddy
    caddy -->|Host: contoso| ep_a
    caddy -->|Host: fabrikam| ep_b
    caddy -->|Host: northwind| ep_c
```

DNS prerequisite: a wildcard A or CNAME record pointing `*.agent.example.com` to the Caddy server IP.

See `caddyfile-templates/multi-tenant.Caddyfile`.

---

### Pattern 4: Load Balanced with Azure Front Door

For global reach and enterprise WAF protection, multiple Caddy instances are placed behind Azure Front Door. Front Door handles Anycast routing, DDoS protection, and WAF rule evaluation. Caddy instances handle TLS for origin-to-Caddy segments and apply per-instance rate limiting.

```mermaid
flowchart LR
    client["Global Clients"]
    afd["Azure Front Door\n(Anycast, WAF, DDoS, CDN)"]
    caddy1["Caddy Instance -- Region A"]
    caddy2["Caddy Instance -- Region B"]
    cs["Copilot Studio Web Chat\nEndpoints"]

    client --> afd
    afd -->|origin group| caddy1
    afd -->|origin group| caddy2
    caddy1 --> cs
    caddy2 --> cs
```

When Front Door is in front:

- TLS termination at Front Door edge is optional; use private link or IP restriction to ensure only Front Door can reach Caddy.
- Caddy should validate the `X-Azure-FDID` request header to reject direct bypass traffic.
- Rate limiting at Caddy complements WAF rules at Front Door.

---

## Request Flow: Single Agent (Annotated)

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as Caddy
    participant LE as Let's Encrypt
    participant DL as Direct Line Token API
    participant CS as Copilot Studio

    B->>C: HTTPS GET /
    C->>LE: ACME certificate check (on first request or renewal)
    LE-->>C: Certificate issued / renewed
    C-->>B: TLS handshake complete
    B->>C: POST /api/token (request Direct Line token)
    C->>DL: Proxy token request (secret hidden from client)
    DL-->>C: Direct Line token (short-lived)
    C-->>B: Return token (secret never exposed)
    B->>C: WebSocket upgrade (Direct Line channel)
    C->>CS: Proxy WebSocket connection
    CS-->>C: Agent response stream
    C-->>B: Streamed response to browser
```

---

## Caddy Feature Usage

| Feature | Usage in this architecture |
|---|---|
| Automatic HTTPS | Let's Encrypt or ZeroSSL certificates managed automatically |
| `reverse_proxy` | Forwards requests to Copilot Studio web chat endpoints |
| `rate_limit` | Protects against abuse per client IP |
| `header` | Adds CSP, HSTS, X-Frame-Options, CORS headers |
| `log` | Structured access log for audit compliance |
| `respond` | Serves health check endpoint at `/healthz` |
| `tls` | Wildcard certificate configuration for multi-tenant pattern |
| Environment variable substitution | Secrets and hostnames kept outside Caddyfile source |

---

## Environment Variable Reference

All Caddyfile templates use environment variable substitution (`{$VAR_NAME}`) to keep secrets and environment-specific values outside version control.

| Variable | Description |
|---|---|
| `AGENT_DOMAIN` | Public custom domain for the agent (e.g., `agent.contoso.com`) |
| `COPILOT_UPSTREAM` | Copilot Studio web chat upstream URL |
| `DIRECTLINE_SECRET` | Azure Bot Service Direct Line channel secret |
| `ALLOWED_ORIGINS` | Comma-separated list of approved CORS origins |
| `RATE_LIMIT_REQUESTS` | Requests allowed per window per IP |
| `RATE_LIMIT_WINDOW` | Time window for rate limiting (e.g., `10s`) |
| `LOG_FILE` | Path to structured access log output file |
| `TLS_EMAIL` | Email address for Let's Encrypt registration |
| `WILDCARD_DOMAIN` | Root domain for multi-tenant wildcard certificate |
| `TENANT_A_UPSTREAM` | Upstream for tenant A in multi-tenant pattern |
| `TENANT_B_UPSTREAM` | Upstream for tenant B in multi-tenant pattern |
| `AZURE_FD_ID` | Azure Front Door ID header value for origin validation |
