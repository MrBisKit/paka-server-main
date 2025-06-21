resource "azurerm_container_app" "container-app" {
  name                         = "pakaapp-container"
  resource_group_name          = azurerm_resource_group.resource-group.name
  container_app_environment_id = azurerm_container_app_environment.container-app-env.id
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.user-assigned-identity.id]
  }

  ingress {
    transport        = "auto"
    target_port      = 3000
    external_enabled = true
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  registry {
    server               = azurerm_container_registry.container-registry.login_server
    username             = azurerm_container_registry.container-registry.admin_username
    password_secret_name = "registry-credentials"
  }

  secret {
    name  = "registry-credentials"
    value = azurerm_container_registry.container-registry.admin_password
  }

  template {
    min_replicas = 1
    max_replicas = 10
    container {
      name   = "pakaapp"
      image  = "pakaappregistry.azurecr.io/pakaapp:latest"
      cpu    = "0.5"
      memory = "1Gi"
      dynamic "env" {
        for_each = local.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
    }
    http_scale_rule {
      name                = "http-scale-rule"
      concurrent_requests = 100
    }
  }
}

output "container_app_url" {
  value = azurerm_container_app.container-app.ingress[0].fqdn
}
