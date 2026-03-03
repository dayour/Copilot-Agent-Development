# Copilot Studio Agent Package Creator
# This script creates deployment packages for individual agents

param(
    [Parameter(Mandatory=$false)]
    [string]$AgentName = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$PackageAll = $false,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputPath = ".\packages",
    
    [Parameter(Mandatory=$false)]
    [switch]$IncludeSource = $true,
    
    [Parameter(Mandatory=$false)]
    [switch]$ValidatePackage = $true
)

Write-Host "📦 Copilot Studio Agent Package Creator" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Define all available agents
$AvailableAgents = @(
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

function New-AgentPackage {
    param(
        [string]$Agent,
        [string]$OutputDir
    )
    
    $AgentPath = Join-Path $PWD "$Agent\Darbot Resource Manager"
    $PackageName = "$Agent-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
    $PackagePath = Join-Path $OutputDir $PackageName
    
    Write-Host "📦 Creating package for: $Agent" -ForegroundColor Cyan
    
    if (!(Test-Path $AgentPath)) {
        Write-Host "❌ Agent path not found: $AgentPath" -ForegroundColor Red
        return $null
    }
    
    try {
        # Create temporary staging directory
        $StagingDir = Join-Path $env:TEMP "agent-staging-$Agent"
        if (Test-Path $StagingDir) {
            Remove-Item $StagingDir -Recurse -Force
        }
        New-Item -ItemType Directory -Path $StagingDir -Force | Out-Null
        
        # Copy agent files to staging
        Copy-Item -Path "$AgentPath\*" -Destination $StagingDir -Recurse -Force
        
        # Create package metadata
        $Metadata = @{
            AgentName = $Agent
            PackageVersion = "1.0.0"
            CreatedDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            RequiredFiles = @(
                "agent.mcs.yml",
                "settings.mcs.yml", 
                "Readme.md",
                "icon.png",
                "topics\*.mcs.yml",
                ".mcs\*.json",
                ".mcs\*.txt"
            )
            PackageType = "CopilotStudioAgent"
        }
        
        $MetadataJson = $Metadata | ConvertTo-Json -Depth 3
        Set-Content -Path (Join-Path $StagingDir "package-metadata.json") -Value $MetadataJson
        
        # Create installation script
        $InstallScript = @"
# Agent Installation Script for $Agent
Write-Host "Installing agent: $Agent"

# Verify required files
`$RequiredFiles = @(
    "agent.mcs.yml",
    "settings.mcs.yml",
    "Readme.md", 
    "icon.png"
)

foreach (`$File in `$RequiredFiles) {
    if (!(Test-Path `$File)) {
        Write-Error "Missing required file: `$File"
        exit 1
    }
}

