// target this stack to one resourceGroup - then another rg named 'cousin' must exist in the same sub


param location string = resourceGroup().location

resource publicIPAddress 'Microsoft.Network/publicIPAddresses@2019-11-01' = {
  name: 'ip'
  location: location
  properties: {
    publicIPAllocationMethod: 'Dynamic'
  }
}

// cross rg with resource
module minavs 'br/public:compute/availability-set:1.0.1' = {
  scope: resourceGroup('cousin')
  name: '${uniqueString(deployment().name, 'WestEurope')}-minavs'
  params: {
    name: 'carml-az-avs-min-01'
  }
}

// cross rg empty
module helloWorld 'br/public:samples/hello-world:1.0.1' = {
  scope: resourceGroup('cousin')
  name: 'helloWorld'
  params: {
    name: 'Bicep developers'
  }
}
