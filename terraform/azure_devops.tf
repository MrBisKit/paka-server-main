# Azure DevOps configuration

# Configure Azure DevOps provider

# Provider for Azure DevOps
provider "azuredevops" {
  # Używamy jawnie podanych poświadczeń zamiast zmiennych środowiskowych
  personal_access_token = var.azure_devops_pat
  org_service_url       = "https://dev.azure.com/mbuchar461"
}

# Zmienna do przechowywania Azure DevOps PAT
variable "azure_devops_pat" {
  description = "Personal Access Token do Azure DevOps"
  type        = string
  sensitive   = true
}

# Używamy istniejącego projektu Azure DevOps zamiast tworzyć nowy
data "azuredevops_project" "paka_project" {
  name = "Paka"
  # Możemy użyć też ID projektu
  # project_id = "7100cfc8-223f-4c4f-af43-e5866009fae6"
}

# Create service connection to Azure RM
# Zakomentowane z powodu braku uprawnień do tworzenia aplikacji w Microsoft Entra (Azure AD)
/*
resource "azuredevops_serviceendpoint_azurerm" "azure_service_connection" {
  project_id            = data.azuredevops_project.paka_project.id
  service_endpoint_name = "Azure Subscription"
  description           = "Managed by Terraform"
  azurerm_subscription_id   = var.azure_subscription_id
  azurerm_subscription_name = "Azure Subscription"
  azurerm_spn_tenantid      = var.azure_tenant_id
}
*/

# Create service connection to ACR
resource "azuredevops_serviceendpoint_dockerregistry" "acr_service_connection" {
  project_id            = data.azuredevops_project.paka_project.id
  service_endpoint_name = "Paka ACR"
  description           = "Managed by Terraform"
  docker_registry       = azurerm_container_registry.container-registry.login_server
  docker_username       = azurerm_container_registry.container-registry.admin_username
  docker_password       = azurerm_container_registry.container-registry.admin_password
  registry_type         = "Others"
}

# Create GitHub service connection
resource "azuredevops_serviceendpoint_github" "github_connection" {
  project_id            = data.azuredevops_project.paka_project.id
  service_endpoint_name = "GitHub Connection"
  description           = "Managed by Terraform"
  
  auth_personal {
    # PAT should be provided through variables
    personal_access_token = var.github_pat
  }
}

# Create CI Pipeline
resource "azuredevops_build_definition" "paka_ci_pipeline" {
  project_id = data.azuredevops_project.paka_project.id
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
# Zakomentowane, ponieważ zasób azuredevops_release_definition nie jest obsługiwany przez dostawcę Microsoft Azure DevOps
/*
resource "azuredevops_release_definition" "paka_cd_pipeline" {
  project_id      = data.azuredevops_project.paka_project.id
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
*/

/*
    deployment_input {
      artifact_id = "BuildOutput"
      triggered = true
    }
  }
}
*/

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
