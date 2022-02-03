## Create a deploymentStack

Use `New-AzSubscriptionDeploymentStack` to create a deploymentStack.

```PowerShell
New-AzSubscriptionDeploymentStack `
  -Name mySubStack `
  -Location eastus `
  -TemplateFile azuredeploy.json `
  -TemplateParameterFile azuredeploy.parameters.json
