# Get started with the deploymentStacks (Preview)

Azure customers find it extremely difficult to manage the lifecycle of a _collection_ of resources – while it’s easy to deploy resources together as a group, after the deployment finishes there is no single way to relate those resources together and manage their lifecycle. Infrastructure deployed in Azure may span across multiple resource groups, subscriptions and even tenants. DeploymentStacks will make it easy to manage the lifecycle of a collection resources that work together to create a solution.

A "deploymentStack" is a grouping concept that allows for lifecycle operations to be performed on the defined group of resources. While it is very similar to the traditional [Microsoft.Resources/deployments](https://docs.microsoft.com/azure/templates/microsoft.resources/deployments?tabs=json) resource, `Microsoft.Resources/deploymentStacks` is a reusable resource type that can help you manage the resources your deployment creates. Any resource created using a deploymentStack is _managed_ by it, and subsequent updates to that deploymentStack, combined with the newest iteration's `UpdateBehavior`, will allow you to control the lifecycle of the resources managed by the deploymentStack. When a deploymentStack is updated, the new set of managedResources will be determined by the resources defined in the template. The UpdateBehavior property of the deploymentStack determines what happens to these previously managed resources. It currently supports the following behaviors:

* `DetachResources`: Remove previously managed resources from the list of the deploymentStack's managedResources, but keep them in Azure.
* `PurgeResources`: Remove previously managed resources from the list of the deploymentStack's managedResources, and also delete them so that they no longer exist in Azure.

To go through a deployment stacks tutorial, complete the installation of the client tools, select [tutorial](./TUTORIAL.md).

## Installation

Use the following steps to install the deploymentStacks PowerShell cmdlets:

1. Install the latest Azure Az PowerShell module.  See [Install the Azure Az PowerShell module](https://docs.microsoft.com/powershell/azure/new-azureps-module-az).
1. Open PowerShell as an administrator.
1. Run the following command to set up a bypass for local signing policy.

    ```powershell
    Set-ExecutionPolicy Bypass -Scope Process
    ```

1. Download the [deploymentStacks package](https://github.com/Azure/deployment-stacks/releases), expand the package and then run the installation ps1 file and follow the instructions.

    ```powershell
    ./AzDeploymentStacksPrivatePreview.ps1
    ```

  To uninstall the module, run the same ps1 file and choose the `Uninstall module` option.

1. Set the current subscription context to the subscription on-boarded for the private preview:

    ```PowerShell
    Connect-AzAccount
    Set-AzContext -subscription "<subscription-id>"
    ```

## Troubleshooting

* Both deploymentStacks and its snapshots contain some diagnostic information that is not displayed by default. When troubleshooting problems with an update, save the objects to analyze them further:

```Powershell
$stack =  Get-AzSubscriptionDeploymentStack -Name 'myStack'
```

There may be more than one level for the error messages, to easily see them all at once:

```PowerShell
$stack.Error | ConvertTo-Json -Depth 50
```

If a deployment was created and the failure occurred during deployment, you can retrieve details of the deployment using the deployment commands.  For example if your template was deployed to a resource group:

```PowerShell
Get-AzResourceGroupDeployment -Id $stack.DeploymentId
```

You can get more information from the [deployment operations](https://docs.microsoft.com/azure/azure-resource-manager/templates/deployment-history?tabs=azure-portal#get-deployment-operations-and-error-message) as needed.

If the failure occurred as part of the deploymentStack operations, more details about the failure can be found on the snapshot:

```PowerShell
Get-AzSubscriptionDeploymentStackSnapshot -ResourceId $stack.SnapshotId
```

Information about resources that failed to purge can be found in the failedResources array on the snapshot.

## Known Issues

There are the known limitations with the private preview release `2021-05-01-preview`:

* It is not recommended to use deploymentStacks in production environment, since it is still in preview stages and can introduce breaking changes in the future.
* Locking the resources managed by the deploymentStack is not available in the private preview. In the future, locking will allow you to prevent changes or deletion to any managed resource.
* What-if is not available in the private preview. What-if allows for evaluating changes before deploying.
* A deploymentStack currently does not manage resourceGroups, subscriptionAliases, or managementGroups that are created by the stack.
* DeploymentStacks are currently limited to resource group or subscription scope for the private preview.
* A deploymentStack does not guarantee the protection of `secureString` and `secureObject` parameters, as this release returns them back when requested.
* DeploymentStacks can currently only be created, updated, retrieved, and deleted through PowerShell and the REST API. CLI support is coming soon.
* You cannot currently create deploymentStacks using [Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/overview) but you can use the `bicep build` command to author the template file for a deploymentStack update.
* In the preview, deleting a deploymentStack detaches all of its managed resources.  To delete all the managedResources, first update the deploymentStack with an [empty template](./test-templates/empty-template.json) and set `-UpdateBehavior PurgeResources`.  After that completes, delete the deploymentStack. Note the scope resources (resource group, management group, subscription, and tenant) and the implicitly created resources (i.e. a VMSS resource is implicitly created when an AKS resource is created) are not deleted.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit the [Microsoft Open Source website](https://cla.opensource.microsoft.com).

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
