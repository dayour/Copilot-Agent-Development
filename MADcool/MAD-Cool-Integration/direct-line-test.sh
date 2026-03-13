#!/usr/bin/env bash
set -Eeuo pipefail

# Copilot Studio Direct Line runtime test
# Uses: 1) Copilot Studio token endpoint (Channels UI) with WEB_CHANNEL_SECRET
#       2) Bot Framework Direct Line API with returned token

# Required env vars (prefer copying exact Token Endpoint from Channels):
#   export TOKEN_ENDPOINT="https://{ENV}.environment.api.powerplatform.com/copilotstudio/directline/token?api-version=2022-03-01-preview"
#   export WEB_CHANNEL_SECRET="<secret from Channels UI>"
# Optional if TOKEN_ENDPOINT not set:
#   export ENV_HOST="{ENV}.environment.api.powerplatform.com"  # exact host as shown in Channels

DIRECTLINE_BASE="https://directline.botframework.com/v3/directline"

echo "Direct Line test starting..."

if ! command -v curl >/dev/null; then
    echo "Error: curl is required." >&2
    exit 1
fi
if ! command -v jq >/dev/null; then
    echo "Error: jq is required." >&2
    exit 1
fi

# Resolve token endpoint
TOKEN_ENDPOINT_URL="${TOKEN_ENDPOINT:-}"
if [[ -z "${TOKEN_ENDPOINT_URL}" ]]; then
    if [[ -n "${ENV_HOST:-}" ]]; then
        TOKEN_ENDPOINT_URL="https://${ENV_HOST}/copilotstudio/directline/token?api-version=2022-03-01-preview"
    else
        echo "Error: TOKEN_ENDPOINT not set and ENV_HOST not provided." >&2
        echo "Tip: Copy the Token Endpoint from Copilot Studio > Channels (Web/Mobile app)." >&2
        exit 2
    fi
fi

if [[ -z "${WEB_CHANNEL_SECRET:-}" ]]; then
    echo "Error: WEB_CHANNEL_SECRET is not set. Copy it from Copilot Studio > Channels." >&2
    exit 2
fi

echo "Requesting Direct Line token from: ${TOKEN_ENDPOINT_URL}"
TOKEN_JSON=$(curl -sS -X POST \
    -H "Authorization: Bearer ${WEB_CHANNEL_SECRET}" \
    "${TOKEN_ENDPOINT_URL}")

if [[ -z "${TOKEN_JSON}" ]] || [[ "${TOKEN_JSON}" == *"RouteNotFound"* ]]; then
    echo "Error: Failed to get token. Verify the Token Endpoint host and path copied from Channels." >&2
    echo "Response: ${TOKEN_JSON}" >&2
    exit 3
fi

DIRECT_LINE_TOKEN=$(echo "${TOKEN_JSON}" | jq -r '.token // empty')
CONV_ID=$(echo "${TOKEN_JSON}" | jq -r '.conversationId // empty')
EXPIRES_IN=$(echo "${TOKEN_JSON}" | jq -r '.expires_in // empty')

if [[ -z "${DIRECT_LINE_TOKEN}" ]]; then
    echo "Error: Token response did not include 'token'." >&2
    echo "Response: ${TOKEN_JSON}" >&2
    exit 4
fi

echo "Got token (expires_in=${EXPIRES_IN:-unknown})."

# Start conversation if not returned by token endpoint
if [[ -z "${CONV_ID}" ]]; then
    echo "Starting Direct Line conversation..."
    START_JSON=$(curl -sS -X POST \
        -H "Authorization: Bearer ${DIRECT_LINE_TOKEN}" \
        -H "Content-Type: application/json" \
        "${DIRECTLINE_BASE}/conversations")
    CONV_ID=$(echo "${START_JSON}" | jq -r '.conversationId // empty')
    if [[ -z "${CONV_ID}" ]]; then
        echo "Error: Could not start conversation." >&2
        echo "Response: ${START_JSON}" >&2
        exit 5
    fi
fi

echo "ConversationId: ${CONV_ID}"

send_message() {
    local text=$1
    curl -sS -X POST \
        -H "Authorization: Bearer ${DIRECT_LINE_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"message\",\"from\":{\"id\":\"dl_testuser\"},\"text\":\"${text}\"}" \
        "${DIRECTLINE_BASE}/conversations/${CONV_ID}/activities" >/dev/null
}

get_messages() {
    curl -sS -X GET \
        -H "Authorization: Bearer ${DIRECT_LINE_TOKEN}" \
        "${DIRECTLINE_BASE}/conversations/${CONV_ID}/activities" \
        | jq -r '.activities[] | select(.from.id != "dl_testuser") | .text // empty' \
        | sed '/^$/d'
}

echo "Sending test prompts..."
PROMPTS=(
    "Hello"
    "List all security group names in the spreadsheet"
    "What columns are available for each group?"
    "Show me details for the group 'Finance Team'"
    "Thank you"
)

for p in "${PROMPTS[@]}"; do
    echo "\n> ${p}"
    send_message "${p}"
    sleep 2
    get_messages | tail -5 || true
done

echo "Done."
