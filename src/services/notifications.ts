import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { getApp } from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import DeviceInfo from 'react-native-device-info';
import { storage } from './storage';
import { waitForFirebaseUser } from './firebase';
import { BASE_URL } from '@/config';
import axios from 'axios';
import { version as appVersion } from '../../package.json';

// Lazy import notifee to handle cases where native module isn't available yet
let notifee: any = null;
let AndroidImportance: any = null;

try {
  const notifeeModule = require('@notifee/react-native');
  notifee = notifeeModule.default;
  AndroidImportance = notifeeModule.AndroidImportance;
} catch (error) {
  if (__DEV__) {
    console.warn(
      '[notifications] Notifee not available - native module not linked. Rebuild the app after: npm install @notifee/react-native'
    );
  }
}

// Create notification channel for Android (required for displaying notifications)
const createNotificationChannel = async (): Promise<string | null> => {
  if (Platform.OS !== 'android') {
    return null; // iOS doesn't use channels
  }

  if (!notifee || !AndroidImportance) {
    if (__DEV__) {
      console.warn(
        '[notifications] Notifee not available - cannot create notification channel. Rebuild the app.'
      );
    }
    return null;
  }

  try {
    const channelId = 'senior_stylist_notifications';
    const channel = await notifee.createChannel({
      id: channelId,
      name: 'Senior Stylist Notifications',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500],
    });

    if (__DEV__) {
      console.log('[notifications] Notification channel created:', channel);
    }

    return channelId;
  } catch (error) {
    if (__DEV__) {
      console.error('[notifications] Failed to create notification channel:', error);
    }
    return null;
  }
};

// Initialize notification channel (call this once on app start)
export const initializeNotificationChannel = async (): Promise<void> => {
  await createNotificationChannel();
};

// Check current notification permission status
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().hasPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (__DEV__) {
      console.log('[notifications] Current permission status:', {
        authStatus,
        enabled,
        statusName: messaging.AuthorizationStatus[authStatus],
      });
    }

    return enabled;
  } catch (error) {
    if (__DEV__) {
      console.error('[notifications] Failed to check permission:', error);
    }
    return false;
  }
};

// Request notification permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (__DEV__) {
      console.log('[notifications] Requesting notification permission...', {
        platform: Platform.OS,
        androidVersion: Platform.OS === 'android' ? Platform.Version : 'N/A',
      });
    }

    getApp(); // Ensure Firebase is initialized

    // Check if permission is already granted
    const alreadyGranted = await checkNotificationPermission();
    if (alreadyGranted) {
      if (__DEV__) {
        console.log('[notifications] Permission already granted, skipping request');
      }
      return true;
    }

    if (Platform.OS === 'android') {
      // Android 13+ requires runtime permission
      if (Platform.Version >= 33) {
        if (__DEV__) {
          console.log('[notifications] Requesting Android POST_NOTIFICATIONS permission...');
        }
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (__DEV__) {
          console.log('[notifications] Android permission result:', granted);
        }
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          if (__DEV__) {
            console.warn('[notifications] Android notification permission denied');
          }
          return false;
        }
      } else {
        if (__DEV__) {
          console.log('[notifications] Android version < 33, permission granted automatically');
        }
      }
    }

    // Request FCM permission (iOS and Android)
    if (__DEV__) {
      console.log('[notifications] Requesting FCM permission...');
    }
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (__DEV__) {
      console.log('[notifications] FCM permission status:', {
        authStatus,
        enabled,
        statusName: messaging.AuthorizationStatus[authStatus],
        platform: Platform.OS,
      });
    }

    return enabled;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[notifications] Failed to request permission:', error);
      console.error('[notifications] Permission error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 300),
      });
    }
    return false;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    getApp(); // Ensure Firebase is initialized

    const token = await messaging().getToken();
    if (__DEV__) {
      console.log('[notifications] FCM token obtained:', token.substring(0, 20) + '...');
    }
    return token;
  } catch (error) {
    if (__DEV__) {
      console.error('[notifications] Failed to get FCM token:', error);
    }
    return null;
  }
};

