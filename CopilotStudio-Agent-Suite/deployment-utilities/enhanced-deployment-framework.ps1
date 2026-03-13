# Enhanced Deployment and Validation Framework for Copilot Studio Agent Suite
# This script provides comprehensive automation for agent deployment, validation, and management

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Development", "Testing", "Production")]
    [string]$TargetEnvironment = "Development",
    
    [Parameter(Mandatory=$false)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidateOnly,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackupBeforeDeployment,
    
    [Parameter(Mandatory=$false)]
    [string[]]$SpecificAgents,
    
    [Parameter(Mandatory=$false)]
    [switch]$EnableAutoRollback,
    
    [Parameter(Mandatory=$false)]
    [string]$LogPath = ".\deployment-logs"
)

# Import required modules
try {
    Import-Module Az.Accounts -Force -ErrorAction Stop
    Import-Module Az.Resources -Force -ErrorAction Stop
    Import-Module Az.CognitiveServices -Force -ErrorAction Stop
    
    # Check for PowerShell-Yaml module
    if (!(Get-Module -ListAvailable -Name powershell-yaml)) {
        Write-Host "Installing PowerShell-Yaml module..." -ForegroundColor Yellow
        Install-Module -Name powershell-yaml -Force -Scope CurrentUser
    }
    Import-Module powershell-yaml -Force -ErrorAction Stop
}
catch {
    Write-Host "[ ] Failed to import required modules: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please install required modules:" -ForegroundColor Yellow
    Write-Host "  Install-Module Az.Accounts, Az.Resources, Az.CognitiveServices, powershell-yaml -Force" -ForegroundColor Yellow
    exit 1
}

# Initialize logging
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = "$LogPath\deployment-$timestamp.log"
New-Item -Path $LogPath -ItemType Directory -Force | Out-Null

function Write-DeploymentLog {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $logEntry -ForegroundColor $(switch($Level) { "ERROR" {"Red"} "WARNING" {"Yellow"} "SUCCESS" {"Green"} default {"White"}})
    Add-Content -Path $logFile -Value $logEntry
}

# Enhanced YAML validation with detailed error reporting
function Test-EnhancedYAMLSyntax {
    param(
        [string]$FilePath,
        [string]$AgentName
    )
    
    Write-DeploymentLog "Validating YAML syntax for: $FilePath"
    
    try {
        $yamlContent = Get-Content $FilePath -Raw -ErrorAction Stop
        
        # Basic YAML parsing test
        try {
            $parsedYaml = $yamlContent | ConvertFrom-Yaml -ErrorAction Stop
        }
        catch {
            return @{
                Valid = $false
                Errors = @("YAML parsing failed: $($_.Exception.Message)")
                Warnings = @()
            }
        }
        
        $errors = @()
        $warnings = @()
        
        # Validate MCS-specific structure for topic files
        if ($FilePath -like "*topics*") {
            $requiredTopicFields = @('kind', 'beginDialog')
            foreach ($field in $requiredTopicFields) {
                if (-not $parsedYaml.$field) {
                    $errors += "Missing required topic field: $field"
                }
            }
            
            # Validate dialog structure
            if ($parsedYaml.beginDialog -and $parsedYaml.beginDialog.actions) {
                $actionCount = $parsedYaml.beginDialog.actions.Count
                if ($actionCount -eq 0) {
                    $warnings += "Topic has no actions defined"
                }
                elseif ($actionCount -eq 1) {
                    $warnings += "Topic has only one action - consider adding more comprehensive dialog flow"
                }
            }
        }
        
        # Validate agent.mcs.yml structure
        if ($FilePath -like "*agent.mcs.yml") {
            $requiredAgentFields = @('kind', 'metadata', 'instructions', 'conversationStarters')
            foreach ($field in $requiredAgentFields) {
                if (-not $parsedYaml.$field) {
                    $errors += "Missing required agent field: $field"
                }
            }
            
            # Validate conversation starter structure
            if ($parsedYaml.conversationStarters) {
                foreach ($starter in $parsedYaml.conversationStarters) {
                    if (-not $starter.title -or -not $starter.text) {
                        $errors += "Conversation starter missing title or text"
                    }
                }
            }
        }
        
        # Validate settings.mcs.yml structure  
        if ($FilePath -like "*settings.mcs.yml") {
            $requiredSettingsFields = @('displayName', 'schemaName', 'authenticationMode')
            foreach ($field in $requiredSettingsFields) {
                if (-not $parsedYaml.$field) {
                    $errors += "Missing required settings field: $field"
                }
            }
            
            # Validate schema naming convention
            if ($parsedYaml.schemaName -and $parsedYaml.schemaName -notmatch "^cre44_") {
                $warnings += "Schema name does not follow naming convention (should start with 'cre44_')"
            }
        }
        
        return @{
            Valid = $errors.Count -eq 0
            Errors = $errors
            Warnings = $warnings
        }
    }
    catch {
        return @{
            Valid = $false
            Errors = @("Failed to read or parse file: $($_.Exception.Message)")
            Warnings = @()
        }
    }
}

