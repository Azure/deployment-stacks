# Get started with the Deployment Stacks (Preview)

Azure customers find it extremely difficult to manage the lifecycle of a _collection_ of resources – while it’s easy to deploy resources together as a group, after the deployment finishes there is no single way to relate those resources together and manage their lifecycle. Infrastructure deployed in Azure may span across multiple resource groups, subscriptions and even tenants. Deployment Stacks will make it easy to manage the lifecycle of a collection resources that work together to create a solution.

A "deploymentStack" is a grouping concept that allows for lifecycle operations to be performed on the defined group of resources. While it is very similar to the traditional [Microsoft.Resources/deployments](https://docs.microsoft.com/en-us/azure/templates/microsoft.resources/deployments?tabs=json) resource, `Microsoft.Resources/deploymentStacks` is a reusable resource type that can help you manage the resources your deployment creates. Any resource created using a deploymentStack is _managed_ by it, and subsequent updates to that deploymentStack, combined with the newest iteration's `UpdateBehavior`, will allow you to control the lifecycle of the resources managed by the deploymentStack . When a deploymentStack is updated, the new set of managedResources will be determined by the resources defined in the template. The UpdateBehavior property of the deploymentStack determines what happens to these previously managed resources. It currently supports the following behaviors: 

* `DetachResources`: Remove previously managed resources from the list of the stack's managedResources, but keep them in Azure.
* `PurgeResources`: Remove previously managed resources from the list of the stack's managedResources, and also delete them so that they no longer exist in Azure.

To go through a deployment stacks tutorial, select [tutorial](./TUTORIAL.md).

## Known limitations

There are the known limitations with the private preview release `2021-05-01-preview`:

- It is not recommended to use deploymentStacks in production environment since it is still in preview stages and can introduce breaking changes in the future.
- Locking the resources managed by the deploymentStack is not available in the private preview. In the future, locking will allow you to prevent changes or deletion to any managed resource.
- What-if is not available in the private preview. What-if allows for evaluating changes before deploying.
- A deploymentStack currently does not manage resourceGroups, subscriptionAliases, or managementGroups that are created by the stack.
- DeploymentStacks are currently limited to resource group or subscription scope for the private preview.
- A deploymentStack does not gurantee the protection of `secureString` and `secureObject` parameters, as this release returns them back when requested.
- DeploymentStacks can currently only be created, updated, retrieved, and deleted through PowerShell and the REST API. CLI support is coming soon.
- You cannot currently create deploymentStacks using [Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview) but you can use the ```bicep build``` command to author the template file for a deploymentStack update.
- Deleting a deploymentStack detaches all of its managed resources, regardless of its `UpdateBehavior`. A temporary workaround in order to clean up resources managed by the deploymentStack is to deploy an empty template with `-UpdateBehavior PurgeResources` before deleting the stack:
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [],
  "outputs": {
    "empty": {
      "type": "bool",
      "value": true
    }
  }
}
```

## Installation

Use the following steps to install the deployment stacks PowerShell cmdlets:

1. Install the latest Azure Az PowerShell module.  See [Install the Azure Az PowerShell module](https://docs.microsoft.com/en-us/powershell/azure/new-azureps-module-az).
1. Open PowerShell 7 window as administrator.
1. Run the following command to set up a bypass for local signing policy.

    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process
    ```

1. Download the deployment stacks package, expand the package and then run the installation ps1 file and follow the instructions.

    ```powershell
    ./AzDeploymentStacksPrivatePreview.ps1
    ```

  To uninstall the module, run the same ps1 file and choose the **Uninstall module** option.

1. Set the current subscription context to the subscription for the private preview:

    ```azurepowershell
    Connect-AzAccount
    Set-AzContext -subscription "<subscription-id>"
    ```

## Create a stack

### At the resource group level

You can use any ARM template to create a deployment stack. The following template is an example. This template creates two storage accounts.

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "namePrefix": {
      "type": "string",
      "minLength": 3,
      "maxLength": 11
    },
    "location":{
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "variables": {
    "storageName1": "[concat(parameters('namePrefix'), uniqueString(resourceGroup().id), 'a')]",
    "storageName2": "[concat(parameters('namePrefix'), uniqueString(resourceGroup().id), 'b')]"
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2019-04-01",
      "name": "[variables('storageName1')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {}
    },
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2019-04-01",
      "name": "[variables('storageName2')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {}
    }
  ]
}
```

A parameter file sample:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storagePrefix": {
      "value": "devstore"
    }
  }
}
```

To create a stack:

```azurepowershell
New-AzResourceGroup `
  -Name myRgStackRg `
  -Location eastus2

New-AzResourceGroupDeploymentStack `
  -Name myRgStack `
  -ResourceGroupName myRgStackRg `
  -TemplateFile azuredeploy.json `
  -ParameterFile azuredeploy.parameters.json
```