// Delete FCM token from Firestore (when user logs out)
export const deleteFCMTokenFromBackend = async (): Promise<boolean> => {
  try {
    if (__DEV__) {
      console.log('[notifications] Starting FCM token deletion...');
    }

    getApp(); // Ensure Firebase is initialized

    // Get user data first (before checking Firebase Auth)
    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[notifications] No user ID in storage, skipping FCM token deletion');
      }
      return false;
    }

    const userId = userData.id.toString();
    const deviceId = await DeviceInfo.getUniqueId();

    if (__DEV__) {
      console.log('[notifications] Attempting to delete FCM token:', {
        userId,
        deviceId,
      });
    }

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    // But don't fail if not authenticated - try to delete anyway
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn(
          '[notifications] Firebase user not authenticated, but attempting token deletion anyway'
        );
      }
    }

    // Delete the FCM token from Firestore
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .doc(deviceId)
      .delete();

    if (__DEV__) {
      console.log('[notifications] ✅ FCM token successfully deleted from Firestore:', {
        userId,
        deviceId,
      });
    }
    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[notifications] ❌ Failed to delete FCM token from Firestore:', error);
      console.error('[notifications] Token deletion error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 300),
      });
    }
    return false;
  }
};

// Save FCM token to Firestore (migrated from MySQL API)
export const saveFCMTokenToBackend = async (token: string): Promise<boolean> => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn('[notifications] Firebase user not authenticated, skipping FCM token save');
      }
      return false;
    }

    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[notifications] No user ID, skipping FCM token save');
      }
      return false;
    }

    const userId = userData.id.toString();
    const deviceId = await DeviceInfo.getUniqueId();

    // CRITICAL: Clean up tokens for this deviceId from other users
    // This prevents token mixing when:
    // - User 1 doesn't logout (cache clear/reinstall)
    // - User 2 logs in on same device
    // - Both would have same token registered
    try {
      if (__DEV__) {
        console.log(
          '[notifications] Checking for existing tokens with same deviceId from other users...'
        );
      }

      // Use collection group query to find all fcmTokens across all users
      // Note: We'll filter by checking document ID (which is deviceId) in memory
      // This is necessary because Firestore doesn't allow filtering collection groups by document ID
      const existingTokensSnapshot = await firestore().collectionGroup('fcmTokens').get();

      // Delete tokens that have the same deviceId but belong to other users
      const deletePromises: Promise<void>[] = [];
      let deletedCount = 0;

      for (const doc of existingTokensSnapshot.docs) {
        // Document ID is the deviceId: users/{userId}/fcmTokens/{deviceId}
        const docDeviceId = doc.id;
        // Extract userId from the document path: users/{userId}/fcmTokens/{deviceId}
        const pathParts = doc.ref.path.split('/');
        const tokenUserId = pathParts[1]; // users/{userId}/...

        // If this document has the same deviceId but belongs to a different user, delete it
        if (docDeviceId === deviceId && tokenUserId !== userId) {
          if (__DEV__) {
            console.log('[notifications] Found token for different user, deleting:', {
              deviceId,
              oldUserId: tokenUserId,
              newUserId: userId,
            });
          }
          deletePromises.push(doc.ref.delete());
          deletedCount++;
        }
      }

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
        if (__DEV__) {
          console.log('[notifications] Cleaned up tokens from other users:', deletedCount);
        }
      } else {
        if (__DEV__) {
          console.log('[notifications] No conflicting tokens found for this deviceId');
        }
      }
    } catch (cleanupError: any) {
      // Don't fail token save if cleanup fails, but log it
      if (__DEV__) {
        console.warn(
          '[notifications] Failed to cleanup old tokens (non-critical):',
          cleanupError?.message
        );
      }
    }

    // Get device information (with fallbacks)
    let deviceType: string;
    let osVersion: string;
    let appVersionValue: string;

    try {
      deviceType = await DeviceInfo.getModel();
    } catch {
      deviceType = Platform.OS;
    }

    try {
      osVersion = await DeviceInfo.getSystemVersion();
    } catch {
      osVersion = String(Platform.Version);
    }

    try {
      appVersionValue = await DeviceInfo.getVersion();
    } catch {
      appVersionValue = appVersion;
    }

    const tokenData = {
      token: token,
      deviceId: deviceId, // Store deviceId as a field for easier querying
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
      deviceType: deviceType,
      appVersion: appVersionValue,
      osVersion: osVersion,
      isActive: true,
      lastUsedAt: firestore.FieldValue.serverTimestamp(),
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    // Save to Firestore: users/{userId}/fcmTokens/{deviceId}
    await firestore()
      .collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .doc(deviceId)
      .set(tokenData, { merge: true });

    if (__DEV__) {
      console.log('[notifications] FCM token saved to Firestore:', {
        userId,
        deviceId,
        platform: tokenData.platform,
      });
    }
    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[notifications] Failed to save FCM token to Firestore:', error);
      console.error('[notifications] Error details:', {
        message: error?.message,
        code: error?.code,
      });
    }
    return false;
  }
};

