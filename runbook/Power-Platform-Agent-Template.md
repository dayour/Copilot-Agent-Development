# POWER PLATFORM COPILOT STUDIO AGENT TEMPLATE

**Template Version**: 1.0  
**Created**: June 18, 2025  
**Based on**: Comprehensive audit of Game1-3.md, Lab1-4 MCP logs, L1-L3 agent reports  
**Methodology**: UI-driven MCP browser automation  

---

##  TEMPLATE OVERVIEW

This template provides a standardized approach for creating production-ready Copilot Studio agents across Power Platform environments. Based on extensive audit of successful agent implementations, this template ensures consistency, best practices, and enterprise-grade deployment.

### **Template Scope**
- [x] **Agent Creation Workflow** - Step-by-step MCP command sequences
- [x] **Configuration Standards** - Proven settings and best practices  
- [x] **Knowledge Sources** - Standardized documentation integration
- [x] **Tools & Integrations** - Common connectors and capabilities
- [x] **Topics & Triggers** - Reusable conversation patterns
- [x] **Testing & Validation** - Comprehensive quality assurance
- [x] **Publishing & Deployment** - Production readiness checklist

---

##  AGENT CREATION WORKFLOW

### **Phase 1: Environment Setup & Preparation**

#### **Pre-Requirements Checklist**
```markdown
- [ ] Power Platform environment access confirmed
- [ ] Appropriate environment selected (production vs. test)
- [ ] User permissions validated (Environment Maker + System Administrator)
- [ ] Browser configured (Edge/Chrome with MCP connection)
- [ ] Agent requirements documented (purpose, scope, integrations)
```

#### **MCP Command Sequence 1: Initial Setup**
```javascript
// Command 1: Launch browser and navigate to Copilot Studio
d94_playwright_navigate({
    url: 'https://copilotstudio.microsoft.com',
    browserType: 'chromium', // or 'firefox', 'webkit'
    headless: false,
    width: 1280,
    height: 720
});

// Command 2: Take initial screenshot for audit trail
d94_playwright_screenshot({
    name: 'initial-copilot-studio-page',
    storeBase64: true,
    savePng: true
});

// Command 3: Verify environment selection
d94_playwright_click({
    selector: '[data-testid="environment-selector"]'
});

d94_playwright_screenshot({
    name: 'environment-dropdown',
    storeBase64: true
});
```

### **Phase 2: Agent Creation & Configuration**

#### **MCP Command Sequence 2: Agent Creation**
```javascript
// Command 4: Click Create Agent
d94_playwright_click({
    selector: 'button[aria-label="Create agent"], button:has-text("Create agent")'
});

// Command 5: Wait for creation interface
d94_playwright_wait_for({
    time: 3
});

// Command 6: Take screenshot of creation interface
d94_playwright_screenshot({
    name: 'agent-creation-interface',
    storeBase64: true
});

// Command 7: Enter agent description
d94_playwright_fill({
    selector: 'textarea[placeholder*="describe what your agent should do"]',
    value: '{{AGENT_DESCRIPTION}}' // Template variable
});

// Command 8: Click Create button
d94_playwright_click({
    selector: 'button:has-text("Create")'
});

// Command 9: Wait for conversational setup
d94_playwright_wait_for({
    time: 5
});
```

#### **Template Variables for Agent Description**
```yaml
# Customer Service Agent Template
AGENT_DESCRIPTION: |
  "An L1 customer-facing agent that provides comprehensive support including:
  - Product information and recommendations
  - Order status checking and tracking
  - Basic technical troubleshooting and setup guidance
  - Account management and information updates
  - Refund and return processing within policy limits
  - Warranty information and claim initiation
  - Escalation to human agents for complex issues
  The agent maintains a professional, empathetic tone and follows company policies."

# IT Support Agent Template  
AGENT_DESCRIPTION: |
  "An IT support agent specializing in:
  - Hardware and software troubleshooting
  - System configuration and setup assistance
  - Network connectivity and security issues
  - User account management and permissions
  - Software installation and updates
  - Ticket creation and tracking
  - Knowledge base documentation
  - Escalation to specialized teams when needed"

# HR Support Agent Template
AGENT_DESCRIPTION: |
  "An HR support agent that assists employees with:
  - Benefits information and enrollment
  - Policy questions and clarifications
  - Leave requests and time-off policies
  - Performance review processes
  - Training and development resources
  - Compliance and safety procedures
  - Internal escalation procedures
  - Confidential handling of sensitive information"
```