It takes a few moments to create a stack.  Once completed, you can run the following cmdlet to get the stack:

```azurepowershell
Get-AzResourceGroupDeploymentStack `
  -ResourceGroupName myRgStackRg `
  -Name myRgStack
```

The output is similar to:

```cmd
Id                : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack
Name              : myRgStack
ProvisioningState : succeeded
UpdateBehavior    : detachResources
CreationTime(UTC) : 8/19/2021 4:43:21 PM
ManagedResources  : {'/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwka',
                     '/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwkb'}
DeploymentId      : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deployments/myRgStack-2021-08-19-16-43-21-174c4
SnapshotId        : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack/snapshots/2021-08-19-16-43-21-174c4
```

The two resources are listed under `ManagedResources`.

`ProvisioningState` shows the status.  If the deployment failed, the output shows the error. For example:

```cmd
Id                : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack
Name              : myRgStack
ProvisioningState : failed
UpdateBehavior    : detachResources
CreationTime(UTC) : 8/12/2021 3:33:43 PM
Error             : LocationNotAvailableForResourceType - The provided location 'eastus2' is not available for resource type 'Providers.Test/statefulResources'. List of available regions for the resource type is 'westus,westus2,eastus,c
                    entralus,northcentralus,southcentralus,westcentralus,westeurope,northeurope,eastasia,southeastasia,westindia,southindia,centralindia,canadacentral,canadaeast,uksouth,ukwest,francecentral,australiacentral,centraluseua
                    p,eastus2euap'.
```

### At the subscription level

The following ARM template creates two resource groups with two storage accounts resources in each group:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2018-05-01/subscriptionDeploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "namePrefix": {
      "type": "string",
      "minLength": 3,
      "maxLength": 11
    },
    "location": {
      "type": "string",
      "defaultValue": "[deployment().location]"
    }
  },
  "variables": {
    "rgName1": "[concat(parameters('namePrefix'), 'rg1')]",
    "rgName2": "[concat(parameters('namePrefix'), 'rg2')]",
    "storageNameA": "[concat(parameters('namePrefix'), uniqueString(subscription().id), 'a')]",
    "storageNameB": "[concat(parameters('namePrefix'), uniqueString(subscription().id), 'b')]",
    "storageNameC": "[concat(parameters('namePrefix'), uniqueString(subscription().id), 'c')]",
    "storageNameD": "[concat(parameters('namePrefix'), uniqueString(subscription().id), 'd')]"
  },
  "resources": [
    {
      "type": "Microsoft.Resources/resourceGroups",
      "apiVersion": "2020-06-01",
      "name": "[variables('rgName1')]",
      "location": "[parameters('location')]",
      "properties": {}
    },
    {
      "type": "Microsoft.Resources/deployments",
      "apiVersion": "2020-06-01",
      "name": "stackDeployment",
      "resourceGroup": "[variables('rgName1')]",
      "dependsOn": [
        "[resourceId('Microsoft.Resources/resourceGroups/', variables('rgName1'))]"
      ],
      "properties": {
        "mode": "Incremental",
        "template": {
          "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
          "contentVersion": "1.0.0.0",
          "parameters": {},
          "variables": {},
          "resources": [
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2019-04-01",
              "name": "[variables('storageNameA')]",
              "location": "[parameters('location')]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2",
              "properties": {}
            },
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2019-04-01",
              "name": "[variables('storageNameB')]",
              "location": "[parameters('location')]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2",
              "properties": {}
            }
          ],
          "outputs": {}
        }
      }
    },
    {
      "type": "Microsoft.Resources/resourceGroups",
      "apiVersion": "2020-06-01",
      "name": "[variables('rgName2')]",
      "location": "[parameters('location')]",
      "properties": {}
    },
    {
      "type": "Microsoft.Resources/deployments",
      "apiVersion": "2020-06-01",
      "name": "stackDeployment",
      "resourceGroup": "[variables('rgName2')]",
      "dependsOn": [
        "[resourceId('Microsoft.Resources/resourceGroups/', variables('rgName2'))]"
      ],
      "properties": {
        "mode": "Incremental",
        "template": {
          "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
          "contentVersion": "1.0.0.0",
          "parameters": {},
          "variables": {},
          "resources": [
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2019-04-01",
              "name": "[variables('storageNameC')]",
              "location": "[parameters('location')]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2",
              "properties": {}
            },
            {
              "type": "Microsoft.Storage/storageAccounts",
              "apiVersion": "2019-04-01",
              "name": "[variables('storageNameD')]",
              "location": "[parameters('location')]",
              "sku": {
                "name": "Standard_LRS"
              },
              "kind": "StorageV2",
              "properties": {}
            }
          ],
          "outputs": {}
        }
      }
    }
  ],
  "outputs": {}
}
```

Deploy the stack with the following cmdlets:

```azurepowershell
New-AzSubscriptionDeploymentStack `
  -Name mySubStack `
  -Location eastus2 `
  -TemplateFile azuredeploy.json `
  -ParameterFile azuredeploy.parameters.json
