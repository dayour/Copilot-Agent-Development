# Master Validation Script for Copilot Studio Agent Suite
# This script runs comprehensive validation across all agents and components

Write-Host "🎯 Copilot Studio Agent Suite - Master Validation" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

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

$validationResults = @{}

# 1. Agent Structure Validation
Write-Host "🏗️  Step 1: Agent Structure Validation" -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Gray

foreach ($agentDir in $agentDirs) {
    $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
    $validationResults[$agentDir] = @{
        StructureValid = $false
        ConfigValid = $false
        TopicsValid = $false
        McsValid = $false
        ReadmeValid = $false
    }
    
    if (Test-Path $agentPath) {
        # Check essential files
        $agentYml = Test-Path (Join-Path $agentPath "agent.mcs.yml")
        $settingsYml = Test-Path (Join-Path $agentPath "settings.mcs.yml")
        $readme = Test-Path (Join-Path $agentPath "Readme.md")
        $icon = Test-Path (Join-Path $agentPath "icon.png")
        $topicsDir = Test-Path (Join-Path $agentPath "topics")
        $mcsDir = Test-Path (Join-Path $agentPath ".mcs")
        
        $validationResults[$agentDir].StructureValid = $agentYml -and $settingsYml -and $readme -and $icon -and $topicsDir -and $mcsDir
        
        Write-Host "  $agentDir`: $(if($validationResults[$agentDir].StructureValid){'✓ PASS'}else{'✗ FAIL'})" -ForegroundColor $(if($validationResults[$agentDir].StructureValid){'Green'}else{'Red'})
    } else {
        Write-Host "  $agentDir`: ✗ DIRECTORY NOT FOUND" -ForegroundColor Red
    }
}

Write-Host ""

# 2. Topics Validation
Write-Host "📝 Step 2: Topics Validation" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Gray

foreach ($agentDir in $agentDirs) {
    $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
    
    if (Test-Path $agentPath) {
        $topicsPath = Join-Path $agentPath "topics"
        $topicFiles = Get-ChildItem $topicsPath -Filter "*.mcs.yml" -ErrorAction SilentlyContinue
        
        # Expected minimum topics (base 13 + 3 specialized = 16)
        $expectedTopicCount = 16
        $actualTopicCount = $topicFiles.Count
        
        $validationResults[$agentDir].TopicsValid = $actualTopicCount -ge $expectedTopicCount
        
        Write-Host "  $agentDir`: $actualTopicCount topics $(if($validationResults[$agentDir].TopicsValid){'✓ PASS'}else{'✗ FAIL (need ' + $expectedTopicCount + ')'})" -ForegroundColor $(if($validationResults[$agentDir].TopicsValid){'Green'}else{'Red'})
    }
}

Write-Host ""

# 3. Configuration Validation
Write-Host "⚙️  Step 3: Configuration Validation" -ForegroundColor Cyan
Write-Host "------------------------------------" -ForegroundColor Gray

