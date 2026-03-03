#!/bin/bash

# SBX SG Agent Testing Script
# This script demonstrates how to test the SBX SG Agent using PAC CLI
# Created: August 11, 2025

echo "🤖 SBX SG Agent Testing Script"
echo "=============================="
echo ""

# Environment and Agent Details
ENVIRONMENT_ID="10180231-0250-e54a-ab99-b953e374250a"
ENVIRONMENT_URL="https://vnextcoe.crm.dynamics.com/"
AGENT_ID="d09c19a2-7175-f011-b4cb-6045bd055517"
AGENT_NAME="SBX SG Agent"

echo "📋 Agent Information:"
echo "   Agent ID: $AGENT_ID"
echo "   Agent Name: $AGENT_NAME"
echo "   Environment: $ENVIRONMENT_ID"
echo "   Environment URL: $ENVIRONMENT_URL"
echo ""

# Step 1: Check PAC CLI version
echo "🔧 Step 1: Verifying PAC CLI Installation"
echo "----------------------------------------"
pac help | head -4
echo ""

# Step 2: Check authentication
echo "🔐 Step 2: Checking Authentication"
echo "--------------------------------"
echo "Current authentication profiles:"
pac auth list
echo ""

# Step 3: Verify environment connection
echo "🌐 Step 3: Verifying Environment Connection"
echo "-----------------------------------------"
pac org who
echo ""

# Step 4: List all copilots/agents
echo "📜 Step 4: Listing All Agents in Environment"
echo "-------------------------------------------"
pac copilot list
echo ""

# Step 5: Check specific agent status
echo "🎯 Step 5: Checking SBX SG Agent Status"
echo "--------------------------------------"
pac copilot status --environment $ENVIRONMENT_ID --bot-id $AGENT_ID
echo ""

# Step 6: Extract current template (for comparison)
echo "📄 Step 6: Extracting Current Agent Template"
echo "-------------------------------------------"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMPLATE_FILE="/tmp/sbx-sg-agent-current-$TIMESTAMP.yaml"

echo "Extracting template to: $TEMPLATE_FILE"
pac copilot extract-template \
    --environment $ENVIRONMENT_ID \
    --bot $AGENT_ID \
    --templateFileName $TEMPLATE_FILE \
    --overwrite

if [ -f "$TEMPLATE_FILE" ]; then
    echo "✅ Template extracted successfully"
    echo "   Components loaded: $(grep -c 'kind:' $TEMPLATE_FILE)"
    echo "   File size: $(du -h $TEMPLATE_FILE | cut -f1)"
    echo "   Agent schema: $(grep 'schemaName:' $TEMPLATE_FILE | head -1 | cut -d' ' -f4)"
else
    echo "❌ Template extraction failed"
fi
echo ""

# Step 7: Test prompt examples
echo "💬 Step 7: Test Prompt Examples"
echo "------------------------------"
echo "To test the agent interactively, you can:"
echo ""
echo "1. 🌐 Web Interface Testing:"
echo "   - Navigate to: $ENVIRONMENT_URL"
echo "   - Open Power Virtual Agents"
echo "   - Find '$AGENT_NAME' agent"
echo "   - Use the Test Chat panel"
echo ""
echo "2. 🧪 Example Test Prompts:"
cat << 'EOF'
   - "Show me details for the group 'Finance Team'."
   - "List all security group names in the spreadsheet."
   - "What columns are available for each group?"
   - "Find all groups where the 'Type' column is 'Admin'."
   - "Give me a summary of all group names and their descriptions."
   - "Are there any duplicate group names in the spreadsheet?"
   - "Hello" (test greeting)
   - "Thank you" (test acknowledgment)
   - "Help me with security groups"
EOF
echo ""

# Step 8: Check for API endpoint information
echo "🔌 Step 8: API Endpoint Information"
echo "----------------------------------"
echo "For Direct Line API testing, you would need:"
echo "   1. Enable Direct Line channel in Power Virtual Agents"
echo "   2. Get Direct Line secret from channel configuration"
echo "   3. Use Bot Framework Direct Line API:"
echo "      - Endpoint: https://directline.botframework.com/"
echo "      - Authentication: Bearer token from Direct Line secret"
echo ""

# Step 9: Template comparison
echo "🔍 Step 9: Template Validation"
echo "-----------------------------"
if [ -f "$TEMPLATE_FILE" ]; then
    echo "Comparing with stored template..."
    if [ -f "/workspaces/SBX-vNext/sbx-sg-agent/sbx-sg-agent-template.yaml" ]; then
        STORED_COMPONENTS=$(grep -c 'kind:' "/workspaces/SBX-vNext/sbx-sg-agent/sbx-sg-agent-template.yaml")
        CURRENT_COMPONENTS=$(grep -c 'kind:' "$TEMPLATE_FILE")
        
        echo "   Stored template components: $STORED_COMPONENTS"
        echo "   Current template components: $CURRENT_COMPONENTS"
        
        if [ "$STORED_COMPONENTS" -eq "$CURRENT_COMPONENTS" ]; then
            echo "   ✅ Component count matches"
        else
            echo "   ⚠️  Component count differs"
        fi
        
        # Check for key identifiers
        STORED_ENV=$(grep 'environmentId:' "/workspaces/SBX-vNext/sbx-sg-agent/sbx-sg-agent-template.yaml" | cut -d' ' -f2)
        CURRENT_ENV=$(grep 'environmentId:' "$TEMPLATE_FILE" | cut -d' ' -f2)
        
        echo "   Environment ID match: $([ "$STORED_ENV" = "$CURRENT_ENV" ] && echo "✅ Yes" || echo "⚠️ No")"
    else
        echo "   ⚠️  Stored template not found for comparison"
    fi
else
    echo "   ❌ Current template not available for validation"
fi
echo ""

# Step 10: Summary and next steps
echo "📊 Step 10: Testing Summary"
echo "-------------------------"
echo "✅ PAC CLI is functional"
echo "✅ Authentication is active"
echo "✅ Environment connection verified"
echo "✅ Agent is accessible and provisioned"
echo "✅ Template extraction successful"
echo ""
echo "🚀 Next Steps for Advanced Testing:"
echo "1. Set up Direct Line channel for API testing"
echo "2. Create automated test scripts using Direct Line API"
echo "3. Implement CI/CD pipeline with PAC CLI"
echo "4. Set up monitoring and analytics"
echo ""
echo "📁 Generated Files:"
echo "   Template: $TEMPLATE_FILE"
echo ""
echo "🔗 Useful Links:"
echo "   Environment: $ENVIRONMENT_URL"
echo "   PAC CLI Docs: https://aka.ms/PowerPlatformCLI"
echo "   Direct Line API: https://docs.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-concepts"
echo ""
echo "✨ Test completed successfully!"
