# Comprehensive MCP Command Reference for Copilot Studio Agent Building

## Table of Contents
1. [Browser Connection & Navigation Commands](#browser-connection--navigation-commands)
2. [UI Element Interaction Commands](#ui-element-interaction-commands)
3. [Agent Creation Commands](#agent-creation-commands)
4. [Topic Management Commands](#topic-management-commands)
5. [Tool Integration Commands](#tool-integration-commands)
6. [Publishing & Testing Commands](#publishing--testing-commands)
7. [Dataverse Integration Commands](#dataverse-integration-commands)
8. [Knowledge Source Configuration Commands](#knowledge-source-configuration-commands)
9. [Trigger Configuration Commands](#trigger-configuration-commands)
10. [Advanced Settings Configuration](#advanced-settings-configuration)
11. [Skills Integration Commands](#skills-integration-commands)
12. [Error Handling & Recovery Commands](#error-handling--recovery-commands)
13. [Validation Checklists](#validation-checklists)

## Browser Connection & Navigation Commands

### Initial Browser Setup
```bash
# Connect to existing browser instance
mcp_playwright_browser_snapshot()

# Navigate to Copilot Studio
mcp_playwright_browser_navigate(url='https://copilotstudio.microsoft.com')

# Navigate to specific environment
mcp_playwright_browser_navigate(url='https://copilotstudio.preview.microsoft.com/environments/{environment_id}/home')
```

### Environment Selection
```bash
# Click environment selector
mcp_playwright_browser_click(element='div[class*="environment-selector"]', ref='env-selector')
mcp_playwright_browser_click(element='span:has-text("<ORG_NAME> (default)")', ref='current-env')

# Select specific environment
mcp_playwright_browser_click(element='button[aria-label*="<ENVIRONMENT_NAME>"]', ref='<ENVIRONMENT_NAME>-env')
mcp_playwright_browser_click(element='div:has-text("<ENVIRONMENT_NAME>")', ref='env-option')
```

### Environment Validation (Critical)
```bash
# Validate current environment
mcp_playwright_browser_wait_for(element='div:has-text("<ENVIRONMENT_NAME>")', ref='env-confirmation')
mcp_playwright_browser_take_screenshot(filename='environment-validation.png')
# Note: If '<ENVIRONMENT_NAME>' is not visible, halt script and prompt for manual environment switch or confirmation.
```

### Tab Navigation
```bash
# Navigate to Agents tab
mcp_playwright_browser_click(element='a[href*="/agents"]', ref='agents-tab')
mcp_playwright_browser_click(element='button:has-text("Agents")', ref='agents-nav')
mcp_playwright_browser_click(element='div[role="tab"]:has-text("Agents")', ref='agents-tab-div')

# Navigate to Topics tab
mcp_playwright_browser_click(element='a[href*="/topics"]', ref='topics-tab')
mcp_playwright_browser_click(element='button:has-text("Topics")', ref='topics-nav')
mcp_playwright_browser_click(element='span:has-text("Topics")', ref='topics-span')

# Navigate to Tools tab
mcp_playwright_browser_click(element='a[href*="/tools"]', ref='tools-tab')
mcp_playwright_browser_click(element='button:has-text("Tools")', ref='tools-nav')
```

## UI Element Interaction Commands

### Text Input Fields
```bash
# Topic name input
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='topic-name-input', text='{topic_name}')
mcp_playwright_browser_type(element='input[placeholder*="name"]', ref='name-field', text='{name}')

# Description textarea
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='description-input', text='{description}')
mcp_playwright_browser_type(element='textarea[placeholder*="Describe"]', ref='desc-field', text='{description_text}')

# Message content textarea
mcp_playwright_browser_type(element='textarea[aria-label="Message"]', ref='message-input', text='{message_content}')
mcp_playwright_browser_type(element='div[contenteditable="true"]', ref='rich-text-editor', text='{formatted_message}')

# Test chat input
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='test-input', text='{test_message}')
mcp_playwright_browser_type(element='input[aria-label="Type a message"]', ref='chat-input', text='{chat_text}')
```

### Buttons
```bash
# Save button variations
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-btn')
mcp_playwright_browser_click(element='button[aria-label="Save"]', ref='save-aria-btn')
mcp_playwright_browser_click(element='button[data-testid="save-button"]', ref='save-test-btn')

# Publish button variations
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish-btn')
mcp_playwright_browser_click(element='button[aria-label="Publish agent"]', ref='publish-agent-btn')
mcp_playwright_browser_click(element='div[role="button"]:has-text("Publish")', ref='publish-div-btn')

# Add/Create buttons
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic-btn')
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool-btn')
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node-btn')
mcp_playwright_browser_click(element='button:has-text("Create")', ref='create-btn')

# Navigation buttons
mcp_playwright_browser_click(element='button:has-text("Back")', ref='back-btn')
mcp_playwright_browser_click(element='button[aria-label="Go back"]', ref='back-aria-btn')
mcp_playwright_browser_click(element='a:has-text("Back")', ref='back-link')
```

### Dropdown Menus
```bash
# Topic creation dropdown
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='from-blank-option')
mcp_playwright_browser_click(element='div[role="menuitem"]:has-text("From blank")', ref='blank-menu-item')
mcp_playwright_browser_click(element='li:has-text("Add from description with Copilot")', ref='copilot-option')

# Node type selection
mcp_playwright_browser_click(element='button:has-text("Send a message")', ref='message-node-option')
mcp_playwright_browser_click(element='div:has-text("Ask a question")', ref='question-node-option')
mcp_playwright_browser_click(element='span:has-text("Call an action")', ref='action-node-option')
```

### Dialogs and Modals
```bash
# Dialog confirmation
mcp_playwright_browser_click(element='button:has-text("Leave")', ref='leave-dialog-btn')
mcp_playwright_browser_click(element='button:has-text("Don\'t leave")', ref='stay-dialog-btn')
mcp_playwright_browser_click(element='button:has-text("Close")', ref='close-dialog-btn')

# Publish confirmation
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='confirm-publish-btn')
mcp_playwright_browser_click(element='div[role="dialog"] button:has-text("Publish")', ref='dialog-publish-btn')
```

## Agent Creation Commands

### Initial Agent Creation Flow
```bash
# Start new agent creation
mcp_playwright_browser_click(element='button:has-text("New agent")', ref='new-agent-btn')
mcp_playwright_browser_click(element='a[href*="/create"]', ref='create-link')

# Agent description input (conversational)
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='agent-desc-input', text='I want to create an agent named "{agent_name}" that {agent_purpose}')

# Send description
mcp_playwright_browser_click(element='button[aria-label="Send"]', ref='send-desc-btn')
mcp_playwright_browser_click(element='button:has-text("Send"):not([disabled])', ref='send-enabled-btn')

# Wait for response
mcp_playwright_browser_wait_for(time=5)
```

### Agent Configuration
```bash
# Add instructions
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='instruction-input', text='For {function_name}, the agent should: {detailed_instructions}')

# Knowledge source configuration
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='knowledge-input', text='Yes, I would like to add these knowledge sources:\n1. {url1}\n2. {url2}\n3. {url3}')

# Ownership confirmation checkboxes
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Confirm"]', ref='ownership-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(1)', ref='first-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(2)', ref='second-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(3)', ref='third-checkbox')
```

## Topic Management Commands

### Topic Creation Workflow
```bash
# Add new topic
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic-btn')
mcp_playwright_browser_wait_for(time=1)

# Select creation method
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='blank-topic-option')

# Configure topic details
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='topic-name', text='{topic_name}')
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='topic-desc', text='{topic_description}')

# Add message node
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node-btn')
mcp_playwright_browser_click(element='button:has-text("Send a message")', ref='message-node-btn')

# Configure message content
mcp_playwright_browser_type(element='textarea[aria-label="Message"]', ref='message-content', text='{user_friendly_message}')

# Save topic
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-topic-btn')
mcp_playwright_browser_wait_for(time=3)
```

### Topic List Management
```bash
# Filter topics
mcp_playwright_browser_click(element='button:has-text("Custom")', ref='custom-topics-filter')
mcp_playwright_browser_click(element='button:has-text("System")', ref='system-topics-filter')

# Refresh topics
mcp_playwright_browser_click(element='button[aria-label="Refresh"]', ref='refresh-topics-btn')
mcp_playwright_browser_click(element='button:has-text("Refresh topics")', ref='refresh-text-btn')

# Access specific topic
mcp_playwright_browser_click(element='a:has-text("{topic_name}")', ref='topic-link')
mcp_playwright_browser_click(element='div[role="row"]:has-text("{topic_name}")', ref='topic-row')
```

## Tool Integration Commands

### Dataverse MCP Server Integration
```bash
# Navigate to tools
mcp_playwright_browser_click(element='a[href*="/tools"]', ref='tools-tab')

# Add new tool
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool-btn')

# Search for Dataverse
mcp_playwright_browser_type(element='input[placeholder*="Search"]', ref='tool-search', text='Dataverse MCP Server')

# Select Dataverse MCP Server
mcp_playwright_browser_click(element='div:has-text("Dataverse MCP Server")', ref='dataverse-option')
mcp_playwright_browser_click(element='button:has-text("Dataverse MCP Server")', ref='dataverse-btn')

# Configure tool
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-to-agent-btn')
mcp_playwright_browser_wait_for(time=5)

# Verify tool addition
mcp_playwright_browser_snapshot()
```

### Tool Management
```bash
# Enable/disable tool
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable"]', ref='tool-toggle')
mcp_playwright_browser_click(element='div[role="switch"]', ref='toggle-switch')

# Tool settings
mcp_playwright_browser_click(element='button:has-text("More")', ref='tool-more-btn')
mcp_playwright_browser_click(element='button[aria-label="Settings"]', ref='tool-settings-btn')

# Delete tool
mcp_playwright_browser_click(element='button:has-text("Delete")', ref='delete-tool-btn')
```

## Publishing & Testing Commands

### Publishing Workflow
```bash
# Initiate publish
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish-btn')

# Confirm in dialog
mcp_playwright_browser_click(element='div[role="dialog"] button:has-text("Publish")', ref='confirm-publish')

# Wait for publishing
mcp_playwright_browser_wait_for(time=10)

# Close publishing dialog
mcp_playwright_browser_click(element='button:has-text("Close")', ref='close-publish-dialog')
```

### Testing Topics
```bash
# Open test panel
mcp_playwright_browser_click(element='button:has-text("Test")', ref='test-panel-btn')

# Send test message
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='test-input', text='{test_query}')
mcp_playwright_browser_click(element='button[aria-label="Send"]', ref='send-test-btn')

# Wait for response
mcp_playwright_browser_wait_for(time=5)

# Clear conversation
mcp_playwright_browser_click(element='button:has-text("Clear")', ref='clear-chat-btn')
```

## Dataverse Integration Commands

### Creating Data Tables
```bash
# Navigate to Dataverse
mcp_playwright_browser_navigate(url='https://make.powerapps.com/environments/{environment_id}/home')

# Create new table
mcp_playwright_browser_click(element='button:has-text("Create")', ref='create-table-btn')
mcp_playwright_browser_click(element='div:has-text("Table")', ref='table-option')

# Configure table
mcp_playwright_browser_type(element='input[aria-label="Display name"]', ref='table-name', text='{table_name}')
mcp_playwright_browser_type(element='input[aria-label="Plural name"]', ref='plural-name', text='{plural_name}')

# Add columns
mcp_playwright_browser_click(element='button:has-text("Add column")', ref='add-column-btn')
mcp_playwright_browser_type(element='input[aria-label="Display name"]', ref='column-name', text='{column_name}')
mcp_playwright_browser_click(element='select[aria-label="Data type"]', ref='data-type-select')
mcp_playwright_browser_click(element='option:has-text("{data_type}")', ref='data-type-option')

# Save table
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-table-btn')
```

### Connecting to Dataverse
```bash
# In agent tools section
mcp_playwright_browser_click(element='button:has-text("Configure")', ref='configure-dataverse-btn')

# Set connection string
mcp_playwright_browser_type(element='input[aria-label="Connection string"]', ref='connection-input', text='{dataverse_connection_string}')

# Test connection
mcp_playwright_browser_click(element='button:has-text("Test connection")', ref='test-connection-btn')

# Save configuration
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-config-btn')
```

## Knowledge Source Configuration Commands

### Adding Knowledge Sources
```bash
# Navigate to Knowledge tab
mcp_playwright_browser_click(element='a[href*="/knowledge"]', ref='knowledge-tab')

# Add knowledge source
mcp_playwright_browser_click(element='button:has-text("Add knowledge")', ref='add-knowledge-btn')

# Select source type
mcp_playwright_browser_click(element='div:has-text("Website")', ref='website-source')
mcp_playwright_browser_click(element='div:has-text("SharePoint")', ref='sharepoint-source')
mcp_playwright_browser_click(element='div:has-text("Dataverse")', ref='dataverse-source')

# Configure URL
mcp_playwright_browser_type(element='input[aria-label="URL"]', ref='knowledge-url', text='{knowledge_source_url}')

# Confirm ownership
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="ownership"]', ref='ownership-check')

# Add knowledge source
mcp_playwright_browser_click(element='button:has-text("Add")', ref='add-knowledge-source-btn')
```

### Managing Knowledge Sources
```bash
# Edit knowledge source
mcp_playwright_browser_click(element='button[aria-label="Edit"]', ref='edit-knowledge-btn')

# Update knowledge source
mcp_playwright_browser_click(element='button:has-text("Update")', ref='update-knowledge-btn')

# Delete knowledge source
mcp_playwright_browser_click(element='button[aria-label="Delete"]', ref='delete-knowledge-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-delete-btn')
```

## Trigger Configuration Commands

### Adding Triggers for Topics
```bash
# Navigate to Triggers tab
mcp_playwright_browser_click(element='a[href*="/triggers"]', ref='triggers-tab')

# Add new trigger
mcp_playwright_browser_click(element='button:has-text("Add trigger")', ref='add-trigger-btn')

# Configure trigger details
mcp_playwright_browser_type(element='input[aria-label="Trigger name"]', ref='trigger-name', text='{trigger_name}')
mcp_playwright_browser_type(element='textarea[aria-label="Trigger phrases"]', ref='trigger-phrases', text='{trigger_phrases}')

# Associate with topic
mcp_playwright_browser_click(element='select[aria-label="Associated topic"]', ref='topic-select')
mcp_playwright_browser_click(element='option:has-text("{associated_topic}")', ref='topic-option')

# Save trigger
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-trigger-btn')
mcp_playwright_browser_wait_for(time=3)
```

### Managing Triggers
```bash
# Edit existing trigger
mcp_playwright_browser_click(element='button[aria-label="Edit trigger"]', ref='edit-trigger-btn')

# Delete trigger
mcp_playwright_browser_click(element='button[aria-label="Delete trigger"]', ref='delete-trigger-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-delete-trigger-btn')
```

## Advanced Settings Configuration

### Accessing Settings
```bash
# Navigate to Settings tab
mcp_playwright_browser_click(element='a[href*="/settings"]', ref='settings-tab')
mcp_playwright_browser_wait_for(time=2)
```

### Generative AI Settings
```bash
# Access Generative AI sub-tab
mcp_playwright_browser_click(element='button:has-text("Generative AI")', ref='gen-ai-subtab')

# Enable/disable generative answers
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable generative answers"]', ref='gen-ai-toggle')

# Configure model
mcp_playwright_browser_click(element='select[aria-label="Model selection"]', ref='model-select')
mcp_playwright_browser_click(element='option:has-text("{model_name}")', ref='model-option')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-gen-ai-btn')
```

### Agent Details Settings
```bash
# Access Agent Details sub-tab
mcp_playwright_browser_click(element='button:has-text("Agent Details")', ref='agent-details-subtab')

# Update agent name
mcp_playwright_browser_type(element='input[aria-label="Agent name"]', ref='agent-name-update', text='{updated_agent_name}')

# Update description
mcp_playwright_browser_type(element='textarea[aria-label="Agent description"]', ref='agent-desc-update', text='{updated_description}')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-details-btn')
```

### Security Settings
```bash
# Access Security sub-tab
mcp_playwright_browser_click(element='button:has-text("Security")', ref='security-subtab')

# Configure authentication
mcp_playwright_browser_click(element='input[type="radio"][aria-label*="Manual authentication"]', ref='manual-auth-radio')
mcp_playwright_browser_click(element='input[type="radio"][aria-label*="Azure AD"]', ref='azure-ad-radio')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-security-btn')
```

## Skills Integration Commands

### Adding Skills to Agent
```bash
# Navigate to Skills tab
mcp_playwright_browser_click(element='a[href*="/skills"]', ref='skills-tab')

# Add new skill
mcp_playwright_browser_click(element='button:has-text("Add skill")', ref='add-skill-btn')

# Search for skill or flow
mcp_playwright_browser_type(element='input[placeholder*="Search skills"]', ref='skill-search', text='{skill_name}')

# Select skill
mcp_playwright_browser_click(element='div:has-text("{skill_name}")', ref='skill-option')

# Configure skill connection
mcp_playwright_browser_type(element='input[aria-label="Connection details"]', ref='skill-connection', text='{connection_details}')

# Add skill to agent
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-skill-to-agent-btn')
mcp_playwright_browser_wait_for(time=5)
```

### Managing Skills
```bash
# Enable/disable skill
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable skill"]', ref='skill-toggle')

# Edit skill configuration
mcp_playwright_browser_click(element='button[aria-label="Edit skill"]', ref='edit-skill-btn')

# Remove skill
mcp_playwright_browser_click(element='button[aria-label="Remove skill"]', ref='remove-skill-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-remove-skill-btn')
```

## Advanced Scenarios

### Auto-Scan Cases Agent Example
```bash
# Create agent with case scanning capability
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='agent-desc', text='Create an agent that auto scans the cases assigned to me against our knowledge source')

# Configure Dataverse connection for cases
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool')
mcp_playwright_browser_type(element='input[placeholder*="Search"]', ref='search', text='Dataverse')
mcp_playwright_browser_click(element='div:has-text("Dataverse MCP Server")', ref='select-dataverse')
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-dataverse')

# Create case scanning topic
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic')
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='blank-topic')
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='name', text='Scan My Cases')
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='desc', text='Automatically scans cases assigned to the current user and matches them against knowledge sources')

# Add query node
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node')
mcp_playwright_browser_click(element='button:has-text("Call an action")', ref='action-node')
mcp_playwright_browser_type(element='input[aria-label="Action"]', ref='action-name', text='Query Dataverse Cases')

# Configure case query
mcp_playwright_browser_type(element='textarea[aria-label="Query"]', ref='query-input', text='SELECT * FROM cases WHERE assigned_to = CURRENT_USER() AND status = "Open"')

# Add knowledge matching
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-match-node')
mcp_playwright_browser_click(element='button:has-text("Match against knowledge")', ref='knowledge-match')

# Save and publish
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save')
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish')
```

## Wait and Validation Commands

### Wait Operations
```bash
# Wait for specific time
mcp_playwright_browser_wait_for(time=1)  # 1 second
mcp_playwright_browser_wait_for(time=3)  # 3 seconds
mcp_playwright_browser_wait_for(time=5)  # 5 seconds
mcp_playwright_browser_wait_for(time=10) # 10 seconds

# Wait for element
mcp_playwright_browser_wait_for(element='button:has-text("Save"):not([disabled])')
mcp_playwright_browser_wait_for(element='div:has-text("Topic Saved!")')
```

### Screenshot Documentation
```bash
# Capture current state
mcp_playwright_browser_snapshot()
mcp_playwright_browser_take_screenshot(filename='current-state.png')

# Capture specific stages
mcp_playwright_browser_take_screenshot(filename='agent-created.png')
mcp_playwright_browser_take_screenshot(filename='topic-{topic_name}-created.png')
mcp_playwright_browser_take_screenshot(filename='tool-added.png')
mcp_playwright_browser_take_screenshot(filename='published-{timestamp}.png')
```

## Common UI Patterns

### Banner Notifications
```bash
# Success banners
element='div:has-text("Topic Saved!")'
element='div:has-text("Your agent was published")'
element='div:has-text("Tool added successfully")'

# Error banners
element='div:has-text("Error")'
element='div:has-text("Failed to save")'

# Close banner
mcp_playwright_browser_click(element='button[aria-label="Close"]', ref='close-banner')
```

### Loading States
```bash
# Wait for loading to complete
mcp_playwright_browser_wait_for(element='div:has-text("Saving..."):not([hidden])')
mcp_playwright_browser_wait_for(element='div:has-text("Publishing..."):not([hidden])')
mcp_playwright_browser_wait_for(element='div:has-text("Loading..."):not([hidden])')
```

## Error Handling & Recovery Commands

### Checking for Errors
```bash
# Check for error banner
mcp_playwright_browser_wait_for(element='div:has-text("Error")', ref='error-banner', timeout=2)
mcp_playwright_browser_take_screenshot(filename='error-detected.png')

# Check for disabled buttons indicating failure
mcp_playwright_browser_wait_for(element='button:has-text("Save")[disabled]', ref='disabled-save-btn', timeout=2)
```

### Recovery Steps
```bash
# Retry click operation on failure
mcp_playwright_browser_click(element='button:has-text("Retry")', ref='retry-btn')
mcp_playwright_browser_wait_for(time=3)

# Refresh page on UI stall
mcp_playwright_browser_navigate(url='window.location.reload()')
mcp_playwright_browser_wait_for(time=5)
mcp_playwright_browser_take_screenshot(filename='page-refreshed.png')

# Navigate back to previous step on error
mcp_playwright_browser_click(element='button:has-text("Back")', ref='back-on-error')
mcp_playwright_browser_wait_for(time=2)

# Log error for manual intervention
mcp_playwright_browser_snapshot()
# Note: If error persists, halt script and prompt for manual intervention with detailed error log.
```

## Validation Checklists

### Agent Creation Validation
```markdown
# Checklist for agent creation success
- [ ] Agent Name: '{agent_name}' visible in overview
- [ ] Environment: '<ENVIRONMENT_NAME>' confirmed in selector
- [ ] Purpose: '{agent_purpose}' reflected in description
- [ ] Knowledge Sources: At least 1 URL added and confirmed
- [ ] Creation Status: URL changed to '/bots/[AGENT-ID]/overview'
- [ ] Success Banner: 'Agent created successfully' visible
```

### Topic Configuration Validation
```markdown
# Checklist for topic configuration
- [ ] Topic Name: '{topic_name}' listed in Topics tab
- [ ] Description: '{topic_description}' visible in topic details
- [ ] Message Node: '{user_friendly_message}' configured
- [ ] Save Status: 'Topic Saved!' banner appeared
- [ ] Enabled: Topic toggle shows 'On'
```

### Publishing Validation
```markdown
# Checklist for publishing success
- [ ] Publish Button: Clicked and dialog appeared
- [ ] Confirmation: 'Publish' confirmed in dialog
- [ ] Status: 'Your agent was published at {time}' banner visible
- [ ] Agent Status: Shows 'Live' in overview
```

### Testing Validation
```markdown
# Checklist for testing functionality
- [ ] Test Panel: Opened successfully
- [ ] Test Input: '{test_query}' sent
- [ ] Response: Agent replied with relevant content
- [ ] Screenshot: Captured for verification
```

## Notes on Usage

1. **Element Selection Priority**:
   - Use `aria-label` when available for accessibility
   - Fall back to `:has-text()` for visible text
   - Use `data-testid` for stable test selectors
   - Use CSS selectors for specific styling

2. **Wait Times**:
   - 1 second: Quick UI updates
   - 3 seconds: Save operations
   - 5 seconds: Navigation and tool additions
   - 10 seconds: Publishing operations

3. **Error Handling**:
   - Always check for disabled state before clicking
   - Wait for loading states to complete
   - Capture screenshots on errors
   - Use retry mechanisms for transient failures
   - Log detailed errors for manual intervention

4. **Modularity**:
   - Each command is self-contained
   - Variables in `{brackets}` for customization
   - Commands can be combined for complex workflows
```

## Summary of Enhancements

The updated `PowerAgentBuilder.md` now includes the following additions and improvements based on our conversation history and previous responses:
- **Environment Validation**: Added critical validation steps for ensuring the correct environment (e.g., '<ENVIRONMENT_NAME>') is selected.
- **Trigger Configuration Commands**: New section for adding and managing triggers for topics, aligning with detailed workflows from `PowerInventoryAgent.md`.
- **Advanced Settings Configuration**: Added commands for configuring settings like Generative AI, Agent Details, and Security, inspired by `Game2.md`.
- **Skills Integration Commands**: New section for integrating external skills or Power Automate flows, enhancing agent capabilities.
- **Error Handling & Recovery Commands**: Expanded error handling with specific checks and recovery steps for robust automation.
- **Validation Checklists**: Structured checklists for agent creation, topic configuration, publishing, and testing to ensure all steps are completed and verified.

These enhancements make `PowerAgentBuilder.md` a more comprehensive and unambiguous reference for building agents in Copilot Studio using MCP commands.<!-- filepath: d:\dplat\Power MCP UI Topic Builder\PowerAgentBuilder.md -->
# Comprehensive MCP Command Reference for Copilot Studio Agent Building

## Table of Contents
1. [Browser Connection & Navigation Commands](#browser-connection--navigation-commands)
2. [UI Element Interaction Commands](#ui-element-interaction-commands)
3. [Agent Creation Commands](#agent-creation-commands)
4. [Topic Management Commands](#topic-management-commands)
5. [Tool Integration Commands](#tool-integration-commands)
6. [Publishing & Testing Commands](#publishing--testing-commands)
7. [Dataverse Integration Commands](#dataverse-integration-commands)
8. [Knowledge Source Configuration Commands](#knowledge-source-configuration-commands)
9. [Trigger Configuration Commands](#trigger-configuration-commands)
10. [Advanced Settings Configuration](#advanced-settings-configuration)
11. [Skills Integration Commands](#skills-integration-commands)
12. [Error Handling & Recovery Commands](#error-handling--recovery-commands)
13. [Validation Checklists](#validation-checklists)

## Browser Connection & Navigation Commands

### Initial Browser Setup
```bash
# Connect to existing browser instance
mcp_playwright_browser_snapshot()

# Navigate to Copilot Studio
mcp_playwright_browser_navigate(url='https://copilotstudio.microsoft.com')

# Navigate to specific environment
mcp_playwright_browser_navigate(url='https://copilotstudio.preview.microsoft.com/environments/{environment_id}/home')
```

### Environment Selection
```bash
# Click environment selector
mcp_playwright_browser_click(element='div[class*="environment-selector"]', ref='env-selector')
mcp_playwright_browser_click(element='span:has-text("<ORG_NAME> (default)")', ref='current-env')

# Select specific environment
mcp_playwright_browser_click(element='button[aria-label*="<ENVIRONMENT_NAME>"]', ref='<ENVIRONMENT_NAME>-env')
mcp_playwright_browser_click(element='div:has-text("<ENVIRONMENT_NAME>")', ref='env-option')
```

### Environment Validation (Critical)
```bash
# Validate current environment
mcp_playwright_browser_wait_for(element='div:has-text("<ENVIRONMENT_NAME>")', ref='env-confirmation')
mcp_playwright_browser_take_screenshot(filename='environment-validation.png')
# Note: If '<ENVIRONMENT_NAME>' is not visible, halt script and prompt for manual environment switch or confirmation.
```

### Tab Navigation
```bash
# Navigate to Agents tab
mcp_playwright_browser_click(element='a[href*="/agents"]', ref='agents-tab')
mcp_playwright_browser_click(element='button:has-text("Agents")', ref='agents-nav')
mcp_playwright_browser_click(element='div[role="tab"]:has-text("Agents")', ref='agents-tab-div')

# Navigate to Topics tab
mcp_playwright_browser_click(element='a[href*="/topics"]', ref='topics-tab')
mcp_playwright_browser_click(element='button:has-text("Topics")', ref='topics-nav')
mcp_playwright_browser_click(element='span:has-text("Topics")', ref='topics-span')

# Navigate to Tools tab
mcp_playwright_browser_click(element='a[href*="/tools"]', ref='tools-tab')
mcp_playwright_browser_click(element='button:has-text("Tools")', ref='tools-nav')
```

## UI Element Interaction Commands

### Text Input Fields
```bash
# Topic name input
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='topic-name-input', text='{topic_name}')
mcp_playwright_browser_type(element='input[placeholder*="name"]', ref='name-field', text='{name}')

# Description textarea
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='description-input', text='{description}')
mcp_playwright_browser_type(element='textarea[placeholder*="Describe"]', ref='desc-field', text='{description_text}')

# Message content textarea
mcp_playwright_browser_type(element='textarea[aria-label="Message"]', ref='message-input', text='{message_content}')
mcp_playwright_browser_type(element='div[contenteditable="true"]', ref='rich-text-editor', text='{formatted_message}')

# Test chat input
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='test-input', text='{test_message}')
mcp_playwright_browser_type(element='input[aria-label="Type a message"]', ref='chat-input', text='{chat_text}')
```

### Buttons
```bash
# Save button variations
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-btn')
mcp_playwright_browser_click(element='button[aria-label="Save"]', ref='save-aria-btn')
mcp_playwright_browser_click(element='button[data-testid="save-button"]', ref='save-test-btn')

# Publish button variations
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish-btn')
mcp_playwright_browser_click(element='button[aria-label="Publish agent"]', ref='publish-agent-btn')
mcp_playwright_browser_click(element='div[role="button"]:has-text("Publish")', ref='publish-div-btn')

# Add/Create buttons
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic-btn')
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool-btn')
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node-btn')
mcp_playwright_browser_click(element='button:has-text("Create")', ref='create-btn')

# Navigation buttons
mcp_playwright_browser_click(element='button:has-text("Back")', ref='back-btn')
mcp_playwright_browser_click(element='button[aria-label="Go back"]', ref='back-aria-btn')
mcp_playwright_browser_click(element='a:has-text("Back")', ref='back-link')
```

### Dropdown Menus
```bash
# Topic creation dropdown
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='from-blank-option')
mcp_playwright_browser_click(element='div[role="menuitem"]:has-text("From blank")', ref='blank-menu-item')
mcp_playwright_browser_click(element='li:has-text("Add from description with Copilot")', ref='copilot-option')

# Node type selection
mcp_playwright_browser_click(element='button:has-text("Send a message")', ref='message-node-option')
mcp_playwright_browser_click(element='div:has-text("Ask a question")', ref='question-node-option')
mcp_playwright_browser_click(element='span:has-text("Call an action")', ref='action-node-option')
```

### Dialogs and Modals
```bash
# Dialog confirmation
mcp_playwright_browser_click(element='button:has-text("Leave")', ref='leave-dialog-btn')
mcp_playwright_browser_click(element='button:has-text("Don\'t leave")', ref='stay-dialog-btn')
mcp_playwright_browser_click(element='button:has-text("Close")', ref='close-dialog-btn')

# Publish confirmation
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='confirm-publish-btn')
mcp_playwright_browser_click(element='div[role="dialog"] button:has-text("Publish")', ref='dialog-publish-btn')
```

## Agent Creation Commands

### Initial Agent Creation Flow
```bash
# Start new agent creation
mcp_playwright_browser_click(element='button:has-text("New agent")', ref='new-agent-btn')
mcp_playwright_browser_click(element='a[href*="/create"]', ref='create-link')

# Agent description input (conversational)
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='agent-desc-input', text='I want to create an agent named "{agent_name}" that {agent_purpose}')

# Send description
mcp_playwright_browser_click(element='button[aria-label="Send"]', ref='send-desc-btn')
mcp_playwright_browser_click(element='button:has-text("Send"):not([disabled])', ref='send-enabled-btn')

# Wait for response
mcp_playwright_browser_wait_for(time=5)
```

### Agent Configuration
```bash
# Add instructions
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='instruction-input', text='For {function_name}, the agent should: {detailed_instructions}')

# Knowledge source configuration
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='knowledge-input', text='Yes, I would like to add these knowledge sources:\n1. {url1}\n2. {url2}\n3. {url3}')

# Ownership confirmation checkboxes
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Confirm"]', ref='ownership-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(1)', ref='first-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(2)', ref='second-checkbox')
mcp_playwright_browser_click(element='input[type="checkbox"]:nth-of-type(3)', ref='third-checkbox')
```

## Topic Management Commands

### Topic Creation Workflow
```bash
# Add new topic
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic-btn')
mcp_playwright_browser_wait_for(time=1)

# Select creation method
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='blank-topic-option')

# Configure topic details
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='topic-name', text='{topic_name}')
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='topic-desc', text='{topic_description}')

# Add message node
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node-btn')
mcp_playwright_browser_click(element='button:has-text("Send a message")', ref='message-node-btn')

# Configure message content
mcp_playwright_browser_type(element='textarea[aria-label="Message"]', ref='message-content', text='{user_friendly_message}')

# Save topic
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-topic-btn')
mcp_playwright_browser_wait_for(time=3)
```

### Topic List Management
```bash
# Filter topics
mcp_playwright_browser_click(element='button:has-text("Custom")', ref='custom-topics-filter')
mcp_playwright_browser_click(element='button:has-text("System")', ref='system-topics-filter')

# Refresh topics
mcp_playwright_browser_click(element='button[aria-label="Refresh"]', ref='refresh-topics-btn')
mcp_playwright_browser_click(element='button:has-text("Refresh topics")', ref='refresh-text-btn')

# Access specific topic
mcp_playwright_browser_click(element='a:has-text("{topic_name}")', ref='topic-link')
mcp_playwright_browser_click(element='div[role="row"]:has-text("{topic_name}")', ref='topic-row')
```

## Tool Integration Commands

### Dataverse MCP Server Integration
```bash
# Navigate to tools
mcp_playwright_browser_click(element='a[href*="/tools"]', ref='tools-tab')

# Add new tool
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool-btn')

# Search for Dataverse
mcp_playwright_browser_type(element='input[placeholder*="Search"]', ref='tool-search', text='Dataverse MCP Server')

# Select Dataverse MCP Server
mcp_playwright_browser_click(element='div:has-text("Dataverse MCP Server")', ref='dataverse-option')
mcp_playwright_browser_click(element='button:has-text("Dataverse MCP Server")', ref='dataverse-btn')

# Configure tool
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-to-agent-btn')
mcp_playwright_browser_wait_for(time=5)

# Verify tool addition
mcp_playwright_browser_snapshot()
```

### Tool Management
```bash
# Enable/disable tool
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable"]', ref='tool-toggle')
mcp_playwright_browser_click(element='div[role="switch"]', ref='toggle-switch')

# Tool settings
mcp_playwright_browser_click(element='button:has-text("More")', ref='tool-more-btn')
mcp_playwright_browser_click(element='button[aria-label="Settings"]', ref='tool-settings-btn')

# Delete tool
mcp_playwright_browser_click(element='button:has-text("Delete")', ref='delete-tool-btn')
```

## Publishing & Testing Commands

### Publishing Workflow
```bash
# Initiate publish
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish-btn')

# Confirm in dialog
mcp_playwright_browser_click(element='div[role="dialog"] button:has-text("Publish")', ref='confirm-publish')

# Wait for publishing
mcp_playwright_browser_wait_for(time=10)

# Close publishing dialog
mcp_playwright_browser_click(element='button:has-text("Close")', ref='close-publish-dialog')
```

### Testing Topics
```bash
# Open test panel
mcp_playwright_browser_click(element='button:has-text("Test")', ref='test-panel-btn')

# Send test message
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='test-input', text='{test_query}')
mcp_playwright_browser_click(element='button[aria-label="Send"]', ref='send-test-btn')

# Wait for response
mcp_playwright_browser_wait_for(time=5)

# Clear conversation
mcp_playwright_browser_click(element='button:has-text("Clear")', ref='clear-chat-btn')
```

## Dataverse Integration Commands

### Creating Data Tables
```bash
# Navigate to Dataverse
mcp_playwright_browser_navigate(url='https://make.powerapps.com/environments/{environment_id}/home')

# Create new table
mcp_playwright_browser_click(element='button:has-text("Create")', ref='create-table-btn')
mcp_playwright_browser_click(element='div:has-text("Table")', ref='table-option')

# Configure table
mcp_playwright_browser_type(element='input[aria-label="Display name"]', ref='table-name', text='{table_name}')
mcp_playwright_browser_type(element='input[aria-label="Plural name"]', ref='plural-name', text='{plural_name}')

# Add columns
mcp_playwright_browser_click(element='button:has-text("Add column")', ref='add-column-btn')
mcp_playwright_browser_type(element='input[aria-label="Display name"]', ref='column-name', text='{column_name}')
mcp_playwright_browser_click(element='select[aria-label="Data type"]', ref='data-type-select')
mcp_playwright_browser_click(element='option:has-text("{data_type}")', ref='data-type-option')

# Save table
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-table-btn')
```

### Connecting to Dataverse
```bash
# In agent tools section
mcp_playwright_browser_click(element='button:has-text("Configure")', ref='configure-dataverse-btn')

# Set connection string
mcp_playwright_browser_type(element='input[aria-label="Connection string"]', ref='connection-input', text='{dataverse_connection_string}')

# Test connection
mcp_playwright_browser_click(element='button:has-text("Test connection")', ref='test-connection-btn')

# Save configuration
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-config-btn')
```

## Knowledge Source Configuration Commands

### Adding Knowledge Sources
```bash
# Navigate to Knowledge tab
mcp_playwright_browser_click(element='a[href*="/knowledge"]', ref='knowledge-tab')

# Add knowledge source
mcp_playwright_browser_click(element='button:has-text("Add knowledge")', ref='add-knowledge-btn')

# Select source type
mcp_playwright_browser_click(element='div:has-text("Website")', ref='website-source')
mcp_playwright_browser_click(element='div:has-text("SharePoint")', ref='sharepoint-source')
mcp_playwright_browser_click(element='div:has-text("Dataverse")', ref='dataverse-source')

# Configure URL
mcp_playwright_browser_type(element='input[aria-label="URL"]', ref='knowledge-url', text='{knowledge_source_url}')

# Confirm ownership
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="ownership"]', ref='ownership-check')

