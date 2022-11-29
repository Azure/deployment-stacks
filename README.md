# What are Deployment Stacks?

Many Azure administrators find it difficult to manage the lifecycle of their deployments.
For example, infrastructure deployed in Azure may span across multiple resource groups, subscriptions,
and even Azure Active Directory (Azure AD) tenants. Deployment stacks simplify lifecycle management of
your Azure deployments, regardless of how simple or complex they are.

A _deployment stack_ is a native Azure resource type that enables you to perform operations on
a resource collection as an atomic unit. Deployment stacks are defined in ARM
as the type `Microsoft.Resources/deploymentStacks`.

Because the deployment stack is a native Azure resource, you can perform all typical Azure
Resource Manager (ARM) operations on the resource, including:

- Azure role-based access control (RBAC) assignments
- Security recommendations surfaced by Microsoft Defender for Cloud
- Azure Policy assignments

Any Azure resource created using a deployment stack is managed by it, and subsequent updates to that
deployment stack, combined with value of the newest iteration's `UpdateBehavior` property, allows you to control
the lifecycle of the resources managed by the deployment stack. When a deployment stack is updated,
the new set of managed resources will be determined by the resources defined in the template.

To create your first deployment stack, work through our [quickstart tutorial](./TUTORIAL.md).

> [!IMPORTANT]
> Deployment stacks is currently in private preview. Thus, please treat this information as confidential and do not share publicly.

## Feature registration

Use the following PowerShell command to enable the deployment stacks preview feature in your Azure subscription:

```powershell
Register-AzProviderFeature -ProviderNamespace Microsoft.Resources -FeatureName deployment stacksPreview
```

## Deployment stacks tools installation (PowerShell)

Use the following steps to install the deployment stacks PowerShell cmdlets:

1. Install the latest `Az` PowerShell module.  See [Install the Azure Az PowerShell module](/powershell/azure/new-azureps-module-az).

1. Open an elevated PowerShell session.

1. Run the following command bypass local script signing policy temporarily.

```powershell
Set-ExecutionPolicy Bypass -Scope Process
```

1. Download the [deployment stacks installation package](https://github.com/Azure/deployment-stacks/releases), unzip the package, and then run the installation `.ps1` script. You can choose to install the module either in the current PowerShell session, or system-wide.

```powershell
    ./AzDeploymentStacksPrivatePreview.ps1
```

  To uninstall the module, run the same `.ps1` file and choose the `Uninstall module (previous system-wide installs)` option.

1. Set the current subscription context to an Azure subscription onboarded for the deployment stacks private preview:

```powershell
Connect-AzAccount
Set-AzContext -SubscriptionId '<subscription-id>'
```

1. Verify the deployment stacks PowerShell commands are available in your PowerShell session by running the following command:

```powershell
Get-Command -Module Az.Resources -Noun Az*Stack*
```

## Deployment stacks tools installation (Azure CLI)

Use the following steps to install the Deployment Stacks Command-Line Interface (CLI) on your machine:

1. Install _Microsoft Azure CLI.msi_ from the _msi_ folder

1. Note the path to the _azure-mgmt-resource-21.2.0_ software development kit (SDK) folder

1. Open an elevated PowerShell session

1. Run the following command:

```bash
 & "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\python.exe" -m pip install -e <path-to-unzipped-sdk-folder> --force-reinstall
```

1. Verify you have the Deployment Stacks CLI installed by running the following command (if you get Deployment Stacks output, you know it's installed correctly):

```azurecli
  az stack --help
```

6. Switch your Azure CLI context to the appropriate Azure subscription and give the new Deployment Stacks CLI a try!

```azurecli
 az account set --subscription <subscription-id>
```

## Troubleshooting

Both deployment stacks and its snapshots contain some diagnostic information that is not displayed by
default. When troubleshooting problems with an update, save the objects to analyze them further:

```azurepowershell
$stack =  Get-AzSubscriptionDeploymentStack -Name 'mySubStack'
```

There may be more than one level for the error messages, to easily see them all at once:

```powershell
$stack.Error | ConvertTo-Json -Depth 50
```

If a deployment was created and the failure occurred during deployment, you can retrieve details of
the deployment using the deployment commands.  For example if your template was deployed
to a resource group:

```azurepowershell
Get-AzResourceGroupDeployment -Id $stack.DeploymentId
```

You can get more information from the [deployment operations](https://docs.microsoft.com/azure/azure-resource-manager/templates/deployment-history?tabs=azure-portal#get-deployment-operations-and-error-message) as needed.

If the failure occurred as part of the deployment stack operations, more details about the failure can be found on the snapshot:

```azurepowershell
Get-AzSubscriptionDeploymentStackSnapshot -ResourceId $stack.SnapshotId
```

Information about resources that failed to purge can be found in the failedResources array on the snapshot.

## Known issues

The `2021-05-01-preview` private preview API version has the following limitations:

- We don't recommended using deployment stacks in production environments because the service is still in private preview. Therefore you should expect breaking changes in future private preview releases.
- Resource locking for deployment stack managed resources is not available in the private preview. In the future, locking will allow you to prevent changes or deletion to any managed resource.
- `Whatif` is not available in the private preview. `Whatif` allows you to evaluate changes before actually submitting the deployment to ARM.
- A deployment stack currently does not manage resourceGroups, subscriptionAliases, or managementGroups that are created by the stack.
- Deployment stacks are currently limited to resource group or subscription scope for the private preview.
- A deployment stack does not guarantee the protection of `secureString` and `secureObject` parameters; this release returns them in plain text when requested.
- You cannot currently create deployment stacks using [Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/overview). However, you can use the `bicep build` command to author the template file for a deployment stack update.
- In private preview, deleting a deployment stack detaches all of its managed resources. To delete all the managed resources, specify one of the following parameters when you update the deployment stack with CLI: `--delete-all`, `--delete-resources`, `--delete-resource-groups`.

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

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause
confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are
subject to those third-party's policies.
