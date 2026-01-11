/**
 * Push Notification Service
 * Handles Firebase Cloud Messaging (FCM) integration
 * for real-time notifications to manufacturers
 */

import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

const FCM_TOKEN_KEY = '@fcm_token';
const NOTIFICATION_PERMISSION_REQUESTED = '@notification_permission_requested';

/**
 * Request notification permissions
 * iOS requires explicit permission, Android 13+ requires permission
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if we've already requested permission
    const alreadyRequested = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_REQUESTED);

    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('iOS notification permission granted:', authStatus);
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED, 'true');
        return true;
      } else {
        console.log('iOS notification permission denied');
        return false;
      }
    } else if (Platform.OS === 'android') {
      // Android 13+ requires explicit permission
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Android notification permission granted');
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED, 'true');
          return true;
        } else {
          console.log('Android notification permission denied');
          return false;
        }
      } else {
        // Below Android 13, notifications are enabled by default
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_REQUESTED, 'true');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token for this device
 * This token is used by backend to send push notifications
 */
export const getFCMToken = async () => {
  try {
    // Check if permission is granted
    const hasPermission = await messaging().hasPermission();
    if (hasPermission !== messaging.AuthorizationStatus.AUTHORIZED &&
        hasPermission !== messaging.AuthorizationStatus.PROVISIONAL) {
      console.log('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      // Store token locally
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } else {
      console.log('Failed to get FCM token');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Get stored FCM token from local storage
 */
export const getStoredFCMToken = async () => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting stored FCM token:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 * Backend will use this token to send notifications
 */
export const registerFCMTokenWithBackend = async (token, userId, authToken) => {
  try {
    if (!token || !userId || !authToken) {
      console.log('Missing parameters for token registration');
      return false;
    }

    // TODO: Replace with your actual API endpoint
    const API_URL = 'YOUR_API_BASE_URL';

    const response = await fetch(`${API_URL}/auth/register-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fcm_token: token,
        user_id: userId,
        platform: Platform.OS,
        device_info: {
          os_version: Platform.Version,
          model: Platform.constants?.Model || 'unknown',
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('FCM token registered with backend successfully');
      return true;
    } else {
      console.error('Failed to register FCM token with backend:', data);
      return false;
    }
  } catch (error) {
    console.error('Error registering FCM token with backend:', error);
    return false;
  }
};

/**
 * Initialize push notifications
 * Should be called when user logs in
 */
export const initializePushNotifications = async (userId, authToken) => {
  try {
    console.log('Initializing push notifications...');

    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted, skipping initialization');
      return false;
    }

    // Get FCM token
    const token = await getFCMToken();
    if (!token) {
      console.log('Failed to get FCM token, skipping initialization');
      return false;
    }

    // Register token with backend
    const registered = await registerFCMTokenWithBackend(token, userId, authToken);
    if (!registered) {
      console.log('Failed to register FCM token with backend');
      return false;
    }

    console.log('Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};

/**
 * Handle FCM token refresh
 * Token can change when app is reinstalled or data is cleared
 */
export const onTokenRefresh = (callback) => {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('FCM token refreshed:', newToken.substring(0, 20) + '...');

    // Store new token
    await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);

    // Notify callback (to register with backend)
    if (callback && typeof callback === 'function') {
      callback(newToken);
    }
  });

  return unsubscribe;
};

/**
 * Handle foreground notifications
 * When app is open and notification arrives
 */
export const onForegroundMessage = (messageHandler) => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground notification received:', remoteMessage);

    // Display alert or custom notification UI
    if (remoteMessage.notification) {
      const { title, body } = remoteMessage.notification;

      Alert.alert(
        title || 'New Notification',
        body || 'You have a new update',
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => {
              // Handle notification tap
              if (messageHandler && typeof messageHandler === 'function') {
                messageHandler(remoteMessage);
              }
            },
          },
        ]
      );
    }

    // Call custom handler
    if (messageHandler && typeof messageHandler === 'function') {
      messageHandler(remoteMessage);
    }
  });

  return unsubscribe;
};

/**
 * Handle background/quit state notifications
 * When notification opens the app
 */
export const onNotificationOpenedApp = (navigationHandler) => {
  // Handle notification that opened the app from background state
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('Notification opened app from background:', remoteMessage);

    if (navigationHandler && typeof navigationHandler === 'function') {
      navigationHandler(remoteMessage);
    }
  });

  // Handle notification that opened the app from quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log('Notification opened app from quit state:', remoteMessage);

        if (navigationHandler && typeof navigationHandler === 'function') {
          navigationHandler(remoteMessage);
        }
      }
    });
};

/**
 * Set badge count (iOS only)
 */
export const setBadgeCount = async (count) => {
  if (Platform.OS === 'ios') {
    try {
      await messaging().setApplicationIconBadgeNumber(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  try {
    // iOS: Remove all delivered notifications
    if (Platform.OS === 'ios') {
      await messaging().removeAllDeliveredNotifications();
    }

    // Android: Clear notification shade
    // Note: This requires additional native module setup
    console.log('Cleared all notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

/**
 * Unregister FCM token (logout)
 */
export const unregisterFCMToken = async (authToken) => {
  try {
    const token = await getStoredFCMToken();

    if (token && authToken) {
      // TODO: Replace with your actual API endpoint
      const API_URL = 'YOUR_API_BASE_URL';

      await fetch(`${API_URL}/auth/unregister-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          fcm_token: token,
        }),
      });
    }

    // Delete FCM token from device
    await messaging().deleteToken();

    // Clear local storage
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);

    console.log('FCM token unregistered');
    return true;
  } catch (error) {
    console.error('Error unregistering FCM token:', error);
    return false;
  }
};

/**
 * Subscribe to a topic (optional - for broadcast messages)
 */
export const subscribeToTopic = async (topic) => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Subscribed to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    return false;
  }
};

/**
 * Unsubscribe from a topic
 */
export const unsubscribeFromTopic = async (topic) => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Unsubscribed from topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
    return false;
  }
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = async () => {
  try {
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

export default {
  requestNotificationPermission,
  getFCMToken,
  getStoredFCMToken,
  registerFCMTokenWithBackend,
  initializePushNotifications,
  onTokenRefresh,
  onForegroundMessage,
  onNotificationOpenedApp,
  setBadgeCount,
  clearAllNotifications,
  unregisterFCMToken,
  subscribeToTopic,
  unsubscribeFromTopic,
  areNotificationsEnabled,
};