### **Phase 3: Conversational Agent Definition**

#### **MCP Command Sequence 3: Task Definition**
```javascript
// Command 10: Respond to Copilot questions about tasks
d94_playwright_fill({
    selector: 'textarea[placeholder*="Tell me more"], input[type="text"]',
    value: '{{AGENT_TASKS}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

// Command 11: Wait for next question
d94_playwright_wait_for({
    time: 3
});

// Command 12: Document conversation state
d94_playwright_screenshot({
    name: 'task-definition-complete',
    storeBase64: true
});
```

#### **Standard Task Templates**
```yaml
# L1 Customer Service Tasks
AGENT_TASKS: |
  "The agent should:
  1) Provide detailed product information and specifications
  2) Check order status and tracking information
  3) Help with basic troubleshooting for common product issues
  4) Handle return and exchange requests within policy limits
  5) Process refund requests following company guidelines
  6) Update customer account information and preferences
  7) Escalate complex issues to human agents when needed
  8) Maintain professional, empathetic communication throughout"

# IT Support Tasks
AGENT_TASKS: |
  "The agent should:
  1) Diagnose and resolve common hardware/software issues
  2) Guide users through system configuration and setup
  3) Troubleshoot network connectivity and security problems
  4) Assist with user account management and password resets
  5) Provide software installation and update guidance
  6) Create and track IT support tickets
  7) Search and reference internal knowledge base
  8) Escalate complex technical issues to specialized teams"
```

### **Phase 4: Guidelines & Behavioral Configuration**

#### **MCP Command Sequence 4: Guidelines Definition**
```javascript
// Command 13: Define interaction guidelines
d94_playwright_fill({
    selector: 'textarea[placeholder*="guidelines"], textarea[placeholder*="best practices"]',
    value: '{{AGENT_GUIDELINES}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

// Command 14: Wait for processing
d94_playwright_wait_for({
    time: 4
});

// Command 15: Capture guidelines configuration
d94_playwright_screenshot({
    name: 'guidelines-configuration',
    storeBase64: true
});
```

#### **Standard Guidelines Templates**
```yaml
# Professional Customer Service Guidelines
AGENT_GUIDELINES: |
  "The agent should follow these guidelines:
  1) Always be polite, professional, and empathetic in all interactions
  2) Use clear, jargon-free language and provide step-by-step instructions
  3) Ask clarifying questions when requests are ambiguous or incomplete
  4) Acknowledge customer frustration and show understanding
  5) Provide multiple solution options when possible
  6) Set realistic expectations with specific timelines and next steps
  7) Always confirm understanding before ending conversations
  8) Follow up proactively and keep customers informed of progress
  9) Escalate to human agents when issues exceed capabilities or policy limits
  10) Maintain confidentiality and handle sensitive information appropriately"

# IT Support Guidelines
AGENT_GUIDELINES: |
  "The agent should follow these guidelines:
  1) Gather complete information before attempting solutions
  2) Verify user identity and permissions before accessing systems
  3) Provide clear, step-by-step technical instructions
  4) Ask users to confirm each step before proceeding
  5) Document all troubleshooting steps and solutions applied
  6) Create tickets for issues requiring follow-up or escalation
  7) Reference official documentation and approved procedures
  8) Escalate security-related issues immediately to security team
  9) Test solutions thoroughly before marking issues as resolved
  10) Provide preventive guidance to avoid future issues"
```

