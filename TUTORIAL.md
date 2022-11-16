# Tutorial: Create and manage your first deployment stack

Deployment stacks are a logical grouping concept that makes it easier to control
your Azure deployments throughout their lifecycle. With deployment stacks you
combine the DevOps principle of _infrastructure as a code_ with the power of
Azure Resource Manager (ARM).

For more information about deployment stacks, see the [readme](./README.md).

In this tutorial you'll use the Deployment Stacks Command-Line Interface (CLI)
to create, modify, and delete a new deployment stack.

## Install the tooling

To install the Deployment Stacks CLI, check the [readme](./README.md).

## Set up our ARM deployment template

We begin with a Bicep deployment that creates two resource groups with one
public IP address within each resource group. If you use the the module script's parameter defaults,
then your resulting **mySubStack** deployment stack will look like this:

- Resource group: test-rg1
  - Public IP address: myPubIP1
- Resource  group: test-rg2
  - Public IP address: myPubIP2

Start by creating a Bicep module file named **main.bicep**:

```bicep
targetScope='subscription'

param resourceGroupName1 string = 'test-rg1'
param resourceGroupName2 string = 'test-rg2'
param resourceGroupLocation string = 'eastus'

resource testrg1 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: resourceGroupName1
  location: resourceGroupLocation
}

resource testrg2 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: resourceGroupName2
  location: resourceGroupLocation
}

module firstPIP './pip1.bicep' = if (resourceGroupName1 == 'test-rg1') {
  name: 'publicIP1'
  scope: testrg1
  params: {
    pubIPName: 'publicIP1'
    location: resourceGroupLocation
    allocationMethod: 'Dynamic'
    skuName: 'Basic'
  }
}

module secondPIP './pip1.bicep' = if (resourceGroupName2 == 'test-rg2') {
  name: 'publicIP2'
  scope: testrg2
  params: {
    pubIPName: 'publicIP2'
    location: resourceGroupLocation
    allocationMethod: 'Dynamic'
    skuName: 'Basic'
  }
}
```

Next, create two Bicep scripts to define each public IP address resource. Following is a
sample script named `pip1.bicep`:

```bicep
param location string = 'eastus'
param pubIPName string
param allocationMethod string
param skuName string

resource publicIP1 'Microsoft.Network/publicIPAddresses@2022-01-01' = {
  name:  pubIPName
  location: location
  sku: {
    name:  skuName
    tier:  'Regional'
  }
  properties: {
    publicIPAllocationMethod: allocationMethod
  }
}
```

And here is a sample definition for the second public IP address named `pip2.bicep`:

```bicep
param location string = 'eastus'
param pubIPName string
param allocationMethod string
param skuName string

resource publicIP2 'Microsoft.Network/publicIPAddresses@2022-01-01' = {
  name:  pubIPName
  location: location
  sku: {
    name:  skuName
    tier:  'Regional'
  }
  properties: {
    publicIPAllocationMethod: allocationMethod
  }
}
```

> [!NOTE]
> Bicep files can have any valid file name. **main** is
> simply a community convention, similar to how **azuredeploy** is used as a conventual Azure Resource Manager (ARM) template file name.

## Create a deployment stack

Use `az stack sub create` to create a deployment stack.

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep
```

Use `az stack sub show` to check deployment status or list your deployment stacks
defined created in the targeted Azure scope.

```azurecli
az stack sub show `
  --name mySubStack
```

## List deployment stack resources

During private preview, Deployment stacks does not have an Azure portal graphical user interface (GUI).
To view the managed resources enclosed within a deployment stack, use the following
Azure PowerShell command:

> [!NOTE]
> See the [readme](./README.md) for instructions on installing the deployment stacks PowerShell module.

```powershell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).ManagedResources

```

## Update a deployment stack

When you manage your Azure deployments with deployment stacks, you service those deployments by
modifying the underlying Bicep or ARM deployment templates and re-running `az stack sub create`.

For instance, edit `main.bicep` for the `firstPIP` module and update the `allocationMethod`
property to `Static`:

```bicep
  allocationMethod: 'Static'
```

To update the deployment stack, run `az stack sub create` again and confirm you
want to overwrite the existing stack definition:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep
```

Sign into the Azure portal, check the properties of the `publicIP` resource and verify its
address allocation method is now static instead of dynamic.

## Protect managed resources against deletion

The `--deny-delete` CLI parameter places a special lock on managed resources that prevents them
from being deleted by unauthorized security principals (be default, everyone).

Following are the relevant `az stack sub create` parameters:

- `deny-settings-mode`: Defines how resources deployed by the deployment stack are locked. Valid values are <TO DO>
- `deny-settings-excluded-principals`: Comma-separated list of Azure Active Directory (Azure AD) principal IDs excluded from the lock. Up to five principals are allowed
- `deny-settings-apply-to-child-scopes`: Deny settings will be applied to child Azure management scopes
- `deny-settings-excluded-actions`: List of role-based access control (RBAC) management operations excluded from the deny settings. Up to 200 actions are allowed

To apply a `denyDelete` lock to your deployment stack, update your deployment stack definition,
specifying the appropriate parameter(s):

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep `
  --deny-settings-mode "denyDelete"
```

Verify the `denyDelete` lock works as expected by signing into the Azure portal and attempting to
delete `publicIP1` or `publicIP2`. The request should fail.

## Detach a resource

By default, deployment stacks detach and do not delete resources when they are no longer contained
within the stack's management scope.

To test the default detach capability, remove one of the public IP address definitions in
your `main.bicep` script.

Next, run ``az stack sub create`` again to update the stack.

After the deployment succeeds, you should still see the detached storage account in your
subscription. When you list the stack's managed resources, you should _not_ see the public IP
address you detached.

## Delete a managed resource

To instruct Azure to delete detached resources, update the stack with **az stack sub create**
and pass one of the following parameters:

- `--delete-all`: Flag to indicate delete rather than detach for managed resources and resource groups
- `--delete-resources`: Flag to indicate delete rather than attach for managed resources only
- `--delete-resource-groups`: Flag to indicate delete rather than detach for managed resource groups only

Update the deployment stack by running the following command:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep `
  --delete-resources
```

If you removed one of the public IP addresses from your Bicep deployment script, then after
running the code above you should observe:

- The resource group containing the removed public IP address still exits
- The removed public IP address is deleted
- The other resource group and public IP address still exist

## Delete the deployment stack

To remove the deployment stack and its managed resources from your Azure subscription, run the following CLI
command to delete the entire deployment stack.

> [!NOTE]
> If you run `az stack sub delete` without the `--delete-all`, `--delete-resource-groups`, or
`--delete-resources` parameters, the managed resources will be detached (unmanaged), but not deleted.

```azurecli
az stack sub delete `
  --name mySubStack `
  --delete-all
```

Run `az stack sub list` to verify the deployment stack resource is deleted.

You should also note in the Azure portal the resource groups and remaining
public IP address have been deleted.

## Next steps

To learn more about deployment stacks, see the [tutorial](./TUTORIAL.md).

## Contribute

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those
third-party's policies.
