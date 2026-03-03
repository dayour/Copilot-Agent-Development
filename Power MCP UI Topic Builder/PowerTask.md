# Copilot Studio UI Element Reference Guide

## Complete List of UI Elements and Their Selectors

### Navigation Elements

#### Main Navigation Tabs
```bash
# Agents tab
element='a[href*="/agents"]'
element='button[role="tab"]:has-text("Agents")'
element='div[class*="agents-tab"]'
element='span:has-text("Agents")'

# Topics tab
element='a[href*="/topics"]'
element='button[role="tab"]:has-text("Topics")'
element='div[class*="topics-tab"]'
element='li[aria-label="Topics"]'

# Tools tab
element='a[href*="/tools"]'
element='button[role="tab"]:has-text("Tools")'
element='div[class*="tools-tab"]'
element='span[class*="tab-label"]:has-text("Tools")'

# Knowledge tab
element='a[href*="/knowledge"]'
element='button[role="tab"]:has-text("Knowledge")'
element='div[class*="knowledge-tab"]'

# Analytics tab
element='a[href*="/analytics"]'
element='button[role="tab"]:has-text("Analytics")'
element='div[class*="analytics-tab"]'

# Settings tab
element='a[href*="/settings"]'
element='button[role="tab"]:has-text("Settings")'
element='div[class*="settings-tab"]'
```

#### Environment Selector
```bash
# Environment dropdown
element='div[class*="environment-selector"]'
element='button[aria-label*="Environment"]'
element='div[role="button"][class*="env-"]'

# Environment options
element='div[role="option"]:has-text("{env_name}")'
element='button[aria-label*="{env_name}"]'
element='li:has-text("{env_name}")'
```

### Agent Creation Elements

#### Create Flow
```bash
# Create tab/button
element='button:has-text("Create")'
element='a[href*="/create"]'
element='div[role="tab"]:has-text("Create")'

# New agent button
element='button:has-text("New agent")'
element='div[class*="new-agent"]'
element='a[aria-label="Create new agent"]'

# Agent description input
element='textarea[placeholder="Type your message"]'
element='textarea[aria-label="Agent description"]'
element='div[contenteditable="true"][class*="chat-input"]'

# Send button
element='button[aria-label="Send"]'
element='button:has-text("Send"):not([disabled])'
element='button[class*="send-button"]'

# Create agent button
element='button:has-text("Create")'
element='button[class*="primary"]:has-text("Create")'
element='button[aria-label="Create agent"]'
```

#### Knowledge Source Elements
```bash
# Knowledge URL inputs
element='input[placeholder*="URL"]'
element='input[aria-label="Knowledge source URL"]'
element='input[type="url"]'

# Ownership checkboxes
element='input[type="checkbox"][aria-label*="Confirm"]'
element='input[type="checkbox"][aria-label*="ownership"]'
element='div[class*="checkbox"] input[type="checkbox"]'

# Add knowledge button
element='button:has-text("Add")'
element='button[aria-label="Add knowledge source"]'
```

### Topic Management Elements

#### Topic List
```bash
# Add topic button
element='button:has-text("Add a topic")'
element='button[aria-label="Add new topic"]'
element='div[class*="add-topic"]'

# Topic filters
element='button:has-text("Custom")'
element='button:has-text("System")'
element='button:has-text("All")'
element='input[placeholder*="Filter"]'

# Topic rows
element='div[role="row"]:has-text("{topic_name}")'
element='a:has-text("{topic_name}")'
element='tr:has-text("{topic_name}")'

# Topic actions
element='button[aria-label="More options"]'
element='button:has-text("Delete")'
element='button:has-text("Duplicate")'
```

#### Topic Creation
```bash
# Creation options
element='button:has-text("From blank")'
element='button:has-text("Add from description with Copilot")'
element='div[role="menuitem"]:has-text("From template")'

# Topic name input
element='input[aria-label="Topic name"]'
element='input[placeholder*="Topic name"]'
element='input[class*="topic-name"]'

# Topic description
element='textarea[aria-label="Description"]'
element='textarea[placeholder*="Describe"]'
element='textarea[class*="description"]'

# Save topic button
element='button:has-text("Save")'
element='button[aria-label="Save topic"]'
element='button[class*="save-topic"]'
```

#### Topic Canvas
```bash
# Add node button
element='button:has-text("Add node")'
element='button[aria-label="Add node"]'
element='div[class*="add-node"]'

# Node types
element='button:has-text("Send a message")'
element='button:has-text("Ask a question")'
element='button:has-text("Call an action")'
element='button:has-text("Condition")'
element='button:has-text("Variable management")'

# Message input
element='textarea[aria-label="Message"]'
element='div[contenteditable="true"][class*="message"]'
element='textarea[placeholder*="Enter a message"]'

# Question input
element='textarea[aria-label="Question"]'
element='input[aria-label="Question text"]'

# Variable inputs
element='input[aria-label="Variable name"]'
element='select[aria-label="Variable type"]'
element='input[aria-label="Default value"]'
```

### Tool Integration Elements

