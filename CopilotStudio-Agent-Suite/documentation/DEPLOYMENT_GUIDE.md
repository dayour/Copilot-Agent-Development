# Copilot Studio Agent Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- PowerShell 5.0 or higher
- Power Platform CLI
- Copilot Studio environment access
- Appropriate permissions (System Administrator or Environment Maker)

### Option 1: Automated Deployment Script

```powershell
# Navigate to the agent suite directory
cd "c:\Users\dayour\OneDrive - Microsoft\CopilotStudioAgents"

# Run validation first
.\deploy-agents.ps1 -EnvironmentUrl "https://your-environment.crm.dynamics.com/" -ValidateOnly

# Deploy all agents with interactive authentication
.\deploy-agents.ps1 -EnvironmentUrl "https://your-environment.crm.dynamics.com/" -UseInteractiveAuth

# Deploy specific agents only
.\deploy-agents.ps1 -EnvironmentUrl "https://your-environment.crm.dynamics.com/" -AgentsToInclude @("Entra_Security_Manager", "Azure_Subscriptions")
```

### Option 2: Create Deployment Packages

```powershell
# Create packages for all agents
.\package-agents.ps1 -PackageAll -OutputPath ".\deployment-packages"

# Create package for single agent
.\package-agents.ps1 -AgentName "Entra_Security_Manager" -OutputPath ".\deployment-packages"
```

### Option 3: Manual Import Process

1. **Navigate to Copilot Studio** (https://copilotstudio.microsoft.com)
2. **Select your environment**
3. **For each agent folder:**
   - Go to "Create" > "Import bot"
   - Select the agent folder or upload the .zip package
   - Follow the import wizard
   - Configure environment-specific settings

## 📋 Pre-Deployment Checklist

### ✅ Environment Preparation
- [ ] Copilot Studio environment is available
- [ ] User has appropriate permissions
- [ ] Required connectors are available
- [ ] Network connectivity is confirmed

### ✅ Agent Validation
```powershell
# Run master validation
.\master-validation.ps1

# Expected output: "🎉 SUCCESS: All agents are fully validated and ready for deployment!"
```

### ✅ Configuration Review
- [ ] Review `deployment-config.template.json`
- [ ] Customize authentication settings
- [ ] Set environment-specific URLs
- [ ] Configure agent priorities

## 🔧 Deployment Parameters

### Authentication Options

**Interactive Authentication (Recommended for testing):**
```powershell
.\deploy-agents.ps1 -EnvironmentUrl "https://your-env.crm.dynamics.com/" -UseInteractiveAuth
```

**Service Principal Authentication (Recommended for CI/CD):**
```powershell
.\deploy-agents.ps1 -EnvironmentUrl "https://your-env.crm.dynamics.com/" -TenantId "tenant-id" -ClientId "client-id" -ClientSecret "secret"
```

### Deployment Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `-EnvironmentUrl` | Target Copilot Studio environment | Required |
| `-TenantId` | Azure AD tenant ID | Optional |
| `-UseInteractiveAuth` | Use interactive login | `$true` |
| `-ValidateOnly` | Validate without deploying | `$false` |
| `-AgentsToInclude` | Specific agents to deploy | All agents |
| `-CreateBackup` | Backup existing agents | `$true` |

## 📊 Post-Deployment Verification

### 1. Test Basic Functionality
```powershell
# Test individual agents in Copilot Studio
# Verify conversation starters work
# Check topic triggers
# Validate authentication
```

### 2. Configure Environment Settings
- Update connection strings in imported agents
- Configure authentication providers
- Set up required permissions
- Test data source connections

### 3. Integration Testing
- Test cross-agent scenarios
- Verify handoff mechanisms
- Check error handling
- Validate performance

## 🛠️ Troubleshooting

### Common Issues

**Import Failures:**
- Verify all required files are present
- Check YAML syntax in configuration files
- Ensure unique schema names
- Validate file permissions

**Authentication Errors:**
- Verify user permissions in target environment
- Check service principal configuration
- Validate environment URLs
- Confirm tenant ID accuracy

**Configuration Issues:**
- Update environment-specific endpoints
- Verify connection string formats
- Check data source availability
- Validate API permissions

### Debug Commands

```powershell
# Validate agent structure
.\validate-agents.ps1

# Check MCS configuration
.\update-mcs-config.ps1 -ValidateOnly

# Test specific agent
.\deploy-agents.ps1 -AgentsToInclude @("AgentName") -ValidateOnly
```

## 📞 Support Resources

### Documentation Links
- [Copilot Studio Documentation](https://docs.microsoft.com/en-us/power-virtual-agents/)
- [Power Platform CLI](https://docs.microsoft.com/en-us/power-platform/developer/cli/introduction)
- [Bot Framework Composer](https://docs.microsoft.com/en-us/composer/)

### Script References
- `deploy-agents.ps1` - Main deployment script
- `package-agents.ps1` - Package creation utility
- `master-validation.ps1` - Comprehensive validation
- `update-mcs-config.ps1` - Configuration management

---

## 🎯 Success Criteria

✅ **Deployment Complete When:**
- All agents imported successfully
- No critical errors in deployment log
- Basic conversation flows working
- Authentication configured properly
- Environment-specific settings updated

✅ **Ready for Production When:**
- All agents tested individually
- Integration scenarios validated
- Performance benchmarks met
- Security requirements satisfied
- User acceptance testing passed

---

*For additional support, refer to the PROJECT_COMPLETION_REPORT.md and individual agent README files.*
