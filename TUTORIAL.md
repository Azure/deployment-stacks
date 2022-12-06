# Tutorial: Create and manage your first deployment stack

A _deployment stack_ is a native Azure resource type that enables you to manage
Azure resources as a single unit at different Azure management scopes. Because a deployment
stack is a Azure resource, you can perform any typical administrative actions on the stack,
for example:

- Protect access with Azure role-based access control (RBAC) assignments
- Govern compliance with Azure Policy
- Surface security recommendations with Microsoft Defender for Cloud

This tutorial walks you through an Azure deployment stack example that uses a Bicep
module template and associated Bicep resource template.

For more information about deployment stacks, see the [readme](./README.md).

In this tutorial you'll use the Azure Command-Line Interface (CLI)
and Azure PowerShell to create, modify, and delete a new deployment stack.

## Install the tooling

To install the Azure CLI and Deployment Stacks Azure PowerShell
module, check the [readme](./README.md).

## Set up your deployment template

We begin with an Azure deployment authored with Bicep templates that creates two resource groups
with one public IP address within each resource group. By deploying this Bicep template with
parameter default values, you'll create two resource groups (test-rg1 and test-rg2) with one public
IP address resource (publicIP1 and publicIP2, respectively) in each respective group.


Start by creating a Bicep module template named **main.bicep** using [Visual Studio Code](https://code.visualstudio.com/) with
the [Bicep extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-bicep).

```bicep
targetScope='subscription'

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
    allocationMethod: 'Static'
    skuName: 'Basic'
  }
}
```

Next, create another Bicep resource template that defines the two public IP address resources.
We reference this template from `main.bicep`'. Following is a sample Bicep template named `pip.bicep`:

```bicep
param location string = 'eastus'
param allocationMethod string
param skuName string

resource publicIP1 'Microsoft.Network/publicIPAddresses@2022-01-01' = if (allocationMethod == 'Dynamic') {
  name:  'pubIP1'
  location: location
  sku: {
    name:  skuName
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
```

> [!NOTE]
> Bicep files can have any valid file name. **main** is
> a community convention, similar to how **azuredeploy** is used as a
> conventual Azure Resource Manager (ARM) template file name.

## Create a deployment stack

Use `az stack sub create` to create a deployment stack by using Azure CLI.

```azurecli
az stack sub create \
  --name mySubStack \
  --location eastus \
  --template-file main.bicep
```

Use `New-AzSubscriptionDeploymentStack` to create a deployment stack by using Azure PowerShell.

```powershell
New-AzSubscriptionDeploymentStack -Name 'mySubStack' `
   -DeploymentScope 'subscription' `
   -Location 'eastus' `
   -TemplateFile './main.bicep'
```

With Azure CLI, use `az stack sub list` to check deployment status or list your deployment stack
resources defined created in the designated Azure scope.

```azurecli
az stack sub list

C:\> az stack sub list
Name          State      Last Modified     Deployment Id
------------  ---------  ---------------   -------------
mySubStack    succeeded  2022-11-29T14..   /subscriptions/fc../providers/Microsoft.Resources/deployments/mySubStack-2022-11-29..
```

The analogous Azure PowerShell command to list deployment stack resources is `Get-AzSubscriptionDeploymentStack`:

```powershell
C:\> Get-AzSubscriptionDeploymentStack

Id                : /subscriptions/fc8d../providers/Microsoft.Resources/deploymentStacks/mySubStack
Name              : mySubStack
ProvisioningState : succeeded
UpdateBehavior    : detachResources
Location          : eastus
CreationTime(UTC) : Tue, 11, 29, 2022 2:58:30 PM
ManagedResources  : /subscriptions/fc8d../resourceGroups/test-rg1
                    /subscriptions/fc8d../resourceGroups/test-rg1/providers/Microsoft.Network/publicIPAddresses/pubIP1
                    /subscriptions/fc8d../resourceGroups/test-rg2
                    /subscriptions/fc8d../resourceGroups/test-rg2/providers/Microsoft.Network/publicIPAddresses/pubIP2
DeploymentId      : /subscriptions/fc8d../providers/Microsoft.Resources/deployments/mySubStack-2022-11-29-14-58-34-
                    99d05
SnapshotId        : /subscriptions/fc8d../providers/Microsoft.Resources/deploymentStacks/mySubStack/snapshots/2022-11-29-14-58-34-99d05
```

## View the managed resources in a deployment stack

During private preview, the deployment stack service doesn't yet have an Azure
portal graphical user interface (GUI). To view the managed resources enclosed
within a deployment stack, use the following Azure PowerShell command:

```powershell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).Resources
```

## Update a deployment stack

When you manage your Azure deployments with deployment stacks, you service those deployments by
modifying the underlying Bicep or ARM deployment templates and re-running `az stack sub create`
or `New-AzSubscriptionDeploymentStack`.

For instance, edit `main.bicep` for the `firstPIP` module and update the `allocationMethod`
property to `Static`:

```bicep
  allocationMethod: 'Static'
