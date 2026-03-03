# Enable Web Chat

> Configure the web chat channel for a Copilot Studio agent and retrieve the HTML embed code for adding the chat widget to a website.

## Session Setup

```
copilotbrowser-cli --session-name=mcs --headed --filter=interactive
```

## Prerequisites

- copilotbrowser-cli session `mcs` is running
- User is authenticated with Copilot Studio Maker permissions
- Agent is published (see [09-publish-agent.md](09-publish-agent.md))
- Target website where the widget will be embedded is identified

## Placeholders

| Placeholder | Description |
|---|---|
| `[ENV_ID]` | Environment ID (GUID) |
| `[BOT_ID]` | Agent (bot) ID (GUID) |
| `[WEBSITE_DOMAIN]` | Domain of the website that will host the widget, e.g., `https://www.contoso.com` |

---

## Steps

### Step 1: Navigate to Channels Page

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels`

**Expected Result**: Channels management page loads.

---

### Step 2: Capture Channels Page State [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] Channels page is visible. Web chat or "Custom website" channel option is listed.

---

### Step 3: Click the Web Chat Channel Row [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Web chat or Custom website channel row on the Channels page"
- ref: `[from snapshot]`

**Expected Result**: The Web Chat configuration panel opens.

[VERIFY] A configuration panel with embed code or channel settings is visible.

---

### Step 4: Enable the Web Chat Channel [SNAPSHOT]

If the Web Chat channel toggle is present and currently OFF:

**Tool**: `browser_click`
**Parameters**:
- element: "Web chat channel enable toggle or Turn on button"
- ref: `[from snapshot]`

**Expected Result**: Web Chat channel is enabled.

[VERIFY] Toggle is ON. Embed code section becomes visible.

NOTE: If already enabled, skip this step.

---

### Step 5: Configure Allowed Domains (Security)

To restrict the web chat widget to specific domains, add the allowed domain:

**Tool**: `browser_snapshot`

Look for an "Allowed websites", "Allowed domains", or "Security" section.

If an allowed domains input is present:

**Tool**: `browser_type`
**Parameters**:
- element: "Allowed domains or websites input field"
- ref: `[from snapshot]`
- text: `[WEBSITE_DOMAIN]`
- submit: true

**Expected Result**: `[WEBSITE_DOMAIN]` is added to the allowed domains list.

[VERIFY] The domain appears in the allowed list. Remove any wildcard entries if the tenant security policy requires domain restriction.

NOTE: Leaving allowed domains empty permits the widget to be embedded on any website. This is acceptable for internal deployments but should be restricted for public-facing agents.

---

### Step 6: Retrieve the Embed Code [SNAPSHOT]

**Tool**: `browser_snapshot`

[VERIFY] An "Embed code" section is visible showing an HTML snippet.

---

### Step 7: Copy the Embed Code

**Tool**: `browser_click`
**Parameters**:
- element: "Copy embed code button or Copy button in the web chat embed section"
- ref: `[from snapshot]`

**Expected Result**: The HTML embed code is copied to the clipboard.

[VERIFY] A "Copied" or checkmark indicator appears briefly after clicking.

The embed code has the following form:

```html
<script
  src="https://webchat.botframework.com/embed/[BOT_NAME]?s=[SHARED_SECRET]"
  id="copilot-webchat-embed">
</script>
```

Store this code securely. The shared secret in the embed URL grants access to the agent.

---

### Step 8: Save Web Chat Settings [SNAPSHOT]

**Tool**: `browser_click`
**Parameters**:
- element: "Save button in the web chat channel settings"
- ref: `[from snapshot]`

**Expected Result**: Settings are saved.

[VERIFY] Saved confirmation is visible. Web Chat channel row on the Channels page shows an enabled status.

---

### Step 9: Test the Web Chat Widget

To verify the widget works before embedding on a production site, use the Copilot Studio demo website:

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://webchat.botframework.com/embed/[BOT_NAME]?s=[SHARED_SECRET]`

Replace `[BOT_NAME]` and `[SHARED_SECRET]` from the embed code.

**Tool**: `browser_snapshot`

[VERIFY] A chat widget is visible and functional. Send a test message to confirm the agent responds.

---

### Step 10: Verify Channel Status [SNAPSHOT]

**Tool**: `browser_navigate`
**Parameters**:
- url: `https://copilotstudio.microsoft.com/environments/[ENV_ID]/bots/[BOT_ID]/channels`

**Tool**: `browser_snapshot`

[VERIFY] Web Chat or Custom Website channel row shows an enabled/active status.

---

## Embedding on a Website

Add the embed code to the target website before the closing `</body>` tag:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Company Portal</title>
</head>
<body>
  <!-- Page content -->

  <!-- Copilot Studio web chat widget -->
  <script
    src="https://webchat.botframework.com/embed/[BOT_NAME]?s=[SHARED_SECRET]"
    id="copilot-webchat-embed">
  </script>
</body>
</html>
```

For a floating widget with custom styling, wrap in a positioned container:

```html
<div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 400px; height: 500px;">
  <iframe
    src="https://webchat.botframework.com/embed/[BOT_NAME]?s=[SHARED_SECRET]"
    style="width: 100%; height: 100%; border: none;">
  </iframe>
</div>
```

---

## Verification

- Web Chat channel is enabled on the Channels page
- Embed code is retrieved and stored
- Allowed domain restriction is configured if required by security policy
- Widget loads and responds to messages when accessed directly

## Rollback

1. Navigate to the Channels page
2. Click the Web Chat channel row
3. Toggle Web Chat OFF
4. Save the setting
5. Remove the embed code from any websites where it was deployed

## Security Notes

- The shared secret in the embed URL is equivalent to read access to the agent. Treat it as a credential.
- Rotate the shared secret if it is exposed: navigate to the Web Chat channel settings and regenerate the secret.
- Use allowed domain restrictions to prevent unauthorized embedding in production environments.