# Add knowledge source
mcp_playwright_browser_click(element='button:has-text("Add")', ref='add-knowledge-source-btn')
```

### Managing Knowledge Sources
```bash
# Edit knowledge source
mcp_playwright_browser_click(element='button[aria-label="Edit"]', ref='edit-knowledge-btn')

# Update knowledge source
mcp_playwright_browser_click(element='button:has-text("Update")', ref='update-knowledge-btn')

# Delete knowledge source
mcp_playwright_browser_click(element='button[aria-label="Delete"]', ref='delete-knowledge-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-delete-btn')
```

## Trigger Configuration Commands

### Adding Triggers for Topics
```bash
# Navigate to Triggers tab
mcp_playwright_browser_click(element='a[href*="/triggers"]', ref='triggers-tab')

# Add new trigger
mcp_playwright_browser_click(element='button:has-text("Add trigger")', ref='add-trigger-btn')

# Configure trigger details
mcp_playwright_browser_type(element='input[aria-label="Trigger name"]', ref='trigger-name', text='{trigger_name}')
mcp_playwright_browser_type(element='textarea[aria-label="Trigger phrases"]', ref='trigger-phrases', text='{trigger_phrases}')

# Associate with topic
mcp_playwright_browser_click(element='select[aria-label="Associated topic"]', ref='topic-select')
mcp_playwright_browser_click(element='option:has-text("{associated_topic}")', ref='topic-option')

