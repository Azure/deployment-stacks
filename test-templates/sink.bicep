
param location string = resourceGroup().location

var msiName = 'msi'
var policyDefinitionId = tenantResourceId('Microsoft.Authorization/policyDefinitions' , '044985bb-afe1-42cd-8a36-9d5d42424537')

resource roleDef 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  name: 'acdd72a7-3385-48ef-bd42-f606fba81ae7' //reader
}

// tracked resource
resource storageaccount 'Microsoft.Storage/storageAccounts@2021-02-01' = {
  name: 'st${uniqueString(resourceGroup().id)}'
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Premium_LRS'
  }
}

// extension resource lock
resource lock 'Microsoft.Authorization/locks@2017-04-01' = {
  scope: storageaccount
  name: 'storage-delete'
  properties: {
    level: 'CanNotDelete'
  }
}

// MSI so I don't have to manually specify an objectId
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2018-11-30' = {
  name: msiName
  location: location
}

// extension/proxy resource at rg scope
resource roleAssignment 'Microsoft.Authorization/roleAssignments@2020-10-01-preview' = {
  name: guid(roleDef.id, managedIdentity.id, resourceGroup().id) // this will cause a collision if the roleAssignment is not cleaned up by the stack
  properties: {
    roleDefinitionId: roleDef.id
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// proxy and global
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' = {
  name: 'dns-${uniqueString(resourceGroup().id)}.local'
  location: 'global'
}

resource policyAssignment 'Microsoft.Authorization/policyAssignments@2020-09-01' = {
  name: guid(policyDefinitionId, resourceGroup().name)
  location: location
  properties: {
    //scope: '/'
    policyDefinitionId: policyDefinitionId

  }
}
