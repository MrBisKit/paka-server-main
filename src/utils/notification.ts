import axios from 'axios';

/**
 * Azure Notification Hub service for sending push notifications to couriers
 */
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Sends a notification to a specific courier
 * 
 * @param courierId The ID of the courier to notify
 * @param payload The notification payload containing title, body and optional data
 * @returns Promise that resolves when notification is sent
 */
export const sendCourierNotification = async (
  courierId: number, 
  payload: NotificationPayload
): Promise<boolean> => {
  try {
    // Get the connection string and hub name from environment variables
    const connectionString = process.env.AZURE_NOTIFICATION_HUB_CONNECTION_STRING;
    const hubName = process.env.AZURE_NOTIFICATION_HUB_NAME;
    
    if (!connectionString || !hubName) {
      console.error('Azure Notification Hub configuration missing');
      return false;
    }

    // Azure Notification Hub API endpoint
    const apiUrl = `${process.env.AZURE_NOTIFICATION_HUB_ENDPOINT}/api/notifications`;
    
    // Create notification payload with courier-specific tag
    const notification = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      // Target the specific courier by ID using tags
      target: {
        tags: [`courierId:${courierId}`]
      }
    };
    
    // Send notification to Azure
    await axios.post(apiUrl, notification, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `SharedAccessSignature ${connectionString}`
      }
    });
    
    console.log(`Notification sent to courier ID: ${courierId}`);
    return true;
  } catch (error) {
    console.error('Error sending courier notification:', error);
    return false;
  }
};

/**
 * Creates a delivery assignment notification
 * 
 * @param courierId The ID of the courier
 * @param deliveryId The ID of the assigned delivery
 * @param address Delivery address details
 * @returns Promise that resolves when notification is sent
 */
export const sendDeliveryAssignmentNotification = async (
  courierId: number,
  deliveryId: number,
  address: string
): Promise<boolean> => {
  return sendCourierNotification(courierId, {
    title: 'New Delivery Assigned',
    body: `You have a new delivery to ${address}`,
    data: {
      type: 'delivery_assignment',
      deliveryId: deliveryId
    }
  });
};