### **Phase 5: Knowledge Sources Configuration**

#### **MCP Command Sequence 5: Knowledge Integration**
```javascript
// Command 16: Add knowledge sources
d94_playwright_fill({
    selector: 'input[placeholder*="knowledge source"], input[type="url"]',
    value: '{{KNOWLEDGE_SOURCE_URL_1}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

// Command 17: Add additional sources (repeat as needed)
d94_playwright_fill({
    selector: 'input[placeholder*="knowledge source"], input[type="url"]',
    value: '{{KNOWLEDGE_SOURCE_URL_2}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

// Command 18: Confirm knowledge sources
d94_playwright_click({
    selector: 'input[type="checkbox"][data-testid*="knowledge-confirm"]'
});

// Command 19: Document knowledge configuration
d94_playwright_screenshot({
    name: 'knowledge-sources-configured',
    storeBase64: true
});
```

#### **Standard Knowledge Source Templates**
```yaml
# Customer Service Knowledge Sources
KNOWLEDGE_SOURCES:
  - url: "https://support.company.com/help"
    description: "Customer support documentation and FAQs"
  - url: "https://company.com/product-catalog"
    description: "Product specifications and information"
  - url: "https://company.com/policies"
    description: "Return, refund, and warranty policies"
  - url: "https://company.com/troubleshooting"
    description: "Common issue resolution guides"

# IT Support Knowledge Sources  
KNOWLEDGE_SOURCES:
  - url: "https://learn.microsoft.com/en-us/microsoft-365"
    description: "Microsoft 365 documentation and troubleshooting"
  - url: "https://docs.microsoft.com/en-us/windows"
    description: "Windows operating system documentation"
  - url: "https://internal.company.com/it-policies"
    description: "Internal IT policies and procedures"
  - url: "https://internal.company.com/knowledge-base"
    description: "Internal technical knowledge base"
```

### **Phase 6: Tools & Integrations Setup**

#### **MCP Command Sequence 6: Tools Configuration**
```javascript
// Command 20: Navigate to Tools section
d94_playwright_click({
    selector: 'a[href*="tools"], button:has-text("Tools")'
});

// Command 21: Add Dataverse tool
d94_playwright_click({
    selector: 'button:has-text("Add tool")'
});

d94_playwright_click({
    selector: 'div:has-text("Dataverse")'
});

// Command 22: Configure Dataverse operations
d94_playwright_click({
    selector: 'label:has-text("List rows")'
});

d94_playwright_click({
    selector: 'label:has-text("Add a new row")'
});

d94_playwright_click({
    selector: 'label:has-text("Update a row")'
});

// Command 23: Save Dataverse configuration
d94_playwright_click({
    selector: 'button:has-text("Add")'
});

// Command 24: Add Outlook integration
d94_playwright_click({
    selector: 'button:has-text("Add tool")'
});

d94_playwright_click({
    selector: 'div:has-text("Office 365 Outlook")'
});

d94_playwright_click({
    selector: 'label:has-text("Send a Draft message")'
});

// Command 25: Save Outlook configuration
d94_playwright_click({
    selector: 'button:has-text("Add")'
});

// Command 26: Document tools configuration
d94_playwright_screenshot({
    name: 'tools-configured',
    storeBase64: true
});
```

#### **Standard Tools Configuration**
```yaml
# Customer Service Tools
STANDARD_TOOLS:
  dataverse:
    operations:
      - "List rows" # For customer/order lookups
      - "Add a new row" # For case creation
      - "Update a row" # For case updates
  outlook:
    operations:
      - "Send a Draft message" # For customer communications
  optional_tools:
    teams:
      operations:
        - "Post message" # For internal notifications
    sharepoint:
      operations:
        - "Get file content" # For document access

# IT Support Tools
IT_SUPPORT_TOOLS:
  dataverse:
    operations:
      - "List rows" # For asset/user lookups
      - "Add a new row" # For ticket creation
      - "Update a row" # For ticket updates
  outlook:
    operations:
      - "Send a Draft message" # For user communications
  sharepoint:
    operations:
      - "Get file content" # For documentation access
      - "Create file" # For documentation updates
```

