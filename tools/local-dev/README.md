# Caddy Local Development Stack

A Docker Compose stack that runs a local reverse proxy for Copilot Studio agent development. It provides HTTPS on `localhost` using self-signed certificates, serves the Bot Framework Web Chat widget, and keeps your Direct Line secret server-side via a token exchange service.

## Stack Components

| Service | Image | Purpose |
|---------|-------|---------|
| caddy | caddy:2-alpine | Reverse proxy with local TLS, routes `/health`, `/token*`, and web-chat traffic |
| web-chat | nginx:1-alpine | Serves the static HTML page embedding the Bot Framework Web Chat widget |
| token-server | node:20-alpine (built locally) | Exchanges the Direct Line secret for a short-lived client token |

## Prerequisites

- Docker Desktop (or Docker Engine with the Compose plugin) installed and running.
- A published Copilot Studio agent with a Direct Line channel enabled.
- Your Direct Line secret and bot ID from Copilot Studio > Settings > Channels > Direct Line.

## Setup

### 1. Copy and populate the environment file

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```
DIRECT_LINE_SECRET=<secret from Copilot Studio Direct Line channel>
AGENT_BOT_ID=<bot ID from Copilot Studio agent settings>
```

### 2. Trust the Caddy local CA (one-time per machine)

Caddy generates a local certificate authority on first run. Install it so your browser trusts `https://localhost`.

```bash
# Start the stack once so Caddy generates its CA
docker compose up -d caddy

# Install the Caddy local root CA into your system trust store
docker compose exec caddy caddy trust
```

On macOS you may need to restart your browser after installing the CA.

### 3. Start the full stack

```bash
docker compose up -d
```

### 4. Verify the stack

```bash
# Health check (should return 200 OK)
curl -s https://localhost/health

# Open the web chat in your browser
open https://localhost
```

The web chat widget loads, fetches a short-lived token from the token server, and connects to your Copilot Studio agent. The Direct Line secret is never sent to the browser.

## Hot-Reload

The Caddy container runs with `--watch`, so any change to `Caddyfile.dev` is detected and applied automatically without restarting the container.

```bash
# Edit the Caddyfile, then verify the reload was picked up
docker compose logs caddy | tail -20
```

You can also trigger a manual reload via the Caddy admin API:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Validation Checklist

- [ ] `curl https://localhost/health` returns `200 OK`
- [ ] `https://localhost` opens the web chat widget without browser TLS warnings
- [ ] Sending a message in the widget receives a response from the agent
- [ ] `curl -X POST https://localhost/token` returns a JSON object with a `token` field
- [ ] Editing `Caddyfile.dev` and saving triggers an automatic Caddy reload (check `docker compose logs caddy`)

## Stopping the Stack

```bash
docker compose down
```

To also remove the persistent Caddy certificate data:

```bash
docker compose down -v
```

## File Reference

```
tools/local-dev/
├── docker-compose.yml       Docker Compose service definitions
├── Caddyfile.dev            Caddy configuration for local HTTPS and routing
├── .env.example             Environment variable template (copy to .env)
├── .gitignore               Excludes .env and node_modules from source control
├── README.md                This file
├── token-server/
│   ├── Dockerfile           Node.js 20 Alpine container definition
│   ├── package.json         Express dependency
│   └── server.js            POST /token endpoint and GET /health
└── web-chat/
    └── index.html           Static page embedding Bot Framework Web Chat
```

## Security Notes

- The `.env` file contains your Direct Line secret. Never commit it to source control. The `.gitignore` file in this directory already excludes `.env`.
- The token server exposes only a short-lived client token to the browser; the secret never leaves the server-side container.
- The local Caddy CA certificate is valid only on your machine and is not trusted outside your development environment.
