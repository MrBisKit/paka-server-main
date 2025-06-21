# Azure DevOps configuration

# Provider for Azure DevOps
provider "azuredevops" {
  # Credentials and organization are taken from environment variables
  # export AZDO_PERSONAL_ACCESS_TOKEN=<your PAT>
  # export AZDO_ORG_SERVICE_URL=https://dev.azure.com/<your organization>
}

# Create Azure DevOps project
resource "azuredevops_project" "paka_project" {
  name               = "paka-delivery-app"
  description        = "Delivery management application with courier notifications"
  visibility         = "private"
  version_control    = "Git"
  work_item_template = "Agile"

  features = {
    "testplans"    = "disabled"
    "artifacts"    = "enabled"
    "boards"       = "disabled"
    "repositories" = "enabled"
    "pipelines"    = "enabled"
  }
}

# Create service connection to Azure
resource "azuredevops_serviceendpoint_azurerm" "azure_service_connection" {
  project_id                = azuredevops_project.paka_project.id
  service_endpoint_name     = "Azure Subscription"
  description               = "Managed by Terraform"
  azurerm_spn_tenantid      = var.azure_tenant_id
  azurerm_subscription_id   = var.azure_subscription_id
  azurerm_subscription_name = "Azure Subscription"
}

# Create service connection to ACR
resource "azuredevops_serviceendpoint_dockerregistry" "acr_service_connection" {
  project_id            = azuredevops_project.paka_project.id
  service_endpoint_name = "Paka ACR"
  description           = "Managed by Terraform"
  docker_registry       = azurerm_container_registry.paka_acr.login_server
  docker_username       = azurerm_container_registry.paka_acr.admin_username
  docker_password       = azurerm_container_registry.paka_acr.admin_password
  registry_type         = "Others"
}

# Create GitHub service connection
resource "azuredevops_serviceendpoint_github" "github_connection" {
  project_id            = azuredevops_project.paka_project.id
  service_endpoint_name = "GitHub Connection"
  description           = "Managed by Terraform"
  
  auth_personal {
    # PAT should be provided through variables
    personal_access_token = var.github_pat
  }
}

# Create CI Pipeline
resource "azuredevops_build_definition" "paka_ci_pipeline" {
  project_id = azuredevops_project.paka_project.id
  name       = "paka-build-pipeline"
  path       = "\\"
  
  repository {
    repo_type   = "GitHub"
    repo_id     = var.github_repo_id
    branch_name = "main"
    yml_path    = "azure-pipelines.yml"
    service_connection_id = azuredevops_serviceendpoint_github.github_connection.id
  }
}

# Create CD Pipeline (Release pipeline)
resource "azuredevops_release_definition" "paka_cd_pipeline" {
  project_id      = azuredevops_project.paka_project.id
  name            = "paka-deploy-pipeline"
  
  artifacts {
    alias           = "BuildOutput"
    type            = "Build"
    definition_reference {
      definition_id   = azuredevops_build_definition.paka_ci_pipeline.id
      definition_type = "id"
      name            = azuredevops_build_definition.paka_ci_pipeline.name
      version         = "latest"
    }
  }

  environment {
    name           = "Production"
    rank           = 1
    pre_deploy_approval {
      approvals {
        approver_id = var.azure_devops_user_id
        is_automated = true
      }
    }

    deployment_input {
      artifact_id = "BuildOutput"
      triggered = true
    }
  }
}

# Variables needed for configuration
variable "azure_tenant_id" {
  description = "Azure AD Tenant ID"
  type        = string
}

variable "azure_subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

variable "github_pat" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "github_repo_id" {
  description = "GitHub Repository ID or URL in format owner/repo"
  type        = string
}

variable "azure_devops_user_id" {
  description = "Azure DevOps User ID for approvals"
  type        = string
}