#### Tool Management
```bash
# Add tool button
element='button:has-text("Add a tool")'
element='button[aria-label="Add new tool"]'
element='div[class*="add-tool"]'

# Tool search
element='input[placeholder*="Search"]'
element='input[aria-label="Search tools"]'
element='input[class*="tool-search"]'

# Tool cards
element='div:has-text("Dataverse MCP Server")'
element='div[class*="tool-card"]:has-text("{tool_name}")'
element='button[aria-label="{tool_name}"]'

# Add to agent button
element='button:has-text("Add to agent")'
element='button[aria-label="Add tool to agent"]'
element='button[class*="add-tool-button"]'

# Tool toggle
element='input[type="checkbox"][aria-label*="Enable"]'
element='div[role="switch"]'
element='button[aria-label="Toggle tool"]'

# Tool settings
element='button:has-text("More")'
element='button[aria-label="Tool settings"]'
element='button:has-text("Configure")'
```

### Publishing Elements

```bash
# Publish button
element='button:has-text("Publish")'
element='button[aria-label="Publish agent"]'
element='button[class*="publish"]'

# Publish dialog
element='div[role="dialog"]'
element='div[class*="publish-dialog"]'

# Confirm publish
element='div[role="dialog"] button:has-text("Publish")'
element='button[aria-label="Confirm publish"]'

# Publishing status
element='div:has-text("Publishing...")'
element='div:has-text("Your agent is being published")'
element='div[class*="progress"]'

# Close dialog
element='button:has-text("Close")'
element='button[aria-label="Close dialog"]'
element='button[class*="dialog-close"]'
```

### Testing Elements

```bash
# Test panel
element='div[class*="test-panel"]'
element='div[aria-label="Test your agent"]'

# Test input
element='textarea[placeholder="Type your message"]'
element='input[aria-label="Type a message"]'
element='div[contenteditable="true"][class*="test-input"]'

# Send test message
element='button[aria-label="Send"]'
element='button[class*="test-send"]'

# Test response area
element='div[class*="test-response"]'
element='div[aria-label="Agent response"]'

# Clear conversation
element='button:has-text("Clear")'
element='button[aria-label="Clear conversation"]'
element='button:has-text("Start over")'
```

### Common UI Patterns

#### Buttons
```bash
# Primary buttons
element='button[class*="primary"]'
element='button[class*="cta"]'

# Secondary buttons
element='button[class*="secondary"]'
element='button[class*="default"]'

# Icon buttons
element='button[aria-label*="Edit"]'
element='button[aria-label*="Delete"]'
element='button[aria-label*="Settings"]'

# Disabled state
element='button:not([disabled])'
element='button[disabled]'
element='button[aria-disabled="true"]'
```

#### Inputs
```bash
# Text inputs
element='input[type="text"]'
element='input[class*="text-input"]'

# Textareas
element='textarea'
element='textarea[rows]'

# Select dropdowns
element='select'
element='div[role="combobox"]'

# Checkboxes
element='input[type="checkbox"]'
element='div[class*="checkbox"]'

# Radio buttons
element='input[type="radio"]'
element='div[role="radio"]'
```

#### Loading States
```bash
# Loading indicators
element='div:has-text("Loading...")'
element='div[class*="spinner"]'
element='div[class*="progress"]'

# Saving states
element='div:has-text("Saving...")'
element='div:has-text("Saving topic...")'
element='div:has-text("Publishing...")'
```

#### Notifications
```bash
# Success messages
element='div:has-text("Topic Saved!")'
element='div:has-text("Published successfully")'
element='div[class*="success"]'

# Error messages
element='div:has-text("Error")'
element='div[class*="error"]'
element='div[role="alert"]'

# Info messages
element='div[class*="info"]'
element='div[class*="notification"]'
```

### Advanced Selectors

#### Attribute-based
```bash
# Data attributes
element='[data-testid="{test_id}"]'
element='[data-automation-id="{automation_id}"]'

# ARIA attributes
element='[aria-label="{label}"]'
element='[aria-describedby="{id}"]'
element='[role="{role}"]'

# Class contains
element='[class*="{partial_class}"]'
element='[id*="{partial_id}"]'
```

#### Pseudo-selectors
```bash
# Position-based
element=':nth-child(n)'
element=':first-child'
element=':last-child'

# State-based
element=':enabled'
element=':disabled'
element=':checked'
element=':focus'
```

#### Combined selectors
```bash
# Multiple conditions
element='button[class*="primary"]:has-text("Save"):not([disabled])'
element='div[role="dialog"] button:has-text("Confirm")'
element='input[type="checkbox"][aria-label*="ownership"]:not(:checked)'
```

## Usage Tips

1. **Selector Priority**:
   - Prefer `aria-label` for accessibility and stability
   - Use `:has-text()` for user-visible content
   - Fallback to class/id selectors when needed

2. **Waiting Strategies**:
   - Always wait after navigation
   - Wait for loading states to disappear
   - Use explicit waits for dynamic content

3. **Error Handling**:
   - Check element state before interaction
   - Capture screenshots on failures
   - Log element not found errors

4. **Performance**:
   - Use specific selectors over generic ones
   - Avoid deep nesting in selectors
   - Cache frequently used elements