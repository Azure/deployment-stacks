# Tutorial: Create and manage your first deployment stack

A _deployment stack_ is a native Azure resource type that enables you to manage
Azure resources as a single unit at different Azure management scopes. Because a deployment
stack is a Azure resource, you can perform any typical administrative actions on the stack,
for example:

- Protect access with Azure role-based access control (RBAC) assignments
- Govern compliance with Azure Policy
- Surface security recommendations with Microsoft Defender for Cloud

This tutorial walks you through an Azure deployment stack example that uses Bicep
module and resource templates.

For more information about deployment stacks, see the [readme](./README.md).

In this tutorial you'll use the Azure Command-Line Interface (CLI)
and Azure PowerShell to create, modify, and delete a new deployment stack.

## Install the tooling

To install the Azure CLI and Deployment Stacks Azure PowerShell
module, check the [readme](./README.md).

## Set up your deployment template

We begin with an Azure deployment that uses Bicep templates to create two resource groups
with one public IP address within each resource group. By deploying this Bicep template with
parameter default values, you'll create two resource groups (test-rg1 and test-rg2) with one public
IP address resource (publicIP1 and publicIP2, respectively) in each respective group.

> NOTE: The Bicep template in this tutorial represents a simple example for training purposes; it is not meant to be a production-ready template. For more information on using modules, see [Bicep modules](/azure/azure-resource-manager/bicep/modules).

