param location string = resourceGroup().location
param allocationMethod string
param skuName string

resource publicIP1 'Microsoft.Network/publicIPAddresses@2022-01-01' = if (allocationMethod == 'Dynamic') {
  name:  'pubIP1'
  location: location
  sku: {
    name:  'Basic'
    tier:  'Regional'
  }
  properties: {
    publicIPAllocationMethod: allocationMethod
  }
}

resource publicIP2 'Microsoft.Network/publicIPAddresses@2022-01-01' = if (allocationMethod == 'Static') {
  name:  'pubIP2'
  location: location
  sku: {
    name:  skuName
    tier:  'Regional'
  }
  properties: {
    publicIPAllocationMethod: allocationMethod
  }
}
