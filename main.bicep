targetScope = 'subscription'

param resourceGroupName1 string = 'test-rg1'
param resourceGroupName2 string = 'test-rg2'
param resourceGroupLocation string = deployment().location

resource testrg1 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: resourceGroupName1
  location: resourceGroupLocation
}

resource testrg2 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: resourceGroupName2
  location: resourceGroupLocation
}

module firstPIP './pip.bicep' = if (resourceGroupName1 == 'test-rg1') {
  name: 'publicIP1'
  scope: testrg1
  params: {
    location: resourceGroupLocation
    allocationMethod: 'Dynamic'
    skuName: 'Basic'
  }
}

module secondPIP './pip.bicep' = if (resourceGroupName2 == 'test-rg2') {
  name: 'publicIP2'
  scope: testrg2
  params: {
    location: resourceGroupLocation
    allocationMethod: 'Dynamic'
    skuName: 'Basic'
  }
}
