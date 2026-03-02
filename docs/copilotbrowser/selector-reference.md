# Copilot Studio Selector Reference

## Overview

This reference documents the accessibility-tree-based element identification patterns used when automating Copilot Studio and Power Platform pages with copilotbrowser-cli. Rather than CSS selectors, copilotbrowser-cli uses `ref` values derived from accessibility snapshots. This guide maps common Copilot Studio UI elements to their accessibility roles, labels, and recommended snapshot-based targeting patterns.

---

## How to Identify Elements

### Get a snapshot

All element identification starts with a snapshot call:

```text
browser_snapshot
```

The response is an accessibility tree listing all interactive elements with:

- `role` -- the ARIA role (button, textbox, combobox, link, checkbox, etc.)
- `name` or `description` -- the visible or accessible label
- `ref` -- the stable identifier to use in subsequent action calls

### Find elements in the snapshot

Locate your target element using role and name. For example, a snapshot of a Copilot Studio topic editor might return:

```text
- button ref="e12" name="Save"
- button ref="e13" name="Publish"
- textbox ref="e14" name="Topic name"
- combobox ref="e15" name="Status"
```

Use the `ref` value and the element description in your action calls.

---

## Copilot Studio Element Patterns

### Navigation and global controls

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Primary navigation items | link | Element name matches nav label (for example, "Topics", "Entities", "Analytics") | Located in the left-hand navigation rail. |
| Environment switcher | button or combobox | "Environment" or environment display name | Used to switch between Power Platform environments. |
| Settings gear | button | "Settings" | Appears in top-right corner. |
| Help button | button | "Help" | |
| Search bar (global) | textbox | "Search" | |
| User profile | button | Display name or "Profile" | |

### Agent canvas

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Create agent button | button | "Create agent" or "New agent" | On the agents list page. |
| Agent name field | textbox | "Agent name" or "Name" | In agent creation and settings flows. |
| Agent description field | textbox | "Description" | |
| Save button | button | "Save" | Present in all editor surfaces. |
| Publish button | button | "Publish" | Publishes the current agent to channels. |
| Test chat panel toggle | button | "Test your agent" or "Test" | Opens/closes the test canvas. |
| Test chat input | textbox | "Type a message" or "Message" | Send test messages to the agent. |
| Test chat send | button | "Send" | |
| Reset conversation button | button | "Reset" or "Restart conversation" | Clears the test chat state. |

### Topics editor

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| New topic button | button | "New topic" or "Add topic" | |
| Topic search | textbox | "Search topics" or "Filter" | |
| Topic row (in list) | link or row | Topic name | Click to open topic editor. |
| Topic name field | textbox | "Name" | In topic editor header. |
| Add trigger phrase | button | "Add phrase" or "Add trigger phrase" | |
| Trigger phrase input | textbox | "Trigger phrase" | Appears when adding phrases. |
| Add node button | button | "Add node" or "+" | Within the topic canvas. |
| Node type selector | combobox or button | Node type name (for example, "Question", "Message", "Action") | |
| Delete topic | button | "Delete" | In topic options menu. |
| Topic status toggle | checkbox or combobox | "Status" or "Enabled" | |

### Entities editor

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| New entity button | button | "New entity" or "Add entity" | |
| Entity name field | textbox | "Name" | |
| Entity type selector | combobox | "Type" | Options include Closed list, Regular expression, etc. |
| Add synonym/value | button | "Add" | Within entity value list. |
| Value input | textbox | "Value" or "Synonym" | |

### Knowledge sources

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Add knowledge button | button | "Add knowledge" or "Add" | On the knowledge configuration page. |
| Knowledge source type selector | combobox or list | Source type name (for example, "SharePoint", "Website", "Files") | |
| URL / path input | textbox | "URL", "Site URL", or "Path" | |
| Connect button | button | "Connect" or "Add" | Confirms knowledge source addition. |
| Refresh button | button | "Refresh" or "Sync" | Re-indexes knowledge sources. |

### Channel configuration

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Channels page link | link | "Channels" | In the left navigation. |
| Microsoft Teams channel | button or link | "Microsoft Teams" | |
| Web channel toggle | checkbox or button | "Web" or "Custom website" | |
| Copy embed code button | button | "Copy" or "Copy code" | |
| Direct Line secret section | region or heading | "Direct Line" | Contains the secret key. |