```

To update the deployment stack's managed resources with Azure CLI,
run `az stack sub create` again and confirm you
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
from deletion by unauthorized security principals (be default, everyone).

Following are the relevant `az stack sub create` parameters:

- `deny-settings-mode`: Defines how resources deployed by the deployment stack are locked
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

To manage deployment stack locks with Azure PowerShell, include the `-UpdateBehavior` parameter
of the `New-AzSubscriptionDeploymentStack` command; the legal
values are as follows:

- `detachResources`: Upon detach, don't delete the previously managed resources
- `purgeResources`: Upon detach, delete the previously managed resources

## Detach a resource

By default, deployment stacks detach and don't delete resources when they're no longer contained
within the stack's management scope.

To test the default detach capability, remove one of the public IP address definitions in
your `main.bicep` deployment template.

Next, run `az stack sub create` or `New-AzSubscriptionDeploymentStack` again to update the stack.

After the deployment succeeds, you should still see the detached storage account in your
subscription. When you list the stack's managed resources, you should _not_ see the public IP
address you detached.

## Delete a managed resource

To instruct Azure to delete detached resources, update the stack with **az stack sub create**
and pass one of the following parameters:

- `--delete-all`: Flag to indicate delete rather than detach for managed resources and resource groups
- `--delete-resources`: Flag to indicate delete rather than attach for managed resources only
- `--delete-resource-groups`: Flag to indicate delete rather than detach for managed resource groups only

> [!NOTE]
> When you delete resource groups using the previously listed parameters, the resource groups are
> deleted regardless of whether they're empty.

Update the deployment stack by running the following command:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep `
  --delete-resources
```

To do the same thing with Azure PowerShell, run the following command:

```azurepowershell
New-AzSubscriptionDeploymentStack -Name mySubStack `
-Location eastus
-TemplateFile ./main.bicep `
-UpdateBehavior purgeResources
```

If you removed one of the public IP addresses from your Bicep deployment template, then after
running the code above you should observe:

- The resource group containing the removed public IP address still exits
- The removed public IP address is deleted
- The other resource group and public IP address still exist

## Delete the deployment stack

To remove the deployment stack and its managed resources from your Azure subscription, run the following CLI
command to delete the entire deployment stack.

> [!NOTE]
> If you run `az stack sub delete` without the `--delete-all`, `--delete-resource-groups`, or
`--delete-resources` parameters, the managed resources will be detached but not deleted.

```azurecli
az stack sub delete `
  --name mySubStack `
  --delete-all
```

Run `az stack sub list` to verify the deployment stack resource is deleted.

You should also note in the Azure portal the resource groups and remaining
public IP address have been deleted.

Here's how to do the same thing with Azure PowerShell using the `Remove-AzSubscriptionDeploymentStack` command:

```azurepowershell
Remove-AzSubscriptionDeploymentStack `
-ResourceId <insert> `
```

## Next steps

To learn more about deployment stacks, see the [tutorial](./TUTORIAL.md).

## Contribute

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (for example, status check, comment). Follow the instructions
provided by the bot. You will only need to do this once across all repositories using our CLA.

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
