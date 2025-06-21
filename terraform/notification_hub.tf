resource "azurerm_notification_hub_namespace" "paka_notifications" {
  name                = "paka-notifications-namespace"
  resource_group_name = azurerm_resource_group.resource-group.name
  location            = azurerm_resource_group.resource-group.location
  namespace_type      = "NotificationHub"
  sku_name            = "Free"
}

resource "azurerm_notification_hub" "courier_notifications" {
  name                = "paka-courier-hub"
  namespace_name      = azurerm_notification_hub_namespace.paka_notifications.name
  resource_group_name = azurerm_resource_group.resource-group.name
  location            = azurerm_resource_group.resource-group.location
}

# Utwórz klucz dostępu dla Notification Hub
resource "azurerm_notification_hub_authorization_rule" "courier_notifications_auth" {
  name                  = "SendMessages"
  notification_hub_name = azurerm_notification_hub.courier_notifications.name
  namespace_name        = azurerm_notification_hub_namespace.paka_notifications.name
  resource_group_name   = azurerm_resource_group.resource-group.name
  
  listen = true
  send   = true
  manage = false
}

# Zmodyfikuj już istniejący locals.env_vars w env_variables.tf
locals {
  notification_env_vars = {
    AZURE_NOTIFICATION_HUB_CONNECTION_STRING = azurerm_notification_hub_authorization_rule.courier_notifications_auth.primary_connection_string
    AZURE_NOTIFICATION_HUB_NAME              = azurerm_notification_hub.courier_notifications.name
    AZURE_NOTIFICATION_HUB_ENDPOINT          = "https://${azurerm_notification_hub_namespace.paka_notifications.name}.servicebus.windows.net/${azurerm_notification_hub.courier_notifications.name}"
  }
}