### Analytics

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Analytics nav item | link | "Analytics" | |
| Date range selector | combobox | "Date range" or "Last N days" | |
| Export button | button | "Export" | Downloads analytics data. |
| Topic engagement table | table | -- | Use `browser_evaluate` with a scoped `ref` for structured data extraction. |

### Power Automate flow integration

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Add action node | button | "Add action" or "Call an action" | Within topic canvas action nodes. |
| Flow selector | combobox or listbox | "Select a flow" or "Power Automate" | |
| Create flow button | button | "Create a flow" | Opens Power Automate in new tab. |
| Flow input mapping | textbox | Variable or parameter name | One textbox per flow input parameter. |
| Flow output mapping | textbox | Output variable name | One textbox per flow output. |

---

## Power Platform Admin Center Element Patterns

| UI element | Accessibility role | Typical accessible name | Notes |
|---|---|---|---|
| Environments list | table or list | -- | Each row contains environment name, type, and region. |
| Environment row | link or row | Environment name | |
| New environment button | button | "New" or "New environment" | |
| Environment settings | button | "Settings" | Per-environment action. |
| Manage users | link | "Users" or "Manage users" | |
| Security roles page | link | "Security roles" | |
| DLP policies | link | "Data policies" or "DLP" | |

---

## Common Automation Patterns

### Navigate to a specific topic and edit it

```text
1. browser_navigate url="https://copilotstudio.microsoft.com"
2. browser_snapshot
3. Locate link with name matching your agent name, click it using its ref
4. browser_wait_for text="Topics"
5. browser_snapshot
6. Locate link ref="<ref>" name="Topics", click it
7. browser_wait_for text="<topic name>"
8. browser_snapshot
9. Locate row or link with name="<topic name>", click it
10. browser_wait_for text="Trigger phrases"
```

### Add a trigger phrase to a topic

```text
1. After navigating to topic editor (see above)
2. browser_snapshot
3. Locate button ref="<ref>" name="Add phrase", click it
4. browser_snapshot
5. Locate textbox ref="<ref>" name="Trigger phrase", type new phrase
6. browser_press_key key="Enter"
7. browser_snapshot
8. Verify new phrase appears in list
9. browser_click element="Save button" ref="<save-ref>"
```

### Publish an agent

```text
1. browser_snapshot
2. Locate button ref="<ref>" name="Publish", click it
3. browser_wait_for text="Publishing" -- wait for process to start
4. browser_wait_for textGone="Publishing" -- wait for process to complete
5. browser_snapshot
6. Verify published status indicator or confirmation message
```

### Test agent conversation

```text
1. browser_snapshot
2. Locate button ref="<ref>" name="Test your agent", click it
3. browser_wait_for text="Type a message"
4. browser_snapshot
5. Locate textbox ref="<ref>" name="Type a message"
6. browser_type element="Test chat message input" ref="<ref>" text="Hello"
7. browser_click element="Send button" ref="<send-ref>"
8. browser_wait_for text="<expected agent response text>"
```

---

## Accessibility Compliance Notes

Copilot Studio and the Power Platform admin surfaces are designed to WCAG 2.1 AA compliance. This means:

- All interactive elements have accessible names.
- Roles are correctly assigned (buttons are buttons, not styled divs).
- Dynamic content updates are announced through ARIA live regions.

This compliance level makes copilotbrowser-cli snapshot-based targeting highly reliable for Power Platform automation. Elements that do not surface correctly in snapshots are most likely rendered in iframes or canvas-based components. For those cases, use `browser_evaluate` with a scoped `ref` to reach into the embedded content.

### Iframe handling

Copilot Studio uses iframes for some embedded experiences (for example, Power Automate flow editor). If a target element does not appear in the top-level snapshot:

```text
1. browser_snapshot
2. Identify the iframe container element by its ref and description
3. browser_evaluate element="iframe container" ref="<ref>" function="(el) => el.contentDocument.title"
   -- Confirms which document is loaded in the iframe
   -- Note: contentDocument access requires the iframe to be same-origin as the parent page.
   -- Cross-origin iframes will throw a security error. For cross-origin content, target the
   -- iframe's accessible surface from the top-level snapshot or interact via browser_navigate
   -- to the iframe's URL directly in a new tab.
4. Use browser_evaluate for read operations within the iframe (same-origin only)
5. For click/type inside an iframe, use browser_evaluate with DOM interaction function (same-origin only)
```
