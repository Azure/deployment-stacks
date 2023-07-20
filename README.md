# What are deployment stacks?

Many Azure administrators find it difficult to manage the lifecycle of their cloud infrastructure.
For example, infrastructure deployed in Azure may span multiple
management groups, subscriptions, and resource groups. Deployment stacks simplify lifecycle management for your Azure deployments, regardless of their complexity.

A _deployment stack_ is a native Azure resource type that enables you to perform operations on
a resource collection as an atomic unit. Deployment stacks are defined in ARM
as the type `Microsoft.Resources/deploymentStacks`.

Because the deployment stack is a native Azure resource, you can perform all typical Azure
Resource Manager (ARM) operations on the resource, including:

- Azure role-based access control (RBAC) assignments
- Security recommendations surfaced by Microsoft Defender for Cloud
- Azure Policy assignments

Any Azure resource created using a deployment stack is managed by it, and subsequent updates to that
deployment stack, combined with value of the newest iteration's `actionOnUnmanage` property, allows you to control
the lifecycle of the resources managed by the deployment stack. When a deployment stack is updated,
the new set of managed resources will be determined by the resources defined in the template.

> IMPORTANT: 
> Deployment stacks is currently in _public preview_.

# Docs
+ [QuickStart: Deployment Stacks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/quickstart-create-deployment-stacks?tabs=azure-cli%2CCLI)
+ [QuickStart: Deployment Stacks & Template Specs](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks?tabs=azure-powershell)
+ [How-To: Deployment Stacks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/deployment-stacks?tabs=azure-powershell)
+ [Tutorial: Deployment Stacks](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/tutorial-use-deployment-stacks?tabs=azure-cli)

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
