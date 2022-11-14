# Tutorial: Create and manage your first deployment stack

This tutorial shows you how to create, update, and remove a deployment stack.

For more information about deployment stacks, see the [readme](./README.md).

We begin with an Azure Resource Manager (ARM) deployment template that creates
two resource groups and two storage accounts within each resource group:

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

Let's also use a sample parameter file.  Replace the value of **namePrefix** as necessary.

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

Save the template file as ```azuredeploy.json``` to your computer, and save the parameter file as
```azuredeploy.parameters.json``` to your computer.

> [!NOTE]
> ARM templates and parameter files can have any valid file name. **azuredeploy** is simply a community convention.

## Create a deployment stack

Use `az stack sub create` to create a deployment stack.
```azurecli
az stack sub create `
  -n mySubStack `
  -l eastus `
  -f azuredeploy.json `
  -p azuredeploy.parameters.json
```

Use `az stack sub show` to check deployment status or list the deployment stack.

```azurecli
az stack sub show `
  -n mySubStack
```

Notice in the output, `ProvisioningState` is `initializing`. It takes a few moments to create a deployment stack.
Once completed, `ProvisioningState` is `succeeded`. `ManagedResources` shows the managed resources.
You can only see a part of managed resources. To list all the managed resources:

```PowerShell
(Get-AzSubscriptionDeploymentStack -Name mySubStack).ManagedResources
```

You can also see the two resource groups and the resources from the [Azure portal](https://portal.azure.com).

## Detach a resource

The `detachResources` mode removes a resource from the deploymentStack, but keep the resource in Azure.

Modify the original template to remove one of the storage accounts from the first resource group.

Update the deploymentStack with the following CLI command:

```azurecli
az stack sub create `
  -n mySubStack `
  -l eastus `
  -f azuredeploy.json `
  -p azuredeploy.parameters.json `
  --update-behavior detachResources
```

Once completed, use the following command to check the deployment status.

```azurecli
az stack sub show `
  -n mySubStack
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

## Delete a managed resource

The `purgeResources` mode removes the resource from the deployment stack, and removes the resource from Azure.

Modify the revised template from the last section to remove one of the storage accounts from the second resource group.

Update the deployment stack with the following command:

```azurecli
az stack sub create `
  -n mySubStack `
  -l eastus `
  -f azuredeploy.json `
  -p azuredeploy.parameters.json `
  --update-behavior purgeResources
```

Once completed, use the following cmdlet to check the deployment status.

```azurecli
az stack sub show `
  -n mySubStack
```

Use the following cmdlet to list the resources in the deployment stack:

```azurecli
az stack sub list
```

You shall see only one resource in the first resource group of this deploymentStack.

The purged resource has been removed from the first resource group:

```PowerShell
Get-AzResource -ResourceGroupName <resource-group-name>
```

## List deployment stack snapshots

If you follow all the step in this tutorial, the deployment stack has three snapshots:

- when the deploymentStack is created
- when a resource is detached
- when a resource is purged

Use the following command to list the snapshots of a deploymentStack:

```azurecli
az stack snapshot sub list `
  --stack-name mySubStack
```

You should see three snapshots listed.

## Delete the deployment stack

```azurecli
az stack snapshot sub delete `
  --stack-name mySubStack
```

In the private preview, you cannot purge resources while deleting the deploymentStack, any managed
resource will be detached.  You can still purge resources using an [empty template](./test-templates/empty-template.json)
prior to deleting the deploymentStack. Note the scope resources (resource group, management group, subscription,
and tenant) and the implicitly created resources (for example, a virtual machine scale set (VMSS) resource is
implicitly created when an Azure Kubernetes Service (AKS) resource is created) are not deleted.

## Next steps

To learn more about deployment stacks, see [tutorial](./TUTORIAL.md).

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
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those
third-party's policies.
