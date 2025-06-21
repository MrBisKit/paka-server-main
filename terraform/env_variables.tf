locals {
  base_env_vars = {
    DATABASE_URL                    = "sqlserver://${azurerm_mssql_server.mssql-server.fully_qualified_domain_name};database=${azurerm_mssql_database.mssql-database.name};user=${azurerm_mssql_server.mssql-server.administrator_login};password=${azurerm_mssql_server.mssql-server.administrator_login_password};encrypt=true;trustServerCertificate=true;"
    AZURE_STORAGE_CONNECTION_STRING = azurerm_storage_account.storage-account.primary_connection_string
    AZURE_MAPS_API_KEY              = azurerm_maps_account.maps-account.primary_access_key
    JWT_SECRET                      = var.JWT_SECRET
    ADMIN_LOGIN                     = var.ADMIN_LOGIN
    ADMIN_PASSWORD                  = var.ADMIN_PASSWORD
  }
  
  # Zmienne środowiskowe dla Azure Container Registry
  acr_env_vars = {
    ACR_LOGIN_SERVER = azurerm_container_registry.container-registry.login_server
    ACR_USERNAME     = azurerm_container_registry.container-registry.admin_username
    ACR_PASSWORD     = azurerm_container_registry.container-registry.admin_password
  }
  
  # Łączymy podstawowe zmienne środowiskowe ze zmiennymi dla notification hub i ACR
  env_vars = merge(local.base_env_vars, try(local.notification_env_vars, {}), try(local.acr_env_vars, {}))
}

variable "JWT_SECRET" {
  description = "The secret key for JWT authentication."
  type        = string
  sensitive   = true
}

variable "ADMIN_LOGIN" {
  description = "The admin login for the application."
  type        = string
  sensitive   = true
}

variable "ADMIN_PASSWORD" {
  description = "The admin password for the application."
  type        = string
  sensitive   = true
}