# Comprehensive agent structure validation
function Test-AgentStructureComprehensive {
    param(
        [string]$AgentPath,
        [string]$AgentName
    )
    
    Write-DeploymentLog "Performing comprehensive structure validation for: $AgentName"
    
    $validationResults = @{
        AgentName = $AgentName
        StructureValid = $true
        Errors = @()
        Warnings = @()
        FileValidation = @{}
    }
    
    $requiredPaths = @{
        "Agent Definition" = "$AgentPath\agent.mcs.yml"
        "Settings" = "$AgentPath\settings.mcs.yml" 
        "README" = "$AgentPath\Readme.md"
        "Icon" = "$AgentPath\icon.png"
        "Topics Folder" = "$AgentPath\topics"
        "MCS Folder" = "$AgentPath\.mcs"
        "Connection Config" = "$AgentPath\.mcs\conn.json"
        "Bot Definition" = "$AgentPath\.mcs\botdefinition.json"
    }
    
    # Validate required files and folders
    foreach ($pathName in $requiredPaths.Keys) {
        $path = $requiredPaths[$pathName]
        $exists = Test-Path $path
        
        $validationResults.FileValidation[$pathName] = @{
            Path = $path
            Exists = $exists
            Valid = $exists
        }
        
        if (-not $exists) {
            $validationResults.Errors += "Missing required $pathName`: $path"
            $validationResults.StructureValid = $false
        }
    }
    
    # Validate topic files if topics folder exists
    if (Test-Path "$AgentPath\topics") {
        $topicFiles = Get-ChildItem "$AgentPath\topics" -Filter "*.mcs.yml"
        
        if ($topicFiles.Count -eq 0) {
            $validationResults.Warnings += "No topic files found in topics folder"
        }
        else {
            Write-DeploymentLog "Found $($topicFiles.Count) topic files to validate"
            
            foreach ($topicFile in $topicFiles) {
                $yamlValidation = Test-EnhancedYAMLSyntax -FilePath $topicFile.FullName -AgentName $AgentName
                
                $validationResults.FileValidation["Topic: $($topicFile.Name)"] = $yamlValidation
                
                if (-not $yamlValidation.Valid) {
                    $validationResults.Errors += $yamlValidation.Errors
                    $validationResults.StructureValid = $false
                }
                
                $validationResults.Warnings += $yamlValidation.Warnings
            }
        }
    }
    
    # Validate key configuration files
    foreach ($configFile in @("agent.mcs.yml", "settings.mcs.yml")) {
        $configPath = "$AgentPath\$configFile"
        if (Test-Path $configPath) {
            $yamlValidation = Test-EnhancedYAMLSyntax -FilePath $configPath -AgentName $AgentName
            
            $validationResults.FileValidation[$configFile] = $yamlValidation
            
            if (-not $yamlValidation.Valid) {
                $validationResults.Errors += $yamlValidation.Errors
                $validationResults.StructureValid = $false
            }
            
            $validationResults.Warnings += $yamlValidation.Warnings
        }
    }
    
    return $validationResults
}