Start by creating a Bicep module template named **main.bicep** using [Visual Studio Code](https://code.visualstudio.com/) with
the [Bicep extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-bicep).

```bicep
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
    allocationMethod: 'Static'
    skuName: 'Basic'
  }
}
```

Create another Bicep resource template that defines the two public IP address resources.
We'll reference this template from `main.bicep`'. Following is a sample Bicep template named `pip.bicep`:

```bicep
param location string = resourceGroup().location
param allocationMethod string = 'Dynamic'
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
```

> NOTE:
> Bicep files can have any valid file name. **main** is
> a community convention, similar to how **azuredeploy** is used as a
> conventional Azure Resource Manager (ARM) template file name.

## Create a deployment stack

The value of deploying our new Azure environment as a deployment stack is we can
manage the deployment centrally, including locking managed resources against modification
or deletion.

Use `az stack sub create` to create a deployment stack by using Azure CLI that targets the subscription scope.

```azurecli
az stack sub create \
  --name mySubStack \
  --location eastus \
  --template-file main.bicep
```

Alternatively, use `New-AzSubscriptionDeploymentStack` to create a deployment stack by using Azure PowerShell.

```powershell
New-AzSubscriptionDeploymentStack -Name 'mySubStack' `
   -Location 'eastus' `
   -TemplateFile './main.bicep'
```

> NOTE: You can create a deployment stack at the Azure management group, subscription, or resource group management scopes. For example, use `az stack group create` or `New-AzResourceGroupDeploymentStack` to create a deployment stack at the resource group scope. Likewise, use `az stack mg create` or `New-AzManagementGroupDeploymentStack` to create a deployment stack at the management group scope.

With Azure CLI, use `az stack sub list` to check deployment status or list your deployment stack
resources defined created in the designated Azure scope.

```azurecli
az stack sub list

C:\> az stack sub list
Name          State      Last Modified     Deployment Id
------------  ---------  ---------------   -------------
mySubStack    succeeded  2022-11-29T14..   /subscriptions/.../Microsoft.Resources/deployments/mySubStack-2022-11-29...
```

Alternatively, use the `Get-AzSubscriptionDeploymentStack` Azure PowerShell command to list deployment stack resources.

```powershell
C:\> Get-AzSubscriptionDeploymentStack

Id                         : /subscriptions/fc8d../providers/Microsoft.Resources/deploymentStacks/mySubStack
Name                       : mySubStack
ProvisioningState          : succeeded
ResourceCleanupAction      : detach
ResourceGroupCleanupAction : detach
Location                   : eastus
CreationTime(UTC)          : Mon, 02, 27, 2023 2:58:30 PM
ManagedResources           : /subscriptions/fc8d../resourceGroups/test-rg1
                             /subscriptions/fc8d../resourceGroups/test-rg1/providers/Microsoft.Network/publicIPAddresses/pubIP1
                             /subscriptions/fc8d../resourceGroups/test-rg2
                             /subscriptions/fc8d../resourceGroups/test-rg2/providers/Microsoft.Network/publicIPAddresses/pubIP2
```

## Create a deployment stack with deployment at a lower scope

Both powershell and CLI give you the ability to set a scope below the stack's scope where you would like the deployment to be created. This can be done for both management group and subscription scoped stacks.

For management group scoped stack New/Set commands, this is required. Because we do not currently support having the underlying deployment of a management group scoped stack exist at the management group scope, you are required to pass in a subscription id for the subscription where you would like the deployment to exist.

CLI Parameter: `deployment-subscription-id`  
powershell Parameter: `DeploymentSubscriptionId`

```azurecli
az stack mg create `
  --name myMGStack `
  --location eastus `
  --template-file main.bicep
  --management-group-id myMGId
  --deployment-subscription-id mySubId
```

```powershell
New-AzManagmentGroupDeploymentStack -Name 'myMGStack' `
   -Location 'eastus' `
   -TemplateFile './main.bicep'
   -ManagementGroupId 'myMGId'
   -DeploymentSubscriptionId 'mySubId'
```

For subscription scoped stack New/Set commands, you may specify a resource group name for a resource group that you would like your underlying deployment to be deployed into, but it is not required. These commands will default to deploying the underlying stack deployment at the same subscription scope as the stack if no resource group name is provided.

CLI Parameter: `deployment-resource-group-name`  
powershell Parameter: `DeploymentResourceGroupName`

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep
  --deployment-resource-group-name myRG
```

```powershell
New-AzSubscriptionDeploymentStack -Name 'mySubStack' `
   -Location 'eastus' `
   -TemplateFile './main.bicep'
   -DeploymentResourceGroupName 'myRG'
```


## View the managed resources in a deployment stack

During private preview, the deployment stack service doesn't yet have an Azure
portal graphical user interface (GUI). To view the managed resources inside
 a deployment stack, use the following Azure PowerShell command:

```powershell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).Resources
```

## Update a deployment stack

When you manage your Azure deployments with deployment stacks, you service those deployments by
modifying the underlying Bicep or ARM deployment templates and re-running `az stack sub create`
or `New-AzSubscriptionDeploymentStack`.

For instance, edit `pip.bicep` to set the `allocationMethod`
parameter to `Static` instead of `Dynamic`:

```bicep
param allocationMethod string = 'Static'
```

To refresh the deployment stack with Azure CLI,
run `az stack sub create` or `New-AzSubscriptionDeploymentStack` again and confirm you
want to overwrite the existing stack definition:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep
```

For example, PowerShell gives the following confirmation warning when you run `New-AzSubscriptionDeploymentStack` again:

> WARNING: The deployment stack 'mySubStack' you're trying to create already already exists in the current subscription. Do you want to overwrite it? Detaching: resources, resourceGroups (Y/N)

To verify the change, sign into the Azure portal, check the properties of
the `publicIP` resource and confirm its address allocation method is
now `Static` instead of `Dynamic`.

## Protect managed resources against deletion

The `--deny-delete` CLI parameter places a special type of lock on managed resources
that prevents them from deletion by unauthorized security principals (be default, everyone).

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

To manage deployment stack deny assignments with Azure PowerShell, include one of the following `-DenySettingsMode` parameters of the `New-AzSubscriptionDeploymentStack` command:

- `None`: Do not apply a lock to managed resources
- `DenyDelete`: Prevent delete operations
- `DenyWriteAndDelete`: Prevent deletion or modification

For example:

```powershell
New-AzSubscriptionDeploymentStack -Name 'mySubStack' `
  -TemplateFile './main.bicep' `
  -DenySettingsMode 'DenyDelete'
```

The Azure PowerShell interface also includes these parameters to customize the deny assignment:

- `-DenySettingsExcludedPrincipals`
- `-DenySettingsApplyToChildScopes`
- `-DenySettingsExcludedActions`
- `-DenySettingsExcludedDataActions`

## Detach a resource

By default, deployment stacks detach and don't delete resources when they're no longer contained
within the stack's management scope.

To test the default detach capability, remove one of the public IP address definitions in
your `main.bicep` deployment template.

Next, run `az stack sub create` or `New-AzSubscriptionDeploymentStack` again to update the stack.

After the deployment succeeds, you should still see the detached storage account in your
subscription. When you list the stack's managed resources, you should _not_ see the public IP
address you detached.

With Azure PowerShell, you specify what you want to happen after detaching a managed
resource by using one of the following switch parameters of the `New-AzSubscriptionDeploymentStack` command:

- `-DeleteAll`
- `-DeleteResources`
- `-DeleteResourceGroups`
-
For example:

```powershell
New-AzSubscriptionDeploymentStack -Name 'mySubStack' `
  -TemplateFile './main.bicep' `
  -DeleteAll
```

In Azure CLI, unmanaged resources are detached by default. If you'd like to delete rather than detach, you can specify by using one of the following parameters of the `az stack sub create` command:

- --delete-all
- --delete-resources
- --delete-resource-groups

Here's another example:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file main.bicep `
  --delete-resources
```

## Delete a managed resource

To instruct Azure to delete detached resources, update the stack with **az stack sub create**
and pass one of the following parameters:

- `--delete-all`: Flag to indicate delete rather than detach for managed resources and resource groups
- `--delete-resources`: Flag to indicate delete rather than attach for managed resources only
- `--delete-resource-groups`: Flag to indicate delete rather than detach for managed resource groups only

> NOTE:
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
-DeleteResources
```

If you removed one of the public IP addresses from your Bicep deployment template, then after
running the previous code you should observe:

- The resource group containing the removed public IP address still exits
- The removed public IP address is deleted
- The other resource group and public IP address still exist

## Add a managed resource to the deployment stack

Modify `pip.bicep` to re-add the IP address you deleted in the previous step.
Make sure to run `az stack sub create` or `New-AzSubscriptionDeploymentStack` to
confirm the change.

This step highlights the modularity and centralized "command and control" offered
by Azure deployment stacks. You control your list of managed resources entirely
through the infrastructure as code (IaC) design pattern.

## Delete the deployment stack

To remove the deployment stack and its managed resources from your Azure subscription, run the following CLI command:

> NOTE:
> If you run `az stack sub delete` without the `--delete-all`, `--delete-resource-groups`, or
`--delete-resources` parameters, the managed resources will be detached but not deleted.

```azurecli
az stack sub delete `
  --name mySubStack `
  --delete-all
```

Run `az stack sub list` to verify Azure deleted the deployment stack resource.

You should also note in the Azure portal the resource groups and remaining
public IP address have been deleted.

Here's how to do the same thing with Azure PowerShell using the `Remove-AzSubscriptionDeploymentStack` command:

```azurepowershell
Remove-AzSubscriptionDeploymentStack `
-DeleteAll
```

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