```

It takes a few moments to create a stack.  Once completed, use the following cmdlet to get the stack:

```azurepowershell
Get-AzSubscriptionDeploymentStack `
  -Name mySubStack
```

The output is similar to:

```cmd
Id                : /subscriptions/<sub-id>/providers/Microsoft.Resources/deploymentStacks/
                    mySubStack
Name              : mySubStack
ProvisioningState : succeeded
UpdateBehavior    : detachResources
Location          : eastus2
CreationTime(UTC) : 8/19/2021 5:57:28 PM
ManagedResources  : {'/subscriptions/<sub-id>/resourceGroups/mySubStackrg1', 
                     '/subscriptions/<sub-id>/resourceGroups/mySubStackrg1/providers/Microsoft.Storage/storageAccounts/stksubiyrmpdcyfhgl6a', 
                     '/subscriptions/a1bfa635-f2bf-42f1-86b5-848c674fc31/resourceGroups/mySubStackrg1/providers/Microsoft.Storage/storageAccounts/stksubiyrmpdcyfhgl6b', 
                     '/subscriptions/<sub-id>/resourceGroups/mySubStackrg2'…}
DeploymentId      : /subscriptions/<sub-id>/providers/Microsoft.Resources/deployments/StorageSubStack-2021-08-19-18-22-33-d4216
SnapshotId        : /subscriptions/<sub-id>/providers/Microsoft.Resources/deploymentStacks/mySubStack/snapshots/2021-08-19-18-22-33-d4216
```

The two resource groups and the resources are listed under `ManagedResources`.

## Add/Remove resources

Modify the original template to remove an existing resource or add a new resource, and then use `Set-AzResourceGroupDeploymentStack` or `Set-AzSubscriptionDeploymentStack` to update the stack. When you remove a resource from a stack, you have two options with the `UpdateBehavior` switch:

- **DetachResources**: remove the resource from the stack, but keep the resource in Azure.
- **PurgeResources**: remove the resource from the stack, and remove the resource from Azure.

### At the resource group level

To use the detachResources option:

```azurepowershell
Set-AzResourceGroupDeploymentStack `
    -Name myRgStack `
    -ResourceGroupName myRgStackRg `
    -TemplateFile stack.json `
    -ParameterFile azuredeploy.parameters.json `
    -UpdateBehavior DetachResources
```

To use the purgeResources option:

```azurepowershell
Set-AzResourceGroupDeploymentStack `
    -Name myRgStack `
    -ResourceGroupName myRgStackRg `
    -TemplateFile stack.json `
    -ParameterFile azuredeploy.parameters.json `
    -UpdateBehavior PurgeResources
```

After updating the stack, use `Get-AzResourceGroupDeploymentStack` to list the resources in the stack.

### At the subscription level

To use the detachResources option:

```azurepowershell
Set-AzSubscriptionDeploymentStack `
  -Name stack `
  -TemplateFile azuredeploy.json `
  -ParameterFile azuredeploy.parameters.json `
  -UpdateBehavior DetachResources `
  -Location eastus
```

To use the purgeResources option:

```azurepowershell
Set-AzSubscriptionDeploymentStack `
  -Name stack `
  -TemplateFile azuredeploy.json `
  -ParameterFile azuredeploy.parameters.json `
  -UpdateBehavior PurgeResources `
  -Location eastus
```

The `Location` parameter specifies where the stack is saved.

After updating the stack, use `Get-AzSubscriptionDeploymentStack` to list the resources in the stack.

## Use snapshots

Snapshots provide a way to view the history of updates to the stack. A snapshot is read-only and is created whenever any template resource is successfully deployed.  Note that not all resources need to be successfully deployed for a snapshot to be created. Snapshots are primarily used for viewing history for diagnostics or troubleshooting. In the future, a snapshot can be applied to roll back a deploymentStack to a previous state if there is an error.

Since it contains more information about the state of the deploymentStack, the latest snapshot of a stack cannot be deleted.

### At the resource group level

Use the following cmdlet to list the snapshots of a stack:

```azurepowershell
Get-AzResourceGroupDeploymentStackSnapshot `
  -ResourceGroupName myRgStackRG `
  -StackName myRgStack
```

The following output shows two snapshots:

```output
Id                : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack/snapshots/2021-08-19-16-43-21-174c4
Name              : 2021-08-19-16-43-21-174c4
ProvisioningState : succeeded
UpdateBehavior    : detachResources
CreationTime(UTC) : 8/19/2021 4:43:21 PM
ManagedResources  : {'/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwkb',
                     '/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwkc'}
DetachedResources : '/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwka'
DeploymentId      : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deployments/myRgStack-2021-08-19-16-43-21-174c4

Id                : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack/snapshots/2021-08-19-18-42-15-e871d
Name              : 2021-08-19-18-42-15-e871d
ProvisioningState : succeeded
UpdateBehavior    : detachResources
CreationTime(UTC) : 8/19/2021 6:42:15 PM
ManagedResources  : '/subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Storage/storageAccounts/devstorett73cak7aqhwka'
DeploymentId      : /subscriptions/<sub-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deployments/myRgStack-2021-08-19-18-42-15-e871d
```

To remove a snapshot from a stack:

```azurepowershell
Remove-AzResourceGroupDeploymentStackSnapshot `
  -ResourceId /subscriptions/<subscription-id>/resourceGroups/myRgStackRg/providers/Microsoft.Resources/deploymentStacks/myRgStack/snapshots/2021-07-14-16-25-47-71d60
name               : 2021-08-19-16-43-21-174c4
```

```azurepowershell
Remove-AzResourceGroupDeploymentStackSnapshot `
  -Name 2021-08-19-16-43-21-174c4 `
  -StackName myRgStack `
  -ResourceGroupName myRgStackRg
```

### At the subscription level

Use the following cmdlet to list the snapshots of a stack:

```azurepowershell
Get-AzSubscriptionDeploymentStackSnapshot `
  -StackName mySubStack
```

To remove a snapshot from a stack:

```azurepowershell
Remove-AzSubscriptionDeploymentStackSnapshot `
  -Name 2021-08-19-16-43-21-174c4 `
  -StackName myRgStack
```

## Delete a stack

Remove a deployment stack also remove the associated snapshots. All managed resources will be detached, regardless of `UpdateBehavior`

### At the resource group level

```azurepowershell
Remove-AzResourceGroupDeploymentStack `
  -ResourceGroupName myRgStackRG `
  -Name myRgStack
```

### At the subscription level

```azurepowershell
Remove-AzSubscriptionDeploymentStack `
  -Name mySubStack
```

## Use remote templates, and template specs

The Azure PowerShell cmdlet samples provided in this article use local templates.  You can also use remote templates and template specs.

To use a remote template, use the `-TemplateUri` switch; to use a remote parameter file, use the `-ParameterUri`:

```azurepowershell
New-AzResourceGroupDeploymentStack `
  -Name myRgStack `
  -ResourceGroupName myRgStackRg `
  -TemplateUri https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.storage/storage-account-create/azuredeploy.json `
  -ParameterUri https://raw.githubusercontent.com/Azure/azure-quickstart-templates/master/quickstarts/microsoft.storage/storage-account-create/azuredeploy.parameters.json
```

To use a template spec, use the `-TemplateSpecId` switch:

```azurepowershell
New-AzResourceGroupDeploymentStack `
  -Name myRgStack `
  -ResourceGroupName myRgStackRg `
  -TemplateSpecId <template-spec-id> `
```

## Next steps

- For a step-by-step tutorial that guides you through the process of creating a template, see [Tutorial: Create and deploy your first ARM template](template-tutorial-create-first-template.md).
- To learn about ARM templates through a guided set of modules on Microsoft Learn, see [Deploy and manage resources in Azure by using ARM templates](/learn/paths/deploy-manage-resource-manager-templates/).
- For information about the properties in template files, see [Understand the structure and syntax of ARM templates](./syntax.md).
- To learn about exporting templates, see [Quickstart: Create and deploy ARM templates by using the Azure portal](quickstart-create-templates-use-the-portal.md).
- For answers to common questions, see [Frequently asked questions about ARM templates](frequently-asked-questions.yml).

## Troubleshooting

- Both deploymentStacks and its snapshots contain some diagnostic information that is not displayed by default. When troubleshooting problems with an update, save the objects to analyze them further:
```azurepowershell
$stack =  Get-Az...DeploymentStack ...
$snapshot = Get-Az...DeploymentStackSnapshot ... // If $stack.SnapshotId exists
```
- Check which stage of the deploymentStack update failed using `echo $stack.Error`
    - Failure during deployment:
        - If `$stack.DeploymentId` exists, check out more information about the underlying deployment failure by investigating its [deployment operations](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deployment-history?tabs=azure-portal#get-deployment-operations-and-error-message) 
        - Otherwise, refer to the details found in `$stack.Error`
    - Failure during purging resources:
        - Check which resources failed to be purged properly be referring to `$snapshot.FailedResources`, in most cases, these failed resources will simply be detached and can be viewed by accessing `$snapshot.DetachedResources`. Successfully purged resources will be viewed by checking `$snapshot.PurgedResources`.

## Contributing

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
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