### **Phase 7: Topics & Conversation Flow Configuration**

#### **MCP Command Sequence 7: Topics Creation**
```javascript
// Command 27: Navigate to Topics section
d94_playwright_click({
    selector: 'a[href*="topics"], button:has-text("Topics")'
});

// Command 28: Create first topic
d94_playwright_click({
    selector: 'button:has-text("Add a topic")'
});

d94_playwright_click({
    selector: 'div:has-text("Add from description with Copilot")'
});

// Command 29: Add topic description
d94_playwright_fill({
    selector: 'textarea[placeholder*="Describe what this topic should do"]',
    value: '{{TOPIC_1_DESCRIPTION}}'
});

d94_playwright_click({
    selector: 'button:has-text("Create")'
});

// Command 30: Wait for topic generation
d94_playwright_wait_for({
    time: 10
});

// Command 31: Validate and save topic
d94_playwright_click({
    selector: 'button:has-text("Save")'
});

// Command 32: Repeat for additional topics (loop this pattern)
// ... Additional topic creation commands ...

// Command 33: Document topics configuration
d94_playwright_screenshot({
    name: 'topics-created',
    storeBase64: true
});
```

#### **Standard Topic Templates**
```yaml
# Customer Service Topics
CUSTOMER_SERVICE_TOPICS:
  topic_1:
    name: "Product Information"
    description: |
      "Help customers get detailed information about products including specifications, 
      features, pricing, availability, and recommendations. Provide comparisons between 
      products and guide customers to the best options for their needs."
    triggers:
      - "product information"
      - "product specs"
      - "tell me about"
      - "product features"
      - "pricing"

  topic_2:
    name: "Order Status & Tracking"
    description: |
      "Assist customers with checking order status, tracking shipments, updating 
      delivery information, and resolving order-related issues. Access order 
      database and provide real-time updates."
    triggers:
      - "order status"
      - "track my order"
      - "where is my order"
      - "delivery date"
      - "shipping information"

  topic_3:
    name: "Technical Support"
    description: |
      "Provide basic technical troubleshooting for common product issues including 
      setup guidance, configuration help, and problem resolution. Escalate complex 
      technical issues to specialized support teams."
    triggers:
      - "technical problem"
      - "not working"
      - "setup help"
      - "troubleshoot"
      - "technical support"

# IT Support Topics
IT_SUPPORT_TOPICS:
  topic_1:
    name: "Password & Account Issues"
    description: |
      "Help users with password resets, account lockouts, multi-factor authentication 
      setup, and access permission issues. Verify user identity and follow security 
      protocols for account modifications."
    triggers:
      - "password reset"
      - "locked out"
      - "can't login"
      - "access denied"
      - "account issues"

  topic_2:
    name: "Software & Application Support"
    description: |
      "Assist with software installation, updates, configuration, and troubleshooting. 
      Provide guidance for common applications including Microsoft 365, operating 
      system issues, and approved business software."
    triggers:
      - "software problem"
      - "application not working"
      - "installation help"
      - "software update"
      - "program error"
```

### **Phase 8: Formula Validation & Error Resolution**

#### **Critical Power Platform Formula Patterns**
```javascript
// Command 34: Validate formulas in topics
d94_playwright_click({
    selector: 'button[aria-label*="formula"], button:has-text("Edit formula")'
});

// Command 35: Check for common syntax errors
// Replace standard programming syntax with Power Platform equivalents

// INCORRECT SYNTAX (avoid these patterns):
// variable != null
// variable == null  
// variable != ""
// variable == ""

// CORRECT POWER PLATFORM SYNTAX:
// Not(IsBlank(variable))
// IsBlank(variable)
// Not(IsEmpty(variable))
// IsEmpty(variable)

// Command 36: Test formula validation
d94_playwright_click({
    selector: 'button:has-text("Test formula")'
});

// Command 37: Save corrected formulas
d94_playwright_click({
    selector: 'button:has-text("Save")'
});
```

