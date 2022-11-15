# Tutorial: Create and manage your first deployment stack

Deployment stacks are a logical grouping concept that makes it easier to control
your Azure deployments throughout their lifecycle. With deployment stacks you
combine the DevOps principle of _infrastructure as a code_ with the power of
Azure Resource Manager (ARM).

For more information about deployment stacks, see the [readme](./README.md).

In this tutorial you'll learn how to create, modify, and delete a new deployment
stack by using the Deployment Stacks Command-Line Interface (CLI).

## Install the tooling

To install the Deployment Stacks CLI, please see <TO DO>.

## Set up our ARM deployment template

We begin with an Azure Resource Manager (ARM) deployment template that creates
two resource groups and two storage accounts within each resource group. If you use
the values in the following ARM template and parameter file, your **mySubStack**
deployment stack will look like this:

- Resource group: devstorerg1
  - Storage account: devstore<unique-id>
  - Storage account: devstore<unique-id>
- Resource  group: devstorerg2
  - Storage account: devstore<unique-id>
  - Storage account: devstore<unique-id>

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

Parameter files make ARM templates more modular and flexible. Let's add a simple
parameter file; replace the value of **namePrefix** as you wish.

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

Save the template file as `azuredeploy.json` to your computer, and save the parameter file as
`azuredeploy.parameters.json`.

> [!NOTE]
> ARM templates and parameter files can have any valid file name. **azuredeploy** is
simply a community convention.

## Create a deployment stack

Use `az stack sub create` to create a deployment stack.

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json
```

Use `az stack sub show` to check deployment status or list your deployment stacks
defined created in the targeted Azure scope.

```azurecli
az stack sub show `
  --name mySubStack
```

## List deployment stack resources

To view the managed resources enclosed within a deployment stack, use...<TO DO>

## Update a deployment stack

When you manage your Azure deployments with deployment stacks, you service those deployments by
modifying the underlying ARM deployment templates. For instance, modify the following line in
the previously listed ARM template to simulate a configuration change, changing `Standard_LRS` to
`Standard_GRS`.

```json
       "sku": {
        "name": "Standard_LRS"
       },
```

To update the deployment stack, simply run `az stack sub create` again and confirm you
want to overwrite the existing stack definition:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json `
```

## Detach a resource

By default, deployment stacks detach and do not delete resources when they are no longer contained
within the stack's management scope.

To test the default detach capability, find and remove one of the storage account definitions in
your ARM template. For instance, remove the following JSON element from your first
resource group:

```json
      {
       "type": "Microsoft.Storage/storageAccounts",
       "apiVersion": "2019-04-01",
       "name": "[variables('storageNameA')]",
       "location": "[parameters('location')]",
       "sku": {
        "name": "Standard_GRS"
       },
       "kind": "StorageV2",
       "properties": {}
      },
```

Next, run ``az stack sub create`` again to update the stack.

After the deployment succeeds, you should still see the detached storage account in your
subscription.

## Delete a managed resource

To instruct Azure to delete detached resources, update the stack with **az stack sub create**
and pass one of the following parameters:

- `--delete-all`: Flag to indicate delete rather than detach for resources and resource groups
- `--delete-resource-groups`: Flag to indicate delete rather than detach for resource groups only

Update the deployment stack by running the following command:

```azurecli
az stack sub create `
  --name mySubStack `
  --location eastus `
  --template-file azuredeploy.json `
  --parameters azuredeploy.parameters.json `
  --delete-all
```

You should see the storage accounts still within the deployment stack's management
scope still exist, but the storage accounts you removed from the ARM template have
been deleted in Azure.

## List deployment stack snapshots

<TO DO>

## Delete the deployment stack

To clean up the environment, run the following CLI command to delete the entire deployment stack.

> [!NOTE]
> If you run **az stack sub delete** without `--delete-all`, `--delete-resource-groups`, or
`--delete-resources`, the managed resources will be detached but not deleted.

```azurecli
az stack sub delete `
  --name mySubStack `
  --delete-all
```

You should find that besides the deployment stack resource, the deployed resource groups and
storage accounts were also removed.

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
