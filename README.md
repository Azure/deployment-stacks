# Get started with Deployment Stacks (preview)

Many Azure customers find it difficult to manage the lifecycle of a _collection_ of resources. While
it’s easy to deploy resources together as a group, there historically has been no single way to
relate those resources and manage their lifecycle.

Infrastructure deployed in Azure may span across
multiple resource groups, subscriptions and even Azure Active Directory (Azure AD) tenants.
Deployment Stacks makes it easy to
manage the lifecycle of a collection resources that work together to create a solution.

A _Deployment Stack_ is a grouping concept that allows for lifecycle operations to be performed on
the defined group of resources. While it is very similar to the traditional
[Microsoft.Resources/deployments](https://docs.microsoft.com/azure/templates/microsoft.resources/deployments?tabs=json)
resource, `Microsoft.Resources/deploymentStacks` is a reusable resource type that can help you
manage the resources your deployment creates.

Any resource created using a Deployment Stack is
_managed_ by it, and subsequent updates to that Deployment Stack, combined with the newest
iteration's `UpdateBehavior`, will allow you to control the lifecycle of the resources managed by
the Deployment Stack.

When a Deployment Stack is updated, the new set of managedResources will be
determined by the resources defined in the template. The `UpdateBehavior` property of the
Deployment Stack determines what happens to these previously managed resources. It currently supports
the following behaviors:

- `DetachResources`: Remove previously managed resources from the list of the Deployment Stack's
  managedResources, but keep them in Azure.
- `PurgeResources`: Remove previously managed resources from the list of the Deployment Stack's
  managedResources, and also delete them so that they no longer exist in Azure.

After you install the necessary client tools, work through our [Deployment Stacks tutorial](./TUTORIAL.md).

> Deployment Stacks is currently in private preview status. Please treat this information as
> confidential and don't share it publicly.

## Feature Registration

Use the following Azure PowerShell command to enable Deployment Stacks in a subscription:

```powershell
Register-AzProviderFeature -ProviderNamespace Microsoft.Resources -FeatureName deploymentStacksPreview
```

The feature will take a few minutes to register; you can check on the status by running
the following command:

```powershell
Get-AzProviderFeature -ProviderNamespace Microsoft.Resources -FeatureName deploymentStacksPreview
```

## Installation (PowerShell)

Use the following steps to install the Deployment Stacks PowerShell cmdlets:

1. [Install the Azure Az PowerShell module](https://docs.microsoft.com/powershell/azure/new-azureps-module-az).
2. Open PowerShell as an administrator.
3. Run the following command to set up a bypass for script signing policy.

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

4. Download the [Deployment Stacks package](https://github.com/Azure/deployment-stacks/releases),
   expand the package and then run the installation ps1 file and follow the instructions.

```powershell
    ./AzDeploymentStacksPrivatePreview.ps1
```

To remove the Deployment Stacks PowerShell module, run the same `AzDeploymentStacksPrivatePreview.ps1`
script again and choose the `Uninstall module` option.

5. Set the current subscription context to the subscription enabled for the private preview:

```PowerShell
Connect-AzAccount
Set-AzContext -subscription "<subscription-id>"
```

## Installation (Azure CLI)

Download the [Deployment Stacks package](https://github.com/Azure/deployment-stacks/releases), expand
the package, and then run the installation MSI file and follow the instructions.

To uninstall the MSI, simply uninstall the CLI program from system's program list.

> [!NOTE]
> You must uninstall the preview version before installing a new version.

## Troubleshooting

- Both Deployment Stacks and its snapshots contain diagnostic information that is not displayed
  by default. When troubleshooting problems with an update, save the objects to analyze them
  further:

```powershell
$stack =  Get-AzSubscriptionDeploymentStack -Name 'myStack'
```

There may be more than one level for the error messages, to easily see them all at once:

```powershell
$stack.Error | ConvertTo-Json -Depth 50
```

If a deployment was created and the failure occurred during deployment, you can retrieve details of
the deployment using the deployment commands. For example if your template was deployed to a
resource group:

```powershell
Get-AzResourceGroupDeployment -Id $stack.DeploymentId
```

You can get more information from the [deployment operations](https://docs.microsoft.com/azure/azure-resource-manager/templates/deployment-history?tabs=azure-portal#get-deployment-operations-and-error-message) as needed.

If the failure occurred as part of the Deployment Stack operations,
find more details about the failure by examining the snapshot:

```powershell
Get-AzSubscriptionDeploymentStackSnapshot -ResourceId $stack.SnapshotId
```

Information about resources that failed to purge can be found in the `failedResources` array on the snapshot.

## Known Issues

There are the known limitations with the private preview release `2021-05-01-preview`:

- It is not recommended to use Deployment Stacks in production environment, since it is still in
  preview stages and can introduce breaking changes in the future.
- Locking the resources managed by the Deployment Stack is not available in the private preview. In
  the future, locking will allow you to prevent changes or deletion to any managed resource.
- What-if is not available in the private preview. What-if allows for evaluating changes before deploying.
- A Deployment Stack currently does not manage resourceGroups, subscriptionAliases, or
  managementGroups that are created by the stack.
- Deployment Stacks are currently limited to resource group or subscription scope for the private preview.
- A Deployment Stack does not guarantee the protection of `secureString` and `secureObject`
  parameters, as this release returns them back when requested.
- You cannot currently create Deployment Stacks using
  [Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/overview) but you can use
  the `bicep build` command to author the template file for a Deployment Stack update.
- In the preview, deleting a Deployment Stack detaches all of its managed resources. To delete all
  the managedResources, first update the Deployment Stack with an
  [empty template](./test-templates/empty-template.json) and set `-UpdateBehavior PurgeResources`.
  After that completes, delete the Deployment Stack. Note the scope resources (resource group,
  management group, subscription, and tenant) and the implicitly created resources (for example, a virtual machine scale set (VMSS)
  resource is implicitly created when an AKS resource is created) are not deleted.

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit the [Microsoft Open Source website](https://cla.opensource.microsoft.com).

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of
Microsoft trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).

Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion
or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those
third-party's policies.