#### **Formula Validation Checklist**
```markdown
## Power Platform Formula Validation

### Common Syntax Corrections
- [ ] Replace `!= null` with `Not(IsBlank(variable))`
- [ ] Replace `== null` with `IsBlank(variable)`
- [ ] Replace `!= ""` with `Not(IsEmpty(variable))`
- [ ] Replace `== ""` with `IsEmpty(variable)`

### Formula Testing Process
- [ ] Open formula editor for each topic
- [ ] Check syntax highlighting (red = errors)
- [ ] Test formulas individually
- [ ] Validate data types (Boolean, Text, Number)
- [ ] Save and re-test after corrections

### Validation Commands
- [ ] Test each topic individually before bulk publishing
- [ ] Verify no validation errors in topics list
- [ ] Check formula execution in test chat
- [ ] Confirm proper data flow between nodes
```

### **Phase 9: Testing & Quality Assurance**

#### **MCP Command Sequence 8: Comprehensive Testing**
```javascript
// Command 38: Access test interface
d94_playwright_click({
    selector: 'button:has-text("Test")'
});

// Command 39: Test topic 1
d94_playwright_fill({
    selector: 'input[placeholder*="Type a message"], textarea[placeholder*="message"]',
    value: '{{TEST_SCENARIO_1}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

d94_playwright_wait_for({
    time: 5
});

// Command 40: Capture test result 1
d94_playwright_screenshot({
    name: 'test-scenario-1-result',
    storeBase64: true
});

// Command 41: Test topic 2
d94_playwright_fill({
    selector: 'input[placeholder*="Type a message"], textarea[placeholder*="message"]',
    value: '{{TEST_SCENARIO_2}}'
});

d94_playwright_press_key({
    key: 'Enter'
});

d94_playwright_wait_for({
    time: 5
});

// Command 42: Capture test result 2
d94_playwright_screenshot({
    name: 'test-scenario-2-result',
    storeBase64: true
});

// Continue for all test scenarios...
```

#### **Standard Test Scenarios**
```yaml
# Customer Service Test Scenarios
CUSTOMER_SERVICE_TESTS:
  test_1:
    input: "I need information about your latest laptop models"
    expected_topic: "Product Information"
    expected_behavior: "Provide detailed laptop specifications and recommendations"
  
  test_2:
    input: "Can you check the status of my order #12345?"
    expected_topic: "Order Status & Tracking"
    expected_behavior: "Request order verification and provide status lookup"
  
  test_3:
    input: "My device isn't turning on properly"
    expected_topic: "Technical Support"
    expected_behavior: "Provide basic troubleshooting steps or escalate"

# IT Support Test Scenarios
IT_SUPPORT_TESTS:
  test_1:
    input: "I can't log into my computer, it says my password is wrong"
    expected_topic: "Password & Account Issues"
    expected_behavior: "Verify identity and guide through password reset"
  
  test_2:
    input: "Microsoft Word keeps crashing when I try to open documents"
    expected_topic: "Software & Application Support"
    expected_behavior: "Provide troubleshooting steps for Word issues"
```

### **Phase 10: Publishing & Deployment**