# Save trigger
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-trigger-btn')
mcp_playwright_browser_wait_for(time=3)
```

### Managing Triggers
```bash
# Edit existing trigger
mcp_playwright_browser_click(element='button[aria-label="Edit trigger"]', ref='edit-trigger-btn')

# Delete trigger
mcp_playwright_browser_click(element='button[aria-label="Delete trigger"]', ref='delete-trigger-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-delete-trigger-btn')
```

## Advanced Settings Configuration

### Accessing Settings
```bash
# Navigate to Settings tab
mcp_playwright_browser_click(element='a[href*="/settings"]', ref='settings-tab')
mcp_playwright_browser_wait_for(time=2)
```

### Generative AI Settings
```bash
# Access Generative AI sub-tab
mcp_playwright_browser_click(element='button:has-text("Generative AI")', ref='gen-ai-subtab')

# Enable/disable generative answers
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable generative answers"]', ref='gen-ai-toggle')

# Configure model
mcp_playwright_browser_click(element='select[aria-label="Model selection"]', ref='model-select')
mcp_playwright_browser_click(element='option:has-text("{model_name}")', ref='model-option')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-gen-ai-btn')
```

### Agent Details Settings
```bash
# Access Agent Details sub-tab
mcp_playwright_browser_click(element='button:has-text("Agent Details")', ref='agent-details-subtab')