// Initialize notifications (request permission and get token)
export const initializeNotifications = async (): Promise<string | null> => {
  try {
    if (__DEV__) {
      console.log('[notifications] Starting notification initialization...');
    }

    getApp(); // Ensure Firebase is initialized

    // First, try to get token without requesting permission
    // This avoids showing popup if permission is already granted
    try {
      const existingToken = await getFCMToken();
      if (existingToken) {
        if (__DEV__) {
          console.log(
            '[notifications] Got FCM token without requesting permission (already granted)'
          );
        }
        await saveFCMTokenToBackend(existingToken);
        return existingToken;
      }
    } catch (tokenError: any) {
      if (__DEV__) {
        console.log(
          '[notifications] Cannot get token without permission, will request:',
          tokenError?.message
        );
      }
    }

    // If we can't get token, request permission
    if (__DEV__) {
      console.log('[notifications] Requesting notification permission...');
    }
    const hasPermission = await requestNotificationPermission();
    if (__DEV__) {
      console.log('[notifications] Permission request result:', hasPermission);
    }

    // Try to get token after permission request
    const token = await getFCMToken();
    if (token) {
      if (__DEV__) {
        console.log(
          '[notifications] FCM token obtained after permission request, saving to backend...'
        );
      }
      // Save token to backend
      const saved = await saveFCMTokenToBackend(token);
      if (__DEV__) {
        console.log('[notifications] Token save result:', saved);
      }
      return token;
    } else {
      if (__DEV__) {
        console.warn('[notifications] Failed to get FCM token after permission request');
      }
      return null;
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('[notifications] Failed to initialize notifications:', error);
      console.error('[notifications] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 300),
      });
    }
    return null;
  }
};

// Handle token refresh
export const setupTokenRefreshListener = (): (() => void) => {
  return messaging().onTokenRefresh(async (token) => {
    if (__DEV__) {
      console.log('[notifications] FCM token refreshed:', token.substring(0, 20) + '...');
    }
    await saveFCMTokenToBackend(token);
  });
};

// Notification data types
export interface NotificationData {
  type: 'new_request' | 'new_message';
  consultation_id?: string;
  consultationId?: string; // Support both snake_case and camelCase
  request_id?: string;
  requestId?: string; // Support both snake_case and camelCase
  screen?: string;
  [key: string]: string | undefined;
}

// Handle notification when app is in foreground
// Note: In foreground, notifications are NOT automatically displayed.
// We only log them here. Navigation happens only when user taps the notification
// (handled by setupNotificationOpenedHandler).
export const setupForegroundMessageHandler = (
  onNotification: (data: NotificationData) => void
): (() => void) => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('🔔 [NOTIFICATION] Foreground message received:', {
      messageId: remoteMessage.messageId,
      notification: remoteMessage.notification
        ? {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            android: remoteMessage.notification.android,
            ios: remoteMessage.notification.ios,
          }
        : null,
      data: remoteMessage.data,
      sentTime: remoteMessage.sentTime,
      from: remoteMessage.from,
      ttl: remoteMessage.ttl,
      collapseKey: remoteMessage.collapseKey,
    });

    if (__DEV__) {
      console.log('[notifications] Full remote message:', JSON.stringify(remoteMessage, null, 2));
    }

    // In foreground, we need to manually display the notification in the notification tray
    // React Native Firebase doesn't automatically show notifications in foreground
    // Use notifee to display a local notification that appears in the notification curtain

    if (remoteMessage.notification) {
      const title = remoteMessage.notification.title || 'New Notification';
      const body = remoteMessage.notification.body || '';

      console.log('🔔 [NOTIFICATION] Displaying foreground notification in notification tray:', {
        title,
        body,
      });

      try {
        if (!notifee) {
          if (__DEV__) {
            console.warn(
              '🔔 [NOTIFICATION] Notifee not available - cannot display notification. Rebuild the app after: npm install @notifee/react-native'
            );
          }
          return;
        }

        // Create/ensure notification channel exists (Android)
        const channelId = await createNotificationChannel();

        // Display notification in notification tray
        await notifee.displayNotification({
          title: title,
          body: body,
          android: {
            channelId: channelId || 'senior_stylist_notifications',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibrationPattern: [300, 500],
            // Include data for navigation when tapped
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
          data: remoteMessage.data || {}, // Include notification data for tap handling
        });

        console.log('🔔 [NOTIFICATION] Foreground notification displayed in notification tray');
      } catch (error: any) {
        console.error('🔔 [NOTIFICATION] Failed to display foreground notification:', error);
      }
    }

    // Store notification data for potential use, but don't navigate
    // Navigation will happen when user taps the notification
    if (remoteMessage.data) {
      const data = remoteMessage.data as NotificationData;
      console.log('🔔 [NOTIFICATION] Notification data received (will navigate on tap):', data);
      // DO NOT call onNotification here - it will navigate immediately
      // Navigation happens only when user taps (via setupNotificationOpenedHandler)
    } else {
      console.warn('🔔 [NOTIFICATION] No data in remote message');
    }
  });
};

