# Get started with Deployment Stacks (Preview)

Many Azure customers find it  difficult to manage the lifecycle of a _collection_ of resources – while it’s easy to deploy resources together as a group, after the deployment finishes there is no single way to relate those resources together and manage their lifecycle.

Infrastructure deployed in Azure may span across multiple resource groups, subscriptions and even tenants. deployment stacks will make it easy to manage the lifecycle of a collection resources that work together to create a solution.

A _deployment stack_ is a grouping concept that allows for lifecycle operations to be performed on the defined group of resources. While it is very similar to the traditional [Microsoft.Resources/deployments](https://docs.microsoft.com/azure/templates/microsoft.resources/deployments?tabs=json) resource, `Microsoft.Resources/deployment stacks` is a reusable resource type that can help you manage the resources your deployment creates.

Any resource created using a deployment stack is _managed_ by it, and subsequent updates to that deployment stack, combined with the newest iteration's `UpdateBehavior`, will allow you to control the lifecycle of the resources managed by the deployment stack. When a deployment stack is updated, the new set of managedResources will be determined by the resources defined in the template.

The `UpdateBehavior` property of the deployment stack determines what happens to these previously managed resources. It currently supports the following behaviors:

- `DetachResources`: Remove previously managed resources from the list of the deployment stack's managedResources, but keep them in Azure.
- `PurgeResources`: Remove previously managed resources from the list of the deployment stack's managedResources, and also delete them so that they no longer exist in Azure.


> [!NOTE]
> To go through a deployment stacks tutorial, complete the installation of the client tools, select [tutorial](./TUTORIAL.md).

> [!IMPORTANT]
> The deployment stacks preview is currently private, please treat this information as confidential and do not share publicly.

## Feature registration

Use the following command to enable deployment stacks in your Azure subscription:

```powershell
Register-AzProviderFeature -ProviderNamespace Microsoft.Resources -FeatureName deployment stacksPreview
```

The feature takes a few minutes to register; you can check on the status by running the following command:

```powershell
Get-AzProviderFeature -ProviderNamespace Microsoft.Resources -FeatureName deployment stacksPreview
```

## Installation (PowerShell)

Use the following steps to install the deployment stacks PowerShell cmdlets:

1. Install the latest `Az` PowerShell module.  See [Install the Azure Az PowerShell module](/powershell/azure/new-azureps-module-az).

1. Open PowerShell as an administrator.

1. Run the following command to set up a bypass for local signing policy.

```powershell
Set-ExecutionPolicy Bypass -Scope Process
```

1. Download the [deployment stacks package](https://github.com/Azure/deployment-stacks/releases), expand the package and then run the installation `.ps1` file and follow the instructions.

```powershell
    ./AzDeploymentStacksPrivatePreview.ps1
```

  To uninstall the module, run the same ps1 file and choose the `Uninstall module` option.

1. Set the current subscription context to the subscription on-boarded for the private preview:

```PowerShell
Connect-AzAccount
Set-AzContext -SubscriptionId '<subscription-id>'
```

## Installation (Azure CLI)

Use the following steps to install the Azure CLI configured with deployment stacks:

1. Download the [deployment stacks package](https://github.com/Azure/deployment-stacks/releases), expand the package and then run the installation MSI file and follow the instructions.

  To uninstall the MSI, simply uninstall the CLI program from system's program list.  You must uninstall the preview version before installing a new version.


## Troubleshooting

* Both deployment stacks and its snapshots contain some diagnostic information that is not displayed by default. When troubleshooting problems with an update, save the objects to analyze them further:

```powershell
$stack =  Get-AzSubscriptionDeploymentStack -Name 'myStack'
```

There may be more than one level for the error messages, to easily see them all at once:

```powershell
$stack.Error | ConvertTo-Json -Depth 50
```

If a deployment was created and the failure occurred during deployment, you can retrieve details of the deployment using the deployment commands.  For example if your template was deployed to a resource group:

```PowerShell
Get-AzResourceGroupDeployment -Id $stack.DeploymentId
```

You can get more information from the [deployment operations](https://docs.microsoft.com/azure/azure-resource-manager/templates/deployment-history?tabs=azure-portal#get-deployment-operations-and-error-message) as needed.

If the failure occurred as part of the deployment stack operations, more details about the failure can be found on the snapshot:

```powershell
Get-AzSubscriptionDeploymentStackSnapshot -ResourceId $stack.SnapshotId
```

Information about resources that failed to purge can be found in the failedResources array on the snapshot.

## Known issues

The `2021-05-01-preview` private preview API version has the following limitations:

- It is not recommended to use deployment stacks in production environment, since it is still in preview stages and can introduce breaking changes in the future.
- Locking the resources managed by the deployment stack is not available in the private preview. In the future, locking will allow you to prevent changes or deletion to any managed resource.
- What-if is not available in the private preview. What-if allows for evaluating changes before deploying.
- A deployment stack currently does not manage resourceGroups, subscriptionAliases, or managementGroups that are created by the stack.
- deployment stacks are currently limited to resource group or subscription scope for the private preview.
- A deployment stack does not guarantee the protection of `secureString` and `secureObject` parameters, as this release returns them back when requested.
- You cannot currently create deployment stacks using [Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/overview) but you can use the `bicep build` command to author the template file for a deployment stack update.
- In the preview, deleting a deployment stack detaches all of its managed resources.  To delete all the managedResources, first update the deployment stack with an [empty template](./test-templates/empty-template.json) and set `-UpdateBehavior PurgeResources`.  After that completes, delete the deployment stack. Note the scope resources (resource group, management group, subscription, and tenant) and the implicitly created resources (i.e. a VMSS resource is implicitly created when an AKS resource is created) are not deleted.

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
