# Agent Installation Script for Azure_Subscriptions
Write-Host "Installing agent: Azure_Subscriptions"

# Verify required files
$RequiredFiles = @(
    "agent.mcs.yml",
    "settings.mcs.yml",
    "Readme.md", 
    "icon.png"
)

foreach ($File in $RequiredFiles) {
    if (!(Test-Path $File)) {
        Write-Error "Missing required file: $File"
        exit 1
    }
}

Write-Host "[x] Agent package validated successfully"
Write-Host " Please refer to Readme.md for manual import instructions"
