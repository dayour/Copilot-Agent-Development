@maxLength(20)
@minLength(4)
@description('Used to generate names for all resources in this file')
param resourceBaseName string

@description('Required when creating the Azure Bot service')
param botAadAppClientId string

@secure()
@description('Required by the Bot Framework package in the bot project')
param botAadAppClientSecret string

param webAppSKU string = 'B1'

@maxLength(42)
param botDisplayName string

param serverfarmsName string = resourceBaseName
param webAppName string = resourceBaseName
param keyVaultName string = '${resourceBaseName}kv'
param appInsightsName string = '${resourceBaseName}ai'
param logAnalyticsName string = '${resourceBaseName}law'
param location string = resourceGroup().location
param oauthConnectionName string

// ---- Log Analytics workspace (required by App Insights v2) ----
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ---- Application Insights ----
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ---- App Service Plan ----
resource serverfarm 'Microsoft.Web/serverfarms@2022-03-01' = {
  kind: 'app'
  location: location
  name: serverfarmsName
  sku: {
    name: webAppSKU
  }
}

// ---- Key Vault ----
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enableRbacAuthorization: true
  }
}

// Store bot client secret in Key Vault
resource botSecretEntry 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'BotPassword'
  properties: {
    value: botAadAppClientSecret
  }
}

// ---- Web App ----
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  kind: 'app'
  location: location
  name: webAppName
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: serverfarm.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      nodeVersion: '~20'
      appSettings: [
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
        {
          name: 'RUNNING_ON_AZURE'
          value: '1'
        }
        {
          name: 'BOT_ID'
          value: botAadAppClientId
        }
        {
          name: 'BOT_PASSWORD'
          value: '@Microsoft.KeyVault(SecretUri=${keyVault.properties.vaultUri}secrets/BotPassword/)'
        }
        {
          name: 'OAUTH_CONNECTION_NAME'
          value: oauthConnectionName
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'KEY_VAULT_URI'
          value: keyVault.properties.vaultUri
        }
      ]
      ftpsState: 'FtpsOnly'
    }
  }
}

// Grant the Web App managed identity Key Vault Secrets User role
var keyVaultSecretsUserRoleId = '4633458b-17de-408a-b874-0445c86b69e6'
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, webApp.id, keyVaultSecretsUserRoleId)
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRoleId)
    principalId: webApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Register the web service as a bot with the Bot Framework
module azureBotRegistration './botRegistration/azurebot.bicep' = {
  name: 'Azure-Bot-registration'
  params: {
    resourceBaseName: resourceBaseName
    botAadAppClientId: botAadAppClientId
    botAadAppClientSecret: botAadAppClientSecret
    botAppDomain: webApp.properties.defaultHostName
    botDisplayName: botDisplayName
    oauthConnectionName: oauthConnectionName
  }
}

output BOT_AZURE_APP_SERVICE_RESOURCE_ID string = webApp.id
output BOT_DOMAIN string = webApp.properties.defaultHostName
output APP_INSIGHTS_CONNECTION_STRING string = appInsights.properties.ConnectionString
output KEY_VAULT_URI string = keyVault.properties.vaultUri