# Update agent name
mcp_playwright_browser_type(element='input[aria-label="Agent name"]', ref='agent-name-update', text='{updated_agent_name}')

# Update description
mcp_playwright_browser_type(element='textarea[aria-label="Agent description"]', ref='agent-desc-update', text='{updated_description}')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-details-btn')
```

### Security Settings
```bash
# Access Security sub-tab
mcp_playwright_browser_click(element='button:has-text("Security")', ref='security-subtab')

# Configure authentication
mcp_playwright_browser_click(element='input[type="radio"][aria-label*="Manual authentication"]', ref='manual-auth-radio')
mcp_playwright_browser_click(element='input[type="radio"][aria-label*="Azure AD"]', ref='azure-ad-radio')

# Save settings
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save-security-btn')
```

## Skills Integration Commands

### Adding Skills to Agent
```bash
# Navigate to Skills tab
mcp_playwright_browser_click(element='a[href*="/skills"]', ref='skills-tab')

# Add new skill
mcp_playwright_browser_click(element='button:has-text("Add skill")', ref='add-skill-btn')

# Search for skill or flow
mcp_playwright_browser_type(element='input[placeholder*="Search skills"]', ref='skill-search', text='{skill_name}')

# Select skill
mcp_playwright_browser_click(element='div:has-text("{skill_name}")', ref='skill-option')