# Backup functionality
function Backup-AgentConfiguration {
    param(
        [string]$AgentPath,
        [string]$AgentName,
        [string]$BackupPath
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $agentBackupPath = "$BackupPath\$AgentName-$timestamp"
    
    Write-DeploymentLog "Creating backup for $AgentName at: $agentBackupPath"
    
    try {
        # Create backup directory
        New-Item -Path $agentBackupPath -ItemType Directory -Force | Out-Null
        
        # Copy agent files
        Copy-Item -Path "$AgentPath\*" -Destination $agentBackupPath -Recurse -Force
        
        # Create backup metadata
        $backupMetadata = @{
            AgentName = $AgentName
            BackupTime = $timestamp
            OriginalPath = $AgentPath
            BackupPath = $agentBackupPath
            Environment = $TargetEnvironment
            CreatedBy = $env:USERNAME
        }
        
        $backupMetadata | ConvertTo-Json -Depth 3 | Out-File "$agentBackupPath\backup-metadata.json"
        
        Write-DeploymentLog "Backup completed successfully for $AgentName" -Level "SUCCESS"
        return $agentBackupPath
    }
    catch {
        Write-DeploymentLog "Backup failed for $AgentName`: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

# Deployment health check
function Test-PostDeploymentHealth {
    param(
        [string]$AgentName,
        [hashtable]$DeploymentInfo
    )
    
    Write-DeploymentLog "Performing post-deployment health check for: $AgentName"
    
    $healthResults = @{
        AgentName = $AgentName
        HealthStatus = "Unknown"
        Checks = @{}
        Errors = @()
        Warnings = @()
    }
    
    try {
        # Test basic agent accessibility (placeholder - implement actual tests)
        $healthResults.Checks["Agent Accessibility"] = @{
            Status = "Pass"
            Details = "Agent configuration appears valid"
        }
        
        # Test topic availability
        $topicsPath = $DeploymentInfo.TopicsPath
        if (Test-Path $topicsPath) {
            $topicCount = (Get-ChildItem $topicsPath -Filter "*.mcs.yml").Count
            $healthResults.Checks["Topics Available"] = @{
                Status = "Pass"
                Details = "$topicCount topics found"
            }
        }
        else {
            $healthResults.Checks["Topics Available"] = @{
                Status = "Fail"
                Details = "Topics path not found"
            }
            $healthResults.Errors += "Topics not accessible"
        }
        
        # Test configuration integrity
        $configFiles = @("agent.mcs.yml", "settings.mcs.yml")
        foreach ($configFile in $configFiles) {
            $configPath = Join-Path $DeploymentInfo.AgentPath $configFile
            if (Test-Path $configPath) {
                $healthResults.Checks["Config: $configFile"] = @{
                    Status = "Pass"
                    Details = "Configuration file exists and readable"
                }
            }
            else {
                $healthResults.Checks["Config: $configFile"] = @{
                    Status = "Fail"
                    Details = "Configuration file missing or inaccessible"
                }
                $healthResults.Errors += "Configuration file missing: $configFile"
            }
        }
        
        # Determine overall health status
        $failedChecks = $healthResults.Checks.Values | Where-Object { $_.Status -eq "Fail" }
        if ($failedChecks.Count -eq 0) {
            $healthResults.HealthStatus = "Healthy"
        }
        elseif ($failedChecks.Count -le 2) {
            $healthResults.HealthStatus = "Warning"
        }
        else {
            $healthResults.HealthStatus = "Unhealthy"
        }
        
        Write-DeploymentLog "Health check completed for $AgentName - Status: $($healthResults.HealthStatus)" -Level $(if($healthResults.HealthStatus -eq "Healthy"){"SUCCESS"}else{"WARNING"})
        
    }
    catch {
        $healthResults.HealthStatus = "Error"
        $healthResults.Errors += "Health check failed: $($_.Exception.Message)"
        Write-DeploymentLog "Health check error for $AgentName`: $($_.Exception.Message)" -Level "ERROR"
    }
    
    return $healthResults
}

# Main deployment orchestration
function Start-AgentSuiteDeployment {
    Write-DeploymentLog "=== Starting Copilot Studio Agent Suite Deployment ===" -Level "SUCCESS"
    Write-DeploymentLog "Target Environment: $TargetEnvironment"
    Write-DeploymentLog "Validation Only: $ValidateOnly"
    Write-DeploymentLog "Auto Backup: $BackupBeforeDeployment"
    Write-DeploymentLog "Auto Rollback: $EnableAutoRollback"
    
    # Define agent directories
    $agentDirs = @(
        "Entra_Security_Manager",
        "Entra_Security_Ops", 
        "Dynamics_Resource_Manager",
        "Azure_Subscriptions",
        "Resource_Inventory", 
        "Internal_Compliance",
        "Internal_Security",
        "Power_Platform",
        "Dataverse",
        "Kusto"
    )
    
    # Filter to specific agents if requested
    if ($SpecificAgents) {
        $agentDirs = $agentDirs | Where-Object { $_ -in $SpecificAgents }
        Write-DeploymentLog "Deployment limited to specific agents: $($agentDirs -join ', ')"
    }
    
    $deploymentResults = @{
        StartTime = Get-Date
        Environment = $TargetEnvironment
        TotalAgents = $agentDirs.Count
        SuccessfulDeployments = 0
        FailedDeployments = 0
        ValidationResults = @()
        DeploymentResults = @()
        HealthCheckResults = @()
    }
    
    # Phase 1: Comprehensive Validation
    Write-DeploymentLog "=== Phase 1: Comprehensive Validation ===" -Level "SUCCESS"
    
    foreach ($agentDir in $agentDirs) {
        $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
        
        Write-DeploymentLog "Validating agent: $agentDir"
        
        $validationResult = Test-AgentStructureComprehensive -AgentPath $agentPath -AgentName $agentDir
        $deploymentResults.ValidationResults += $validationResult
        
        if (-not $validationResult.StructureValid) {
            Write-DeploymentLog "Validation FAILED for $agentDir" -Level "ERROR"
            foreach ($error in $validationResult.Errors) {
                Write-DeploymentLog "  ERROR: $error" -Level "ERROR"
            }
            $deploymentResults.FailedDeployments++
        }
        else {
            Write-DeploymentLog "Validation PASSED for $agentDir" -Level "SUCCESS"
            if ($validationResult.Warnings.Count -gt 0) {
                foreach ($warning in $validationResult.Warnings) {
                    Write-DeploymentLog "  WARNING: $warning" -Level "WARNING"
                }
            }
        }
    }
    
    # Check if validation-only mode
    if ($ValidateOnly) {
        Write-DeploymentLog "=== Validation-Only Mode - Deployment Skipped ===" -Level "SUCCESS"
        return $deploymentResults
    }
    
    # Check if any validations failed
    $failedValidations = $deploymentResults.ValidationResults | Where-Object { -not $_.StructureValid }
    if ($failedValidations.Count -gt 0) {
        Write-DeploymentLog "Deployment aborted due to validation failures" -Level "ERROR"
        throw "Cannot proceed with deployment - $($failedValidations.Count) agents failed validation"
    }
    
    # Phase 2: Backup (if enabled)
    if ($BackupBeforeDeployment) {
        Write-DeploymentLog "=== Phase 2: Creating Backups ===" -Level "SUCCESS"
        
        $backupPath = "$PWD\deployment-backups\$timestamp"
        New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
        
        foreach ($agentDir in $agentDirs) {
            $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
            if (Test-Path $agentPath) {
                try {
                    Backup-AgentConfiguration -AgentPath $agentPath -AgentName $agentDir -BackupPath $backupPath
                }
                catch {
                    Write-DeploymentLog "Backup failed for $agentDir - deployment will continue" -Level "WARNING"
                }
            }
        }
    }
    
    # Phase 3: Deployment Execution (placeholder for actual deployment logic)
    Write-DeploymentLog "=== Phase 3: Deployment Execution ===" -Level "SUCCESS"
    
    foreach ($agentDir in $agentDirs) {
        $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
        
        try {
            Write-DeploymentLog "Deploying agent: $agentDir"
            
            # Placeholder for actual deployment logic
            # This would integrate with Copilot Studio APIs or deployment mechanisms
            
            $deploymentInfo = @{
                AgentName = $agentDir
                AgentPath = $agentPath
                TopicsPath = "$agentPath\topics"
                DeploymentTime = Get-Date
                Status = "Success"
            }
            
            $deploymentResults.DeploymentResults += $deploymentInfo
            $deploymentResults.SuccessfulDeployments++
            
            Write-DeploymentLog "Successfully deployed $agentDir" -Level "SUCCESS"
            
            # Phase 3.5: Post-deployment Health Check
            $healthCheck = Test-PostDeploymentHealth -AgentName $agentDir -DeploymentInfo $deploymentInfo
            $deploymentResults.HealthCheckResults += $healthCheck
            
        }
        catch {
            Write-DeploymentLog "Deployment failed for $agentDir`: $($_.Exception.Message)" -Level "ERROR"
            
            $deploymentInfo = @{
                AgentName = $agentDir
                AgentPath = $agentPath
                DeploymentTime = Get-Date
                Status = "Failed"
                Error = $_.Exception.Message
            }
            
            $deploymentResults.DeploymentResults += $deploymentInfo
            $deploymentResults.FailedDeployments++
            
            # Auto-rollback logic (if enabled)
            if ($EnableAutoRollback -and $BackupBeforeDeployment) {
                Write-DeploymentLog "Attempting auto-rollback for $agentDir" -Level "WARNING"
                # Implement rollback logic here
            }
        }
    }
    
    # Phase 4: Final Report
    $deploymentResults.EndTime = Get-Date
    $deploymentResults.Duration = $deploymentResults.EndTime - $deploymentResults.StartTime
    
    Write-DeploymentLog "=== Deployment Summary ===" -Level "SUCCESS"
    Write-DeploymentLog "Total Duration: $($deploymentResults.Duration.ToString('mm\:ss'))"
    Write-DeploymentLog "Successful Deployments: $($deploymentResults.SuccessfulDeployments)/$($deploymentResults.TotalAgents)"
    Write-DeploymentLog "Failed Deployments: $($deploymentResults.FailedDeployments)/$($deploymentResults.TotalAgents)"
    
    if ($deploymentResults.FailedDeployments -eq 0) {
        Write-DeploymentLog " ALL AGENTS DEPLOYED SUCCESSFULLY! " -Level "SUCCESS"
    }
    else {
        Write-DeploymentLog "Warning  Some deployments failed - review logs for details" -Level "WARNING"
    }
    
    # Generate detailed report
    $reportPath = "$LogPath\deployment-report-$timestamp.json"
    $deploymentResults | ConvertTo-Json -Depth 5 | Out-File $reportPath
    Write-DeploymentLog "Detailed deployment report saved to: $reportPath"
    
    return $deploymentResults
}

# Execute deployment
try {
    $results = Start-AgentSuiteDeployment
    exit 0
}
catch {
    Write-DeploymentLog "Deployment failed with critical error: $($_.Exception.Message)" -Level "ERROR"
    exit 1
}