#### **MCP Command Sequence 9: Publication Process**
```javascript
// Command 43: Initiate publishing
d94_playwright_click({
    selector: 'button:has-text("Publish")'
});

// Command 44: Check for validation errors
d94_playwright_screenshot({
    name: 'pre-publish-validation',
    storeBase64: true
});

// Command 45: If errors exist, fix them first
// (Return to Phase 8 if validation errors are present)

// Command 46: Confirm publication
d94_playwright_fill({
    selector: 'textarea[placeholder*="release notes"], input[placeholder*="notes"]',
    value: '{{RELEASE_NOTES}}'
});

d94_playwright_click({
    selector: 'button:has-text("Publish"):not([disabled])'
});

// Command 47: Wait for publication completion
d94_playwright_wait_for({
    time: 15
});

// Command 48: Confirm publication success
d94_playwright_screenshot({
    name: 'publication-complete',
    storeBase64: true
});

// Command 49: Capture agent URL and ID
d94_playwright_click({
    selector: 'a[href*="overview"], button:has-text("Overview")'
});

d94_playwright_screenshot({
    name: 'agent-overview-final',
    storeBase64: true
});
```

#### **Standard Release Notes Template**
```yaml
RELEASE_NOTES: |
  "Initial deployment of {{AGENT_NAME}} agent including:
  - Core conversational topics for {{AGENT_SCOPE}}
  - Integration with Dataverse and Office 365
  - Knowledge base integration with {{KNOWLEDGE_SOURCES_COUNT}} sources
  - Comprehensive testing and validation completed
  - Production-ready configuration with error handling
  - Escalation procedures configured for complex cases"
```

---

##  CONFIGURATION STANDARDS

### **Generative AI Settings (Recommended)**
```yaml
orchestration: true  # Enable dynamic responses
deep_reasoning: false  # Disable unless Premium license
connected_agents: false  # Disable unless needed
response_model: "GPT-4o (default)"
content_moderation: "High (Level 3)"
user_feedback: true
general_knowledge: true
web_search: false  # Disable for enterprise security
image_uploads: true
tenant_graph_grounding: true  # Enable if Premium
```

### **Security Settings (Recommended)**
```yaml
authentication: false  # Configure if required
web_channel_security: true  # Enable for production
agent_allowlist: false  # Configure for agent-to-agent
protection_status: true  # Enable for published agents
```

### **Advanced Settings (Recommended)**
```yaml
application_insights: true  # Enable for monitoring
log_activity: true
log_sensitive_properties: false  # Disable for security
log_node_tools: true
enhance_transcripts: false  # Enable if needed for analysis
optimized_canvas: true
activation_threshold: 30  # nodes
```

---

##  MONITORING & MAINTENANCE

### **Performance Metrics to Track**
```yaml
primary_metrics:
  - total_sessions
  - engagement_rate
  - satisfaction_score
  - topic_hit_rate
  - escalation_rate

secondary_metrics:
  - average_session_length
  - resolution_rate
  - knowledge_source_usage
  - error_rate
  - response_time
```

### **Regular Maintenance Tasks**
```markdown
## Weekly Tasks
- [ ] Review session analytics and satisfaction scores
- [ ] Check for validation errors in topics
- [ ] Update knowledge sources if documentation changes
- [ ] Review escalation patterns and adjust thresholds

## Monthly Tasks  
- [ ] Analyze topic performance and optimize low-performing topics
- [ ] Review and update agent instructions based on usage patterns
- [ ] Check tool connections and permissions
- [ ] Update formula syntax if Power Platform changes occur

## Quarterly Tasks
- [ ] Comprehensive agent review and optimization
- [ ] Knowledge source audit and refresh
- [ ] Security review and access validation
- [ ] Performance benchmark against similar agents
```

---

##  TROUBLESHOOTING GUIDE

### **Common Issues & Solutions**

#### **Modal Dialog Stuck State**
- **Symptoms**: UI becomes unresponsive, dialog won't close
- **MCP Solution**: 
  ```javascript
  d94_playwright_close();
  d94_playwright_navigate({url: 'https://copilotstudio.microsoft.com'});
  ```

#### **Formula Validation Errors**
- **Symptoms**: "UnknownError" or "Unexpected character" in topic validation
- **Solution**: Use Power Platform syntax reference (see Phase 8)

#### **Publishing Blocked**
- **Symptoms**: Publish button available but validation errors present
- **Solution**: Fix all validation errors before retry (never bypass)