# Configure skill connection
mcp_playwright_browser_type(element='input[aria-label="Connection details"]', ref='skill-connection', text='{connection_details}')

# Add skill to agent
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-skill-to-agent-btn')
mcp_playwright_browser_wait_for(time=5)
```

### Managing Skills
```bash
# Enable/disable skill
mcp_playwright_browser_click(element='input[type="checkbox"][aria-label*="Enable skill"]', ref='skill-toggle')

# Edit skill configuration
mcp_playwright_browser_click(element='button[aria-label="Edit skill"]', ref='edit-skill-btn')

# Remove skill
mcp_playwright_browser_click(element='button[aria-label="Remove skill"]', ref='remove-skill-btn')
mcp_playwright_browser_click(element='button:has-text("Confirm")', ref='confirm-remove-skill-btn')
```

## Advanced Scenarios

### Auto-Scan Cases Agent Example
```bash
# Create agent with case scanning capability
mcp_playwright_browser_type(element='textarea[placeholder="Type your message"]', ref='agent-desc', text='Create an agent that auto scans the cases assigned to me against our knowledge source')

# Configure Dataverse connection for cases
mcp_playwright_browser_click(element='button:has-text("Add a tool")', ref='add-tool')
mcp_playwright_browser_type(element='input[placeholder*="Search"]', ref='search', text='Dataverse')
mcp_playwright_browser_click(element='div:has-text("Dataverse MCP Server")', ref='select-dataverse')
mcp_playwright_browser_click(element='button:has-text("Add to agent")', ref='add-dataverse')

