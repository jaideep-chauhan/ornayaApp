/**
 * Notification Handler Utility
 * Processes notification payloads and handles navigation
 */

import { Alert } from 'react-native';

/**
 * Notification types expected from backend
 */
export const NOTIFICATION_TYPES = {
  ORDER_ASSIGNED: 'order_assigned',
  REPAIR_ASSIGNED: 'repair_assigned',
  MATERIAL_REQUEST_APPROVED: 'material_request_approved',
  MATERIAL_REQUEST_REJECTED: 'material_request_rejected',
  DEADLINE_REMINDER: 'deadline_reminder',
  MESSAGE_RECEIVED: 'message_received',
  ORDER_CANCELLED: 'order_cancelled',
  REPAIR_CANCELLED: 'repair_cancelled',
  ORDER_UPDATED: 'order_updated',
  REPAIR_UPDATED: 'repair_updated',
  PAYMENT_RECEIVED: 'payment_received',
  GENERAL_ANNOUNCEMENT: 'general_announcement',
};

/**
 * Parse notification payload
 * Extracts type and data from FCM message
 */
export const parseNotificationPayload = (remoteMessage) => {
  try {
    if (!remoteMessage) {
      return null;
    }

    // FCM payload structure:
    // remoteMessage.notification - Display notification (title, body)
    // remoteMessage.data - Custom data payload

    const { notification, data } = remoteMessage;

    return {
      title: notification?.title || 'Notification',
      body: notification?.body || '',
      type: data?.type || NOTIFICATION_TYPES.GENERAL_ANNOUNCEMENT,
      orderId: data?.order_id ? parseInt(data.order_id) : null,
      repairId: data?.repair_id ? parseInt(data.repair_id) : null,
      materialRequestId: data?.material_request_id ? parseInt(data.material_request_id) : null,
      messageId: data?.message_id ? parseInt(data.message_id) : null,
      priority: data?.priority || 'normal',
      timestamp: data?.timestamp || Date.now(),
      additionalData: data?.additional_data ? JSON.parse(data.additional_data) : {},
    };
  } catch (error) {
    console.error('Error parsing notification payload:', error);
    return null;
  }
};

/**
 * Handle notification navigation
 * Routes user to appropriate screen based on notification type
 */
export const handleNotificationNavigation = (navigation, notificationData) => {
  try {
    if (!notificationData || !navigation) {
      console.log('Missing navigation or notification data');
      return;
    }

    const { type, orderId, repairId, materialRequestId } = notificationData;

    switch (type) {
      case NOTIFICATION_TYPES.ORDER_ASSIGNED:
      case NOTIFICATION_TYPES.ORDER_UPDATED:
      case NOTIFICATION_TYPES.DEADLINE_REMINDER:
        if (orderId) {
          navigation.navigate('TaskDetail', {
            orderId: orderId,
            isRepair: false,
          });
        }
        break;

      case NOTIFICATION_TYPES.REPAIR_ASSIGNED:
      case NOTIFICATION_TYPES.REPAIR_UPDATED:
        if (repairId) {
          navigation.navigate('TaskDetail', {
            orderId: repairId,
            isRepair: true,
          });
        }
        break;

      case NOTIFICATION_TYPES.MATERIAL_REQUEST_APPROVED:
      case NOTIFICATION_TYPES.MATERIAL_REQUEST_REJECTED:
        navigation.navigate('Materials', {
          screen: 'MaterialRequestList',
          params: { highlightRequestId: materialRequestId },
        });
        break;

      case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
        if (orderId) {
          navigation.navigate('TaskDetail', {
            orderId: orderId,
            isRepair: false,
            scrollToMessages: true,
          });
        } else if (repairId) {
          navigation.navigate('TaskDetail', {
            orderId: repairId,
            isRepair: true,
            scrollToMessages: true,
          });
        }
        break;

      case NOTIFICATION_TYPES.ORDER_CANCELLED:
        navigation.navigate('OrderList', {
          filter: 'cancelled',
        });
        break;

      case NOTIFICATION_TYPES.REPAIR_CANCELLED:
        navigation.navigate('RepairList', {
          filter: 'cancelled',
        });
        break;

      case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
        navigation.navigate('Settings', {
          screen: 'Earnings',
        });
        break;

      case NOTIFICATION_TYPES.GENERAL_ANNOUNCEMENT:
        // Navigate to notifications/inbox screen (if exists)
        navigation.navigate('Dashboard');
        break;

      default:
        console.log('Unknown notification type:', type);
        navigation.navigate('Dashboard');
    }
  } catch (error) {
    console.error('Error handling notification navigation:', error);
  }
};

/**
 * Display foreground notification as alert
 * Shows alert when app is open and notification arrives
 */