Write-Host "✅ Agent package validated successfully"
Write-Host "📖 Please refer to Readme.md for manual import instructions"
"@
        
        Set-Content -Path (Join-Path $StagingDir "install.ps1") -Value $InstallScript
        
        # Create deployment package
        Compress-Archive -Path "$StagingDir\*" -DestinationPath $PackagePath -Force
        
        # Cleanup staging
        Remove-Item $StagingDir -Recurse -Force
        
        Write-Host "✅ Package created: $PackageName" -ForegroundColor Green
        return $PackagePath
        
    } catch {
        Write-Host "❌ Failed to create package for $Agent`: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

function Test-AgentPackage {
    param([string]$PackagePath)
    
    Write-Host "🔍 Validating package: $(Split-Path $PackagePath -Leaf)" -ForegroundColor Yellow
    
    try {
        # Extract to temporary location for validation
        $TempDir = Join-Path $env:TEMP "package-validation-$(Get-Random)"
        Expand-Archive -Path $PackagePath -DestinationPath $TempDir -Force
        
        # Check required files
        $RequiredFiles = @(
            "agent.mcs.yml",
            "settings.mcs.yml",
            "Readme.md",
            "icon.png",
            "package-metadata.json",
            "install.ps1"
        )
        
        $MissingFiles = @()
        foreach ($File in $RequiredFiles) {
            if (!(Test-Path (Join-Path $TempDir $File))) {
                $MissingFiles += $File
            }
        }
        
        # Check topics folder
        $TopicsPath = Join-Path $TempDir "topics"
        if (!(Test-Path $TopicsPath)) {
            $MissingFiles += "topics folder"
        } else {
            $TopicFiles = Get-ChildItem $TopicsPath -Filter "*.mcs.yml"
            if ($TopicFiles.Count -lt 16) {
                Write-Host "⚠️  Warning: Only $($TopicFiles.Count) topic files found (expected 16+)" -ForegroundColor Yellow
            }
        }
        
        # Check .mcs folder
        $McsPath = Join-Path $TempDir ".mcs"
        if (!(Test-Path $McsPath)) {
            $MissingFiles += ".mcs folder"
        }
        
        # Cleanup
        Remove-Item $TempDir -Recurse -Force
        
        if ($MissingFiles.Count -eq 0) {
            Write-Host "✅ Package validation passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ Package validation failed. Missing files:" -ForegroundColor Red
            foreach ($File in $MissingFiles) {
                Write-Host "   • $File" -ForegroundColor Red
            }
            return $false
        }
        
    } catch {
        Write-Host "❌ Package validation error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution
try {
    # Create output directory
    if (!(Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
        Write-Host "📁 Created output directory: $OutputPath" -ForegroundColor Green
    }
    
    $AgentsToPackage = @()
    
    if ($PackageAll) {
        $AgentsToPackage = $AvailableAgents
        Write-Host "📦 Packaging all $($AgentsToPackage.Count) agents..." -ForegroundColor Yellow
    } elseif ($AgentName -and $AgentName -in $AvailableAgents) {
        $AgentsToPackage = @($AgentName)
        Write-Host "📦 Packaging single agent: $AgentName..." -ForegroundColor Yellow
    } else {
        Write-Host "❌ Please specify a valid agent name or use -PackageAll" -ForegroundColor Red
        Write-Host "Available agents:" -ForegroundColor Gray
        foreach ($Agent in $AvailableAgents) {
            Write-Host "  • $Agent" -ForegroundColor Gray
        }
        exit 1
    }
    
    $PackageResults = @{}
    
    foreach ($Agent in $AgentsToPackage) {
        $PackagePath = New-AgentPackage -Agent $Agent -OutputDir $OutputPath
        
        if ($PackagePath) {
            $PackageResults[$Agent] = @{
                Success = $true
                PackagePath = $PackagePath
                Validated = $false
            }
            
            if ($ValidatePackage) {
                $ValidationResult = Test-AgentPackage -PackagePath $PackagePath
                $PackageResults[$Agent].Validated = $ValidationResult
            }
        } else {
            $PackageResults[$Agent] = @{
                Success = $false
                Error = "Package creation failed"
            }
        }
    }
    
    # Summary report
    Write-Host ""
    Write-Host "📊 Packaging Summary" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    $SuccessCount = ($PackageResults.Values | Where-Object { $_.Success }).Count
    $TotalCount = $PackageResults.Count
    
    Write-Host ""
    Write-Host "📈 Statistics:" -ForegroundColor Yellow
    Write-Host "  ├─ Total Agents: $TotalCount" -ForegroundColor White
    Write-Host "  ├─ Successful: $SuccessCount" -ForegroundColor Green
    Write-Host "  ├─ Failed: $($TotalCount - $SuccessCount)" -ForegroundColor Red
    Write-Host "  └─ Output Path: $OutputPath" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📦 Package Details:" -ForegroundColor Yellow
    
    foreach ($Agent in $PackageResults.Keys) {
        $Result = $PackageResults[$Agent]
        
        if ($Result.Success) {
            $PackageFile = Split-Path $Result.PackagePath -Leaf
            $ValidationStatus = if ($Result.Validated) { "✅ VALID" } else { "⚠️  NOT VALIDATED" }
            $ValidationColor = if ($Result.Validated) { "Green" } else { "Yellow" }
            
            Write-Host "  $Agent`:" -ForegroundColor White
            Write-Host "    ├─ Package: $PackageFile" -ForegroundColor Gray
            Write-Host "    └─ Status: $ValidationStatus" -ForegroundColor $ValidationColor
        } else {
            Write-Host "  $Agent`: ❌ FAILED" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Review package contents before deployment" -ForegroundColor Gray
    Write-Host "  2. Use deploy-agents.ps1 for automated deployment" -ForegroundColor Gray
    Write-Host "  3. Or manually import packages into Copilot Studio" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "🏁 Packaging Complete!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "💥 Packaging failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