# Create case scanning topic
mcp_playwright_browser_click(element='button:has-text("Add a topic")', ref='add-topic')
mcp_playwright_browser_click(element='button:has-text("From blank")', ref='blank-topic')
mcp_playwright_browser_type(element='input[aria-label="Topic name"]', ref='name', text='Scan My Cases')
mcp_playwright_browser_type(element='textarea[aria-label="Description"]', ref='desc', text='Automatically scans cases assigned to the current user and matches them against knowledge sources')

# Add query node
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-node')
mcp_playwright_browser_click(element='button:has-text("Call an action")', ref='action-node')
mcp_playwright_browser_type(element='input[aria-label="Action"]', ref='action-name', text='Query Dataverse Cases')

# Configure case query
mcp_playwright_browser_type(element='textarea[aria-label="Query"]', ref='query-input', text='SELECT * FROM cases WHERE assigned_to = CURRENT_USER() AND status = "Open"')

# Add knowledge matching
mcp_playwright_browser_click(element='button:has-text("Add node")', ref='add-match-node')
mcp_playwright_browser_click(element='button:has-text("Match against knowledge")', ref='knowledge-match')

# Save and publish
mcp_playwright_browser_click(element='button:has-text("Save")', ref='save')
mcp_playwright_browser_click(element='button:has-text("Publish")', ref='publish')
```

## Wait and Validation Commands

### Wait Operations
```bash
# Wait for specific time
mcp_playwright_browser_wait_for(time=1)  # 1 second
mcp_playwright_browser_wait_for(time=3)  # 3 seconds
mcp_playwright_browser_wait_for(time=5)  # 5 seconds
mcp_playwright_browser_wait_for(time=10) # 10 seconds