foreach ($agentDir in $agentDirs) {
    $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
    
    if (Test-Path $agentPath) {        try {
            # Validate agent.mcs.yml
            $agentYmlPath = Join-Path $agentPath "agent.mcs.yml"
            $agentData = Get-Content $agentYmlPath -Raw
            $agentValid = ($agentData -match "kind:") -and ($agentData -match "instructions:")
            
            # Validate settings.mcs.yml
            $settingsYmlPath = Join-Path $agentPath "settings.mcs.yml"
            $settingsData = Get-Content $settingsYmlPath -Raw
            $settingsValid = ($settingsData -match "displayName:") -and ($settingsData -match "schemaName:")
            
            $validationResults[$agentDir].ConfigValid = $agentValid -and $settingsValid
            
            Write-Host "  $agentDir`: $(if($validationResults[$agentDir].ConfigValid){'✓ PASS'}else{'✗ FAIL'})" -ForegroundColor $(if($validationResults[$agentDir].ConfigValid){'Green'}else{'Red'})
        }
        catch {
            $validationResults[$agentDir].ConfigValid = $false
            Write-Host "  $agentDir`: ✗ FAIL (YAML parsing error)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# 4. MCS Configuration Validation
Write-Host "🔧 Step 4: MCS Configuration Validation" -ForegroundColor Cyan
Write-Host "---------------------------------------" -ForegroundColor Gray

foreach ($agentDir in $agentDirs) {
    $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
    
    if (Test-Path $agentPath) {
        $mcsPath = Join-Path $agentPath ".mcs"
        $connJson = Test-Path (Join-Path $mcsPath "conn.json")
        $botDef = Test-Path (Join-Path $mcsPath "botdefinition.json")
        $changeToken = Test-Path (Join-Path $mcsPath "changetoken.txt")
        
        $validationResults[$agentDir].McsValid = $connJson -and $botDef -and $changeToken
        
        Write-Host "  $agentDir`: $(if($validationResults[$agentDir].McsValid){'✓ PASS'}else{'✗ FAIL'})" -ForegroundColor $(if($validationResults[$agentDir].McsValid){'Green'}else{'Red'})
    }
}

Write-Host ""

# 5. Documentation Validation
Write-Host "📚 Step 5: Documentation Validation" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Gray

foreach ($agentDir in $agentDirs) {
    $agentPath = Join-Path $PWD "$agentDir\Darbot Resource Manager"
    
    if (Test-Path $agentPath) {
        $readmePath = Join-Path $agentPath "Readme.md"
        
        if (Test-Path $readmePath) {
            $readmeContent = Get-Content $readmePath -Raw
            $hasTitle = $readmeContent -match "^#\s+"
            $hasDescription = $readmeContent.Length -gt 500  # Basic content check
            
            $validationResults[$agentDir].ReadmeValid = $hasTitle -and $hasDescription
            
            Write-Host "  $agentDir`: $(if($validationResults[$agentDir].ReadmeValid){'✓ PASS'}else{'✗ FAIL'})" -ForegroundColor $(if($validationResults[$agentDir].ReadmeValid){'Green'}else{'Red'})
        } else {
            $validationResults[$agentDir].ReadmeValid = $false
            Write-Host "  $agentDir`: ✗ FAIL (README missing)" -ForegroundColor Red
        }
    }
}

Write-Host ""

# Summary Report
Write-Host "📊 Validation Summary Report" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""

$totalAgents = $agentDirs.Count
$passedStructure = 0
$passedConfig = 0
$passedTopics = 0
$passedMcs = 0
$passedReadme = 0
$fullyValid = 0

foreach ($agentDir in $agentDirs) {
    $result = $validationResults[$agentDir]
    
    if ($result.StructureValid) { $passedStructure++ }
    if ($result.ConfigValid) { $passedConfig++ }
    if ($result.TopicsValid) { $passedTopics++ }
    if ($result.McsValid) { $passedMcs++ }
    if ($result.ReadmeValid) { $passedReadme++ }
    
    if ($result.StructureValid -and $result.ConfigValid -and $result.TopicsValid -and $result.McsValid -and $result.ReadmeValid) {
        $fullyValid++
    }
    
    $status = if ($result.StructureValid -and $result.ConfigValid -and $result.TopicsValid -and $result.McsValid -and $result.ReadmeValid) { "✅ READY" } else { "⚠️  ISSUES" }
    Write-Host "  $agentDir`: $status" -ForegroundColor $(if($status -eq "✅ READY"){'Green'}else{'Yellow'})
}

Write-Host ""
Write-Host "📈 Statistics:" -ForegroundColor Yellow
Write-Host "  ├─ Total Agents: $totalAgents" -ForegroundColor White
Write-Host "  ├─ Structure Valid: $passedStructure/$totalAgents" -ForegroundColor White
Write-Host "  ├─ Configuration Valid: $passedConfig/$totalAgents" -ForegroundColor White
Write-Host "  ├─ Topics Valid: $passedTopics/$totalAgents" -ForegroundColor White
Write-Host "  ├─ MCS Config Valid: $passedMcs/$totalAgents" -ForegroundColor White
Write-Host "  ├─ Documentation Valid: $passedReadme/$totalAgents" -ForegroundColor White
Write-Host "  └─ Fully Ready: $fullyValid/$totalAgents" -ForegroundColor White

Write-Host ""

if ($fullyValid -eq $totalAgents) {
    Write-Host "🎉 SUCCESS: All agents are fully validated and ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✨ Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Import agents into Copilot Studio environment" -ForegroundColor Gray
    Write-Host "  2. Update environment-specific configuration" -ForegroundColor Gray
    Write-Host "  3. Test each agent individually" -ForegroundColor Gray
    Write-Host "  4. Implement cross-agent orchestration" -ForegroundColor Gray
    Write-Host "  5. Conduct integration testing" -ForegroundColor Gray
} else {
    Write-Host "⚠️  WARNING: $($totalAgents - $fullyValid) agents have validation issues." -ForegroundColor Yellow
    Write-Host "💡 Review the detailed output above and fix any FAIL items before deployment." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🏁 Master Validation Complete!" -ForegroundColor Green