export const displayForegroundNotification = (notificationData, onViewPress) => {
  try {
    if (!notificationData) {
      return;
    }

    const { title, body, priority } = notificationData;

    // For high-priority notifications, show immediately
    if (priority === 'high' || priority === 'urgent') {
      Alert.alert(
        `🔴 ${title}`,
        body,
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View Now',
            onPress: () => {
              if (onViewPress && typeof onViewPress === 'function') {
                onViewPress(notificationData);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      // For normal priority, show dismissable alert
      Alert.alert(
        title,
        body,
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => {
              if (onViewPress && typeof onViewPress === 'function') {
                onViewPress(notificationData);
              }
            },
          },
        ]
      );
    }
  } catch (error) {
    console.error('Error displaying foreground notification:', error);
  }
};

/**
 * Get notification icon based on type
 * Returns icon name for UI display
 */
export const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ORDER_ASSIGNED:
    case NOTIFICATION_TYPES.ORDER_UPDATED:
      return 'package';

    case NOTIFICATION_TYPES.REPAIR_ASSIGNED:
    case NOTIFICATION_TYPES.REPAIR_UPDATED:
      return 'tool';

    case NOTIFICATION_TYPES.MATERIAL_REQUEST_APPROVED:
      return 'check-circle';

    case NOTIFICATION_TYPES.MATERIAL_REQUEST_REJECTED:
      return 'x-circle';

    case NOTIFICATION_TYPES.DEADLINE_REMINDER:
      return 'clock';

    case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
      return 'message-circle';

    case NOTIFICATION_TYPES.ORDER_CANCELLED:
    case NOTIFICATION_TYPES.REPAIR_CANCELLED:
      return 'slash';

    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      return 'dollar-sign';

    case NOTIFICATION_TYPES.GENERAL_ANNOUNCEMENT:
      return 'bell';

    default:
      return 'bell';
  }
};

/**
 * Get notification color based on type
 * Returns color code for UI display
 */
export const getNotificationColor = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.ORDER_ASSIGNED:
    case NOTIFICATION_TYPES.REPAIR_ASSIGNED:
      return '#009688'; // Teal - New assignment

    case NOTIFICATION_TYPES.MATERIAL_REQUEST_APPROVED:
      return '#4CAF50'; // Green - Approved

    case NOTIFICATION_TYPES.MATERIAL_REQUEST_REJECTED:
    case NOTIFICATION_TYPES.ORDER_CANCELLED:
    case NOTIFICATION_TYPES.REPAIR_CANCELLED:
      return '#F44336'; // Red - Rejected/Cancelled

    case NOTIFICATION_TYPES.DEADLINE_REMINDER:
      return '#FF9800'; // Orange - Warning

    case NOTIFICATION_TYPES.MESSAGE_RECEIVED:
      return '#2196F3'; // Blue - Message

    case NOTIFICATION_TYPES.PAYMENT_RECEIVED:
      return '#4CAF50'; // Green - Payment

    case NOTIFICATION_TYPES.ORDER_UPDATED:
    case NOTIFICATION_TYPES.REPAIR_UPDATED:
      return '#607D8B'; // Grey - Update

    case NOTIFICATION_TYPES.GENERAL_ANNOUNCEMENT:
      return '#9C27B0'; // Purple - Announcement

    default:
      return '#757575'; // Grey - Default
  }
};

/**
 * Format notification timestamp
 * Returns human-readable time difference
 */
export const formatNotificationTime = (timestamp) => {
  try {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  } catch (error) {
    return 'Recently';
  }
};

/**
 * Create notification object for local storage
 * Stores notification in app for history view
 */
export const createNotificationRecord = (notificationData) => {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...notificationData,
    read: false,
    createdAt: notificationData.timestamp || Date.now(),
  };
};

/**
 * Group notifications by type
 * For notification inbox/history view
 */
export const groupNotificationsByType = (notifications) => {
  try {
    const grouped = {
      orders: [],
      repairs: [],
      materials: [],
      messages: [],
      payments: [],
      announcements: [],
      others: [],
    };

    notifications.forEach((notification) => {
      const { type } = notification;

      if (
        type === NOTIFICATION_TYPES.ORDER_ASSIGNED ||
        type === NOTIFICATION_TYPES.ORDER_UPDATED ||
        type === NOTIFICATION_TYPES.ORDER_CANCELLED
      ) {
        grouped.orders.push(notification);
      } else if (
        type === NOTIFICATION_TYPES.REPAIR_ASSIGNED ||
        type === NOTIFICATION_TYPES.REPAIR_UPDATED ||
        type === NOTIFICATION_TYPES.REPAIR_CANCELLED
      ) {
        grouped.repairs.push(notification);
      } else if (
        type === NOTIFICATION_TYPES.MATERIAL_REQUEST_APPROVED ||
        type === NOTIFICATION_TYPES.MATERIAL_REQUEST_REJECTED
      ) {
        grouped.materials.push(notification);
      } else if (type === NOTIFICATION_TYPES.MESSAGE_RECEIVED) {
        grouped.messages.push(notification);
      } else if (type === NOTIFICATION_TYPES.PAYMENT_RECEIVED) {
        grouped.payments.push(notification);
      } else if (type === NOTIFICATION_TYPES.GENERAL_ANNOUNCEMENT) {
        grouped.announcements.push(notification);
      } else {
        grouped.others.push(notification);
      }
    });

    return grouped;
  } catch (error) {
    console.error('Error grouping notifications:', error);
    return {};
  }
};

/**
 * Filter unread notifications
 */
export const getUnreadNotifications = (notifications) => {
  return notifications.filter((n) => !n.read);
};

/**
 * Get unread count by type
 */
export const getUnreadCountByType = (notifications, type) => {
  return notifications.filter((n) => !n.read && n.type === type).length;
};

/**
 * Get priority notification count
 */
export const getPriorityNotificationCount = (notifications) => {
  return notifications.filter(
    (n) => !n.read && (n.priority === 'high' || n.priority === 'urgent')
  ).length;
};

export default {
  NOTIFICATION_TYPES,
  parseNotificationPayload,
  handleNotificationNavigation,
  displayForegroundNotification,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  createNotificationRecord,
  groupNotificationsByType,
  getUnreadNotifications,
  getUnreadCountByType,
  getPriorityNotificationCount,
};