# Wait for element
mcp_playwright_browser_wait_for(element='button:has-text("Save"):not([disabled])')
mcp_playwright_browser_wait_for(element='div:has-text("Topic Saved!")')
```

### Screenshot Documentation
```bash
# Capture current state
mcp_playwright_browser_snapshot()
mcp_playwright_browser_take_screenshot(filename='current-state.png')

# Capture specific stages
mcp_playwright_browser_take_screenshot(filename='agent-created.png')
mcp_playwright_browser_take_screenshot(filename='topic-{topic_name}-created.png')
mcp_playwright_browser_take_screenshot(filename='tool-added.png')
mcp_playwright_browser_take_screenshot(filename='published-{timestamp}.png')
```

## Common UI Patterns

### Banner Notifications
```bash
# Success banners
element='div:has-text("Topic Saved!")'
element='div:has-text("Your agent was published")'
element='div:has-text("Tool added successfully")'

# Error banners
element='div:has-text("Error")'
element='div:has-text("Failed to save")'

# Close banner
mcp_playwright_browser_click(element='button[aria-label="Close"]', ref='close-banner')
```

### Loading States
```bash
# Wait for loading to complete
mcp_playwright_browser_wait_for(element='div:has-text("Saving..."):not([hidden])')
mcp_playwright_browser_wait_for(element='div:has-text("Publishing..."):not([hidden])')
mcp_playwright_browser_wait_for(element='div:has-text("Loading..."):not([hidden])')
```

## Error Handling & Recovery Commands

### Checking for Errors
```bash
# Check for error banner
mcp_playwright_browser_wait_for(element='div:has-text("Error")', ref='error-banner', timeout=2)
mcp_playwright_browser_take_screenshot(filename='error-detected.png')

