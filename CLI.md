# Installation Steps
To install the private preview CLI on your machine, you can follow these steps:

0. Download and unzip the DeploymentStacksPrivatePreview_CLI folder
1. Install the MSI
2. Download and unzip the sdk (azure-mgmt-resource-20.0.0)
3. Open powershell as admin
4. Run the following command
	& "C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\python.exe" -m pip install -e <path of unzipped sdk> --force-reinstall
5. Try "az stack --help"
6. Switch to appropriate subscription- "az account set --subscription <subid>" and give the new Deployment Stack CLI a try!


# Commands

## Subscription Scope

### [```az stack sub```] Create a deployment stack at subscription scope
#### Create a deployment stack using template file
 ```az stack sub create --name "StackName" c --template-file simpleTemplate.json --location "westus2" --description "description"```
#### Create a deployment stack with parameter file
 ```az stack sub create --name "StackName" --update-behavior "detachResources" --template-file simpleTemplate.json --parameters simpleTemplateParams.json --location "westus2" --description "description"```
#### Create a deployment stack with template spec
 ```az stack sub create --name "StackName" --update-behavior "detachResources" --template-spec "TemplateSpecResourceIDWithVersion" --location "westus2" --description "description"```
#### Create a deployment stack using bicep file
 ```az stack sub create --name "StackName" --update-behavior "detachResources" --template-file simple.bicep --location "westus2" --description "description"```
#### Create a deployment stack at a different subscription
 ```az stack sub create --name "StackName" --update-behavior "detachResources" --template-file simpleTemplate.json --location "westus2" --description "description --subscription "subscriptionId"```
#### Create a deployment stack and deploy at the resource group scope
 ```az stack sub create --name "StackName" --template-file simpleTemplate.json  --location "westus" --resource-group "ResourceGroup" --description "description"```
#### Create a deployment stack using parameters from key/value pairs
 ```az stack sub create --name "StackName" --template-file simpleTemplate.json  --location "westus" --description "description" --parameters simpleTemplateParams.json value1=foo value2=bar```
#### Create a deployment stack from a local template, using a parameter file, a remote parameter file, and selectively overriding key/value pairs
 ```az stack sub create --name rollout01 --template-file azuredeploy.json  --parameters @params.json --parameters https://mysite/params.json --parameters MyValue=This MyArray=@array.json --location "westus"```
 
 
 ### [```az stack sub list```] List all deployment stacks in subscription
 #### List all stacks 
 ```az stack sub list```
 
  ### [```az stack sub show```] Get specified deployment stack from subscription scope
 #### Get stack by name.
```az stack sub show --name "StackName"```
#### Get stack by stack resource id.
```az stack sub show --id "StackResourceID"```

  ### [```az stack sub delete```] Delete specified deployment stack from subscription scope
#### Delete stack by name
```az stack sub delete --name "StackName"```
#### Delete stack by stack resource id
```az stack sub delete --id "StackResourceID"```

## Resource Group Scope

  ### [```az stack group create```] Create a deployment stack at resource group scope
 #### Create a deployment stack using template file
```az stack group create --name "StackName" --resource-group "ResourceGroup" --update-behavior "detachResources" --template-file simpleTemplate.json --description "description"```
#### Create a deployment stack with parameter file
```az stack group create --name "StackName" --resource-group "ResourceGroup" --update-behavior "detachResources" --template-file simpleTemplate.json --parameters simpleTemplateParams.json --description "description"```
#### Create a deployment stack with template spec
```az stack group create --name "StackName" --resource-group "ResourceGroup" --update-behavior "detachResources" --template-spec "TemplateSpecResourceIDWithVersion" --description "description"```
#### Create a deployment stack using bicep file
```az stack group create --name "StackName" --resource-group "ResourceGroup" --update-behavior "detachResources" --template-file simple.bicep --description "description"```
#### Create a deployment stack at a different subscription
```az stack group create --name "StackName" --resource-group "ResourceGroup" --update-behavior "detachResources" --template-file simpleTemplate.json --description "description --subscription "subscriptionId"```
#### Create a deployment stack using parameters from key/value pairs
```az stack group create --name "StackName" --template-file simpleTemplate.json  --resource-group "ResourceGroup" --description "description" --parameters simpleTemplateParams.json value1=foo value2=bar```
#### Create a deployment stack from a local template, using a parameter file, a remote parameter file, and selectively overriding key/value pairs
```az stack group create --name rollout01 --template-file azuredeploy.json  --parameters @params.json --parameters https://mysite/params.json --parameters MyValue=This MyArray=@array.json --resource-group "ResourceGroup"```

### [```az stack group list```] List all deployment stacks in resource group
 #### List all stacks in resource group
```az stack group list --resource-group "ResourceGroup"```
 
  ### [```az stack group show```] Get specified deployment stack from resource group scope
 #### Get stack by name
```az stack group show --name "StackName" --resource-group "ResourceGroup"```
#### Get stack by stack resource id
```az stack group show --id "StackResourceID"```

  ### [```az stack group delete```] Delete specified deployment stack from resource group scope
#### Delete stack by name
```az stack group delete --name "StackName" --resource-group "ResourceGroup"```
#### Delete stack by stack resource id
```az stack group delete --id "StackResourceID"```

## Snapshot Subscription Scope
### [```az stack snapshot sub list```] List all snapshots in specified deployment stack at subscription scope
#### List all snapshots using stack name
  ```az stack snapshot sub list --stack-name "StackName"```
  #### List all snapshots using stack id
  ```az stack snapshot sub list --stack "StackResourceID"```
 
  ### [```az stack snapshot sub show```] Get specified snapshot in deployment stack at subscription scope
  #### Get snapshot with stack name and snapshot name.
  ```az stack snapshot sub show --name "SnapshotName" --stack-name "StackName"```
  #### Get snapshot by snapshot resource id.
  ```az stack snapshot sub show --id "SnapshotResourceID"```

  ### [```az stack snapshot sub delete```] Delete specified snapshot in deployment stack at subscription scope
  #### Delete snapshot with stack name and snapshot name.
  ```az stack snapshot sub delete --name "SnapshotName" --stack-name "StackName"```
  #### Delete snapshot by snapshot resource id.
  ```az stack snapshot sub delete --id "SnapshotResourceID"```
  
## Snapshot Resource Group Scope
### [```az stack snapshot group list```] List all snapshots in specified deployment stack at resource group scope
  #### List all snapshots using stack name
```az stack snapshot group list --stack-name "StackName" --resource-group "ResourceGroup"```
  #### List all snapshots using stack id
```az stack snapshot group list --stack "StackResourceID"```

### [```az stack snapshot group show```] Get specified snapshot in deployment stack at resource group scope
  #### Get snapshot with stack name and snapshot name.
```az stack snapshot group show --name "SnapshotName" --stack-name "StackName" "StackName" --resource-group "ResourceGroup"```
  #### Get snapshot by snapshot resource id.
```az stack snapshot group show --id "SnapshotResourceID"```

### [```az stack snapshot group delete```] Delete specified snapshot in deployment stack at resource group scope
  #### Delete snapshot with stack name and snapshot name.
```az stack snapshot group delete --name "SnapshotName" --stack-name "StackName" "StackName" --resource-group "ResourceGroup"```
  #### Delete snapshot by snapshot resource id.
```az stack snapshot group delete --id "SnapshotResourceID"```
  