#### **Topic Creation Delays**
- **Symptoms**: Copilot takes time to generate complex topics
- **Solution**: Be patient, allow full generation, then validate

#### **Tool Authentication Failures**
- **Symptoms**: Tool connections show authentication errors
- **Solution**: Re-authenticate tools and verify permissions

---

##  DEPLOYMENT CHECKLIST

### **Pre-Deployment Validation**
```markdown
- [ ] All topics created and validated
- [ ] All formulas use correct Power Platform syntax
- [ ] Knowledge sources accessible and current
- [ ] Tools configured and authenticated
- [ ] Test scenarios pass successfully
- [ ] No validation errors in any component
- [ ] Release notes completed
- [ ] Agent description and instructions finalized
```

### **Post-Deployment Validation**
```markdown
- [ ] Agent status shows "Published"
- [ ] Test interface accessible and responsive
- [ ] All topics trigger correctly
- [ ] Tools function as expected
- [ ] Knowledge sources provide relevant responses
- [ ] Escalation pathways work correctly
- [ ] Analytics tracking enabled
- [ ] Agent URL accessible to end users
```

---

##  TEMPLATE EXTENSIONS

### **Multi-Tier Support Structure**
```yaml
# L1 Agent (First Contact)
l1_capabilities:
  - Basic information and FAQ
  - Simple troubleshooting
  - Order status and account updates
  - Standard refund/return processing
  - Escalation to L2 for complex issues

# L2 Agent (Advanced Support)  
l2_capabilities:
  - Complex troubleshooting
  - Warranty claim processing
  - Executive-level support
  - Cross-system integrations
  - Escalation to L3 for field service

# L3 Agent (Field Service)
l3_capabilities:
  - On-site service coordination
  - Hardware replacement authorization
  - Technician scheduling
  - Parts ordering and inventory
  - Case closure and follow-up
```

### **Industry-Specific Variations**
```yaml
# Healthcare Agent Extensions
healthcare_specific:
  - HIPAA compliance features
  - Patient privacy protocols
  - Medical terminology knowledge
  - Appointment scheduling integration
  - Insurance verification capabilities

# Financial Services Extensions
financial_specific:
  - Regulatory compliance (SOX, PCI)
  - Fraud detection integration
  - Account security verification
  - Transaction processing capabilities
  - Risk assessment protocols

# Manufacturing Extensions
manufacturing_specific:
  - Equipment status monitoring
  - Maintenance scheduling
  - Supply chain integration
  - Quality control protocols
  - Safety compliance tracking
```

---

##  APPENDIX: MCP COMMAND REFERENCE

### **Complete Command List**
```javascript
// Navigation Commands
d94_playwright_navigate(url, options)
d94_playwright_go_back()
d94_playwright_go_forward()

// Interaction Commands
d94_playwright_click(selector)
d94_playwright_fill(selector, value)
d94_playwright_select(selector, value)
d94_playwright_press_key(key)
d94_playwright_hover(selector)

// Validation Commands
d94_playwright_screenshot(options)
d94_playwright_get_visible_text()
d94_playwright_get_visible_html()
d94_playwright_console_logs()

// Wait Commands
d94_playwright_wait_for(time)
d94_playwright_wait_for(text)

// Session Management
d94_playwright_close()
d94_start_codegen_session(options)
d94_end_codegen_session(sessionId)
```

### **Selector Patterns**
```javascript
// Common Copilot Studio selectors
'button:has-text("Create agent")'
'textarea[placeholder*="describe what your agent should do"]'
'button:has-text("Add tool")'
'div:has-text("Dataverse")'
'button:has-text("Publish")'
'a[href*="overview"]'
'input[type="checkbox"][data-testid*="knowledge-confirm"]'
```

---

**Template Maintained by**: Power Platform Center of Excellence  
**Last Updated**: June 18, 2025  
**Next Review**: September 18, 2025  
**Support Contact**: [CoE Team Email]