# Check for disabled buttons indicating failure
mcp_playwright_browser_wait_for(element='button:has-text("Save")[disabled]', ref='disabled-save-btn', timeout=2)
```

### Recovery Steps
```bash
# Retry click operation on failure
mcp_playwright_browser_click(element='button:has-text("Retry")', ref='retry-btn')
mcp_playwright_browser_wait_for(time=3)

# Refresh page on UI stall
mcp_playwright_browser_navigate(url='window.location.reload()')
mcp_playwright_browser_wait_for(time=5)
mcp_playwright_browser_take_screenshot(filename='page-refreshed.png')

# Navigate back to previous step on error
mcp_playwright_browser_click(element='button:has-text("Back")', ref='back-on-error')
mcp_playwright_browser_wait_for(time=2)

# Log error for manual intervention
mcp_playwright_browser_snapshot()
# Note: If error persists, halt script and prompt for manual intervention with detailed error log.
```

## Validation Checklists

### Agent Creation Validation
```markdown
# Checklist for agent creation success
- [ ] Agent Name: '{agent_name}' visible in overview
- [ ] Environment: '<ENVIRONMENT_NAME>' confirmed in selector
- [ ] Purpose: '{agent_purpose}' reflected in description
- [ ] Knowledge Sources: At least 1 URL added and confirmed
- [ ] Creation Status: URL changed to '/bots/[AGENT-ID]/overview'
- [ ] Success Banner: 'Agent created successfully' visible
```

### Topic Configuration Validation
```markdown
# Checklist for topic configuration
- [ ] Topic Name: '{topic_name}' listed in Topics tab
- [ ] Description: '{topic_description}' visible in topic details
- [ ] Message Node: '{user_friendly_message}' configured
- [ ] Save Status: 'Topic Saved!' banner appeared
- [ ] Enabled: Topic toggle shows 'On'
```

### Publishing Validation
```markdown
# Checklist for publishing success
- [ ] Publish Button: Clicked and dialog appeared
- [ ] Confirmation: 'Publish' confirmed in dialog
- [ ] Status: 'Your agent was published at {time}' banner visible
- [ ] Agent Status: Shows 'Live' in overview
```

### Testing Validation
```markdown
# Checklist for testing functionality
- [ ] Test Panel: Opened successfully
- [ ] Test Input: '{test_query}' sent
- [ ] Response: Agent replied with relevant content
- [ ] Screenshot: Captured for verification
```

## Notes on Usage

1. **Element Selection Priority**:
   - Use `aria-label` when available for accessibility
   - Fall back to `:has-text()` for visible text
   - Use `data-testid` for stable test selectors
   - Use CSS selectors for specific styling

2. **Wait Times**:
   - 1 second: Quick UI updates
   - 3 seconds: Save operations
   - 5 seconds: Navigation and tool additions
   - 10 seconds: Publishing operations

3. **Error Handling**:
   - Always check for disabled state before clicking
   - Wait for loading states to complete
   - Capture screenshots on errors
   - Use retry mechanisms for transient failures
   - Log detailed errors for manual intervention

4. **Modularity**:
   - Each command is self-contained
   - Variables in `{brackets}` for customization
   - Commands can be combined for complex workflows
```

## Summary of Enhancements

The updated `PowerAgentBuilder.md` now includes the following additions and improvements based on our conversation history and previous responses:
- **Environment Validation**: Added critical validation steps for ensuring the correct environment (e.g., '<ENVIRONMENT_NAME>') is selected.
- **Trigger Configuration Commands**: New section for adding and managing triggers for topics, aligning with detailed workflows from `PowerInventoryAgent.md`.
- **Advanced Settings Configuration**: Added commands for configuring settings like Generative AI, Agent Details, and Security, inspired by `Game2.md`.
- **Skills Integration Commands**: New section for integrating external skills or Power Automate flows, enhancing agent capabilities.
- **Error Handling & Recovery Commands**: Expanded error handling with specific checks and recovery steps for robust automation.
- **Validation Checklists**: Structured checklists for agent creation, topic configuration, publishing, and testing to ensure all steps are completed and verified.

These enhancements make `PowerAgentBuilder.md` a more comprehensive and unambiguous reference for building agents in Copilot Studio using MCP commands.