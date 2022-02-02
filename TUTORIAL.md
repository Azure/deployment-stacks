# Tutorial: Deploy deploymentStacks

This tutorial shows you how to create, update, and remove a deploymentStack.  You learn how to use the two modes of `UpdateBehavior`:

- **detachResources**: remove the resource from the deploymentStack, but keep the resource in Azure.
- **purgeResources**: remove the resource from the deploymentStack, and remove the resource from Azure.

For more information about deploymentStacks, see the [readme](./README.md).

The template used in this tutorial creates two resource groups and two resources in each resource group:

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

A sample parameters file.  Replace the value of **namePrefix**.

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "namePrefix": {
      "value": "devstore"
    }
  }
}
```

Save the template file as ```azuredeploy.json``` to your computer, and save the parameter file as ```azuredeploy.parameters.json``` to your computer.

## Create a deploymentStack

Use `New-AzSubscriptionDeploymentStack` to create a deploymentStack.

```PowerShell
New-AzSubscriptionDeploymentStack `
  -Name mySubStack `
  -Location eastus `
  -TemplateFile azuredeploy.json `
  -TemplateParameterFile azuredeploy.parameters.json
```

Use `az stack sub create` to create a deploymentStack.
```CLI
az stack sub create `
  --n mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json
```

Use `Get-AzSubscriptionDeploymentStack` to check deployment status or list the deploymentStack.

```PowerShell
Get-AzSubscriptionDeploymentStack `
  -Name mySubStack
```

Use `az stack sub show` to check deployment status or list the deploymentStack.

```CLI
az stack sub show `
  --n mySubStack
```

Notice in the output, `ProvisioningState` is `initializing`. It takes a few moments to create a deploymentStack.  Once completed, `ProvisioningState` is `succeeded`. `ManagedResources` shows the managed resources. You can only see a part of managed resources. To list all the managed resources:

```PowerShell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).ManagedResources
```

You can also see the two resource groups and the resources from the [Azure portal](https://portal.azure.com).

## Detach a resource

The `detachResources` mode removes a resource from the deploymentStack, but keep the resource in Azure.

Modify the original template to remove one of the storage accounts from the first resource group.

Update the deploymentStack with the following cmdlet:

```PowerShell
Set-AzSubscriptionDeploymentStack `
  -Name mySubStack `
  -TemplateFile azuredeploy.json `
  -TemplateParameterFile azuredeploy.parameters.json `
  -UpdateBehavior detachResources `
  -Location eastus
```

```CLI
az stack sub create `
  --n mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json `
  --update-behavior detachResources 
```

Once completed, use the following cmdlet to check the deployment status.

```PowerShell
Get-AzSubscriptionDeploymentStack `
  -Name mySubStack
```

```CLI
az stack sub show `
  --n mySubStack
```

Use the following cmdlet to list the resources in the deploymentStack:

```PowerShell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).ManagedResources
```

You shall see only one resource in the first resource group of this deploymentStack.

The detached resource is still managed by the first resource group:

```PowerShell
Get-AzResource -ResourceGroupName <resource-group-name>
```

## Purge a resource

The `purgeResources` mode removes the resource from the deploymentStack, and removes the resource from Azure.

Modify the revised template from the last section to remove one of the storage accounts from the second resource group.

Update the deploymentStack with the following cmdlet:

```PowerShell
Set-AzSubscriptionDeploymentStack `
  -Name mySubStack `
  -TemplateFile azuredeploy.json `
  -TemplateParameterFile azuredeploy.parameters.json `
  -UpdateBehavior purgeResources `
  -Location eastus
```

```CLI
az stack sub create `
  --n mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json `
  --update-behavior purgeResources 
```

Once completed, use the following cmdlet to check the deployment status.

```PowerShell
Get-AzSubscriptionDeploymentStack `
  -Name mySubStack
```

```CLI
az stack sub show `
  --n mySubStack
```

Use the following cmdlet to list the resources in the deploymentStack:

```PowerShell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).ManagedResources
```

You shall see only one resource in the first resource group of this deploymentStack.

The purged resource has been removed from the first resource group:

```PowerShell
Get-AzResource -ResourceGroupName <resource-group-name>
```

## List the snapshots

If you follow all the step in this tutorial, the deploymentStack shall have three snapshots:

- when the deploymentStack is created
- when a resource is detached
- when a resource is purged

Use the following cmdlet to list the snapshots of a deploymentStack:

```PowerShell
Get-AzSubscriptionDeploymentStackSnapshot `
  -StackName mySubStack
```

```CLI
az stack snapshot sub list `
  --stack-name mySubStack
```

You shall see three snapshots listed.

## Delete the deploymentStack

```PowerShell
Remove-AzSubscriptionDeploymentStack `
  -Name mySubStack `
```

```CLI
az stack snapshot sub delete `
  --stack-name mySubStack
```

In the private preview, you cannot purge resources while deleting the deploymentStack, any managed resource will be detached.  You can still purge resources using an [empty template](./test-templates/empty-template.json) prior to deleting the deploymentStack. Note the scope resources (resource group, management group, subscription, and tenant) and the implicitly created resources (i.e. a VMSS resource is implicitly created when an AKS resource is created) are not deleted.

## Next steps

To learn more about deploymentStacks, see [tutorial](./TUTORIAL.md).

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
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
