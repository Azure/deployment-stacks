# Deployment stacks release notes

## [Deployment Stacks Private Preview - Client Packages v0.1.6 (January 9, 2023)

> Includes updates/fixes to the client-side modules for Deployment Stacks Private Preview.
> Individuals or organizations with Azure subscriptions onboarded for the Private Preview can
> download/extract this release and follow the installation instructions in the [README](./README.md).

### Breaking changes

- Removed snapshots
- Changed Azure PowerShell and Azure CLI command names

### New features

- Significant improvements to the deployment stacks Azure PowerShell and Azure CLI commands
- Bulk delete
- Export stack template (before you needed to use the GetStack API directly)
- Deny assignments (`DenyWriteDelete` is still in progress)
- Management group support
- New `-UpdateBehavior` and `-ActionOnUnmanage` parameter values

### Limitations

See the [README](./README.md) for the comprehensive list of deployment stack feature limitations that aren't bound to this particular release.
