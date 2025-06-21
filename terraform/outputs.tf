# Outputs dla Notification Hub
output "notification_hub_connection_string" {
  description = "The connection string for the Notification Hub"
  value       = azurerm_notification_hub_authorization_rule.courier_notifications_auth.primary_connection_string
  sensitive   = true
}

output "notification_hub_name" {
  description = "The name of the Notification Hub"
  value       = azurerm_notification_hub.courier_notifications.name
}

output "notification_hub_namespace" {
  description = "The namespace of the Notification Hub"
  value       = azurerm_notification_hub_namespace.paka_notifications.name
}

output "notification_hub_endpoint" {
  description = "The endpoint of the Notification Hub"
  value       = "https://${azurerm_notification_hub_namespace.paka_notifications.name}.servicebus.windows.net/${azurerm_notification_hub.courier_notifications.name}"
}
