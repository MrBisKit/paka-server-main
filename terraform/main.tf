terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuredevops = {
      source  = "microsoft/azuredevops"
      version = ">=0.4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "resource-group" {
  name     = "paka-app"
  location = "polandcentral"
}

resource "azurerm_storage_account" "storage-account" {
  name                     = "pakaappstorage"
  resource_group_name      = azurerm_resource_group.resource-group.name
  location                 = azurerm_resource_group.resource-group.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "storage-container" {
  name                  = "delivery-images"
  storage_account_name  = azurerm_storage_account.storage-account.name
  container_access_type = "blob"
}

resource "azurerm_mssql_server" "mssql-server" {
  name                         = "pakaappsqlserver"
  resource_group_name          = azurerm_resource_group.resource-group.name
  location                     = azurerm_resource_group.resource-group.location
  version                      = "12.0"
  administrator_login          = "pakaadmin"
  administrator_login_password = "Osiem888"
}

resource "azurerm_mssql_database" "mssql-database" {
  server_id            = azurerm_mssql_server.mssql-server.id
  name                 = "pakaappdb"
  sku_name             = "GP_S_Gen5_1"
  storage_account_type = "Local"
  zone_redundant       = false

  create_mode = "Default"

  auto_pause_delay_in_minutes = -1
  min_capacity                = 0.5
}

resource "azurerm_mssql_database" "mssql-replica-database" {
  server_id            = azurerm_mssql_server.mssql-server.id
  name                 = "pakaappdb-replica"
  sku_name             = "GP_S_Gen5_1"
  storage_account_type = "Local"
  zone_redundant       = false

  create_mode                 = "Secondary"
  creation_source_database_id = azurerm_mssql_database.mssql-database.id

  auto_pause_delay_in_minutes = -1
  min_capacity                = 0.5
}

resource "azurerm_mssql_firewall_rule" "allow_all_ips" {
  name             = "AllowAllIps"
  server_id        = azurerm_mssql_server.mssql-server.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "255.255.255.255"
}

resource "azurerm_maps_account" "maps-account" {
  name                = "pakaappmaps"
  resource_group_name = azurerm_resource_group.resource-group.name
  location            = "northeurope"
  sku_name            = "G2"
}

resource "azurerm_container_registry" "container-registry" {
  name                = "pakaappregistry"
  resource_group_name = azurerm_resource_group.resource-group.name
  location            = azurerm_resource_group.resource-group.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_user_assigned_identity" "user-assigned-identity" {
  name                = "pakaapp-identity"
  resource_group_name = azurerm_resource_group.resource-group.name
  location            = azurerm_resource_group.resource-group.location
}

resource "azurerm_role_assignment" "role-assignment" {
  scope                = azurerm_resource_group.resource-group.id
  role_definition_name = "acrpull"
  principal_id         = azurerm_user_assigned_identity.user-assigned-identity.principal_id
  depends_on           = [azurerm_user_assigned_identity.user-assigned-identity]
}

resource "azurerm_log_analytics_workspace" "log-analytics-workspace" {
  name                = "pakaapp-log-analytics"
  location            = azurerm_resource_group.resource-group.location
  resource_group_name = azurerm_resource_group.resource-group.name
  sku                 = "PerGB2018"
}

resource "azurerm_container_app_environment" "container-app-env" {
  name                       = "pakaapp-env"
  resource_group_name        = azurerm_resource_group.resource-group.name
  location                   = azurerm_resource_group.resource-group.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log-analytics-workspace.id
}


output "sql_connection_string" {
  value     = local.env_vars.DATABASE_URL
  sensitive = true
}

output "blob_storage_connection_string" {
  value     = local.env_vars.AZURE_STORAGE_CONNECTION_STRING
  sensitive = true
}

output "maps_accout_key" {
  value     = local.env_vars.AZURE_MAPS_API_KEY
  sensitive = true
}

output "container_registry_login_server" {
  value = azurerm_container_registry.container-registry.login_server
}