// Handle notification tap when app is in background/quit
export const setupBackgroundMessageHandler = (): void => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('🔔 [NOTIFICATION] Background message received (app in background/quit):', {
      messageId: remoteMessage.messageId,
      notification: remoteMessage.notification
        ? {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            android: remoteMessage.notification.android,
            ios: remoteMessage.notification.ios,
          }
        : null,
      data: remoteMessage.data,
      sentTime: remoteMessage.sentTime,
      from: remoteMessage.from,
    });

    if (__DEV__) {
      console.log(
        '[notifications] Full background message:',
        JSON.stringify(remoteMessage, null, 2)
      );
    }

    // Background messages are handled by the notification tap handler
    // This handler is mainly for logging and any background processing
  });
};

// Get initial notification (when app opened from quit state)
export const getInitialNotification = async (): Promise<NotificationData | null> => {
  try {
    console.log(
      '🔔 [NOTIFICATION] Checking for initial notification (app opened from quit state)...'
    );
    const remoteMessage = await messaging().getInitialNotification();

    if (remoteMessage) {
      console.log('🔔 [NOTIFICATION] Initial notification found:', {
        messageId: remoteMessage.messageId,
        notification: remoteMessage.notification
          ? {
              title: remoteMessage.notification.title,
              body: remoteMessage.notification.body,
            }
          : null,
        data: remoteMessage.data,
        sentTime: remoteMessage.sentTime,
      });

      if (__DEV__) {
        console.log(
          '[notifications] Full initial notification:',
          JSON.stringify(remoteMessage, null, 2)
        );
      }

      if (remoteMessage.data) {
        const data = remoteMessage.data as NotificationData;
        console.log('🔔 [NOTIFICATION] Processing initial notification data:', data);
        return data;
      } else {
        console.warn('🔔 [NOTIFICATION] Initial notification has no data');
      }
    } else {
      console.log('🔔 [NOTIFICATION] No initial notification found');
    }

    return null;
  } catch (error: any) {
    console.error('🔔 [NOTIFICATION] Failed to get initial notification:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack?.substring(0, 300),
    });
    return null;
  }
};

// Handle notification tap (when app is in background)
export const setupNotificationOpenedHandler = (
  onNotification: (data: NotificationData) => void
): (() => void) => {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('🔔 [NOTIFICATION] App opened from background notification tap:', {
      messageId: remoteMessage.messageId,
      notification: remoteMessage.notification
        ? {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body,
            android: remoteMessage.notification.android,
            ios: remoteMessage.notification.ios,
          }
        : null,
      data: remoteMessage.data,
      sentTime: remoteMessage.sentTime,
      from: remoteMessage.from,
    });

    if (__DEV__) {
      console.log(
        '[notifications] Full remote message from background tap:',
        JSON.stringify(remoteMessage, null, 2)
      );
    }

    if (remoteMessage.data) {
      const data = remoteMessage.data as NotificationData;
      console.log('🔔 [NOTIFICATION] Processing notification data from background tap:', data);
      onNotification(data);
    } else {
      console.warn('🔔 [NOTIFICATION] No data in remote message from background tap');
    }
  });
};
