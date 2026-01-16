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
      const androidVersion =
        typeof Platform.Version === 'number'
          ? Platform.Version
          : parseInt(String(Platform.Version), 10);
      if (androidVersion >= 33) {
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
export const getFCMToken = async (retryCount = 0): Promise<string | null> => {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 500; // milliseconds

  try {
    getApp(); // Ensure Firebase is initialized

    // On iOS, we must check permissions and register for remote messages before getting the token
    if (Platform.OS === 'ios') {
      // First, check if notification permissions are granted
      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        if (__DEV__) {
          console.warn(
            '[notifications] iOS notification permission not granted, cannot get FCM token'
          );
        }
        return null;
      }

      // Register for remote messages (required on iOS before getting token)
      let registrationSuccessful = false;
      try {
        await messaging().registerDeviceForRemoteMessages();
        registrationSuccessful = true;
        if (__DEV__) {
          console.log('[notifications] iOS device registered for remote messages');
        }
        // Increased delay to ensure registration completes on the native side
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
      } catch (registerError: any) {
        // If already registered, that's fine - we can proceed
        if (registerError?.code === 'messaging/already-registered') {
          registrationSuccessful = true;
          if (__DEV__) {
            console.log('[notifications] iOS device already registered for remote messages');
          }
          // Still add a delay to ensure everything is ready
          await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
        } else if (
          registerError?.code === 'messaging/unknown' &&
          registerError?.message?.includes('aps-environment')
        ) {
          // Missing entitlements - this is a configuration issue, not a runtime error
          // Log a helpful message but don't crash
          if (__DEV__) {
            console.warn(
              '[notifications] iOS push notification entitlements not configured. Please add "aps-environment" entitlement in Xcode.'
            );
            console.warn(
              '[notifications] To fix: In Xcode, go to Signing & Capabilities, enable Push Notifications, or manually add aps-environment to your entitlements file.'
            );
          }
          // Return null gracefully - app can continue without push notifications
          return null;
        } else {
          // For other errors, log but don't proceed - registration failed
          if (__DEV__) {
            console.error('[notifications] iOS registration failed:', registerError?.message);
            console.error('[notifications] Registration error details:', {
              code: registerError?.code,
              message: registerError?.message,
            });
          }
          return null;
        }
      }

      // Double-check: if registration didn't succeed, don't try to get token
      if (!registrationSuccessful) {
        if (__DEV__) {
          console.warn('[notifications] iOS registration not successful, cannot get FCM token');
        }
        return null;
      }
    }

    const token = await messaging().getToken();
    if (__DEV__) {
      console.log('[notifications] FCM token obtained:', token.substring(0, 20) + '...');
    }
    return token;
  } catch (error: any) {
    // On iOS, if we get the "unregistered" error, retry after ensuring registration
    if (
      Platform.OS === 'ios' &&
      (error?.code === 'messaging/unregistered' || error?.message?.includes('unregistered')) &&
      retryCount < MAX_RETRIES
    ) {
      if (__DEV__) {
        console.log(
          `[notifications] iOS unregistered error, retrying (${retryCount + 1}/${MAX_RETRIES})...`
        );
      }

      // Ensure registration before retry
      try {
        await messaging().registerDeviceForRemoteMessages();
        await new Promise<void>((resolve) => setTimeout(() => resolve(), RETRY_DELAY));
      } catch (regError: any) {
        // Ignore "already-registered" errors
        if (regError?.code !== 'messaging/already-registered') {
          if (__DEV__) {
            console.warn('[notifications] Registration failed during retry:', regError?.message);
          }
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), RETRY_DELAY));
        }
      }

      // Retry getting the token
      return getFCMToken(retryCount + 1);
    }

    if (__DEV__) {
      console.error('[notifications] Failed to get FCM token:', error);
      console.error('[notifications] FCM token error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 300),
      });
    }
    return null;
  }
};

// Delete FCM token from Firestore for a specific user (safe to call during logout even after storage is cleared)
export const deleteFCMTokenForUser = async (userId: string): Promise<boolean> => {
  try {
    if (!userId) return false;
    getApp(); // Ensure Firebase is initialized

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
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .doc(deviceId)
        .delete();
    } catch (deleteError: any) {
      // Handle permission denied gracefully - token might not exist or user might not have permission
      if (
        deleteError?.code === 'permission-denied' ||
        deleteError?.code === 'firestore/permission-denied'
      ) {
        if (__DEV__) {
          console.warn(
            '[notifications] Permission denied when deleting FCM token (non-critical):',
            deleteError?.message
          );
        }
        return false; // Return false but don't throw
      }
      throw deleteError; // Re-throw other errors
    }

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

// Delete local FCM token so this device stops receiving pushes immediately
export const clearLocalFCMToken = async (): Promise<boolean> => {
  try {
    getApp(); // Ensure Firebase is initialized

    if (__DEV__) {
      console.log('[notifications] Clearing local FCM token...');
    }

    await messaging().deleteToken();

    if (Platform.OS === 'ios') {
      const unregister = (messaging() as any).unregisterDeviceForRemoteMessages;
      if (typeof unregister === 'function') {
        await unregister.call(messaging());
      }
    }

    if (__DEV__) {
      console.log('[notifications] ✅ Local FCM token cleared');
    }
    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.warn('[notifications] ❌ Failed to clear local FCM token:', {
        message: error?.message,
        code: error?.code,
      });
    }
    return false;
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
    return await deleteFCMTokenForUser(userId);
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
    // Increase wait time to 5 seconds to allow Firebase authentication to complete
    const firebaseUser = await waitForFirebaseUser(5000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn(
          '[notifications] Firebase user not authenticated after 5s, skipping FCM token save'
        );
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
      let existingTokensSnapshot;
      try {
        existingTokensSnapshot = await firestore().collectionGroup('fcmTokens').get();
      } catch (queryError: any) {
        // Handle permission denied gracefully - user might not have permission for collection group queries
        if (
          queryError?.code === 'permission-denied' ||
          queryError?.code === 'firestore/permission-denied'
        ) {
          if (__DEV__) {
            console.warn(
              '[notifications] Permission denied for collection group query (non-critical):',
              queryError?.message
            );
          }
          // Continue without cleanup - this is not critical
          existingTokensSnapshot = { docs: [] } as any;
        } else {
          throw queryError; // Re-throw other errors
        }
      }

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
          // Wrap delete in a promise that handles errors gracefully
          deletePromises.push(
            doc.ref.delete().catch((deleteErr: any) => {
              // Handle permission denied gracefully - might not have permission to delete other users' tokens
              if (
                deleteErr?.code === 'permission-denied' ||
                deleteErr?.code === 'firestore/permission-denied'
              ) {
                if (__DEV__) {
                  console.warn(
                    '[notifications] Permission denied when deleting token from other user (non-critical):',
                    deleteErr?.message
                  );
                }
              } else {
                // Log other errors but don't throw
                if (__DEV__) {
                  console.warn(
                    '[notifications] Error deleting token from other user:',
                    deleteErr?.message
                  );
                }
              }
            })
          );
          deletedCount++;
        }
      }

      if (deletePromises.length > 0) {
        // Use Promise.allSettled to handle all promises even if some fail
        await Promise.allSettled(deletePromises);
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
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('fcmTokens')
        .doc(deviceId)
        .set(tokenData, { merge: true });
    } catch (saveError: any) {
      // Handle permission denied gracefully
      if (
        saveError?.code === 'permission-denied' ||
        saveError?.code === 'firestore/permission-denied'
      ) {
        if (__DEV__) {
          console.warn(
            '[notifications] Permission denied when saving FCM token. User may not be authenticated:',
            saveError?.message
          );
        }
        return false; // Return false but don't throw
      }
      throw saveError; // Re-throw other errors
    }

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

    // Always check permission status first
    const alreadyGranted = await checkNotificationPermission();

    if (!alreadyGranted) {
      // Permission not granted, request it explicitly
      if (__DEV__) {
        console.log('[notifications] Permission not granted, requesting...');
      }
      const hasPermission = await requestNotificationPermission();
      if (__DEV__) {
        console.log('[notifications] Permission request result:', hasPermission);
      }

      if (!hasPermission) {
        if (__DEV__) {
          console.warn('[notifications] Permission denied by user');
        }
        return null;
      }
    } else {
      if (__DEV__) {
        console.log('[notifications] Permission already granted');
      }
    }

    // On iOS, add a small delay after permission check to ensure system is ready
    if (Platform.OS === 'ios') {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 200));
    }

    // Try to get token (with permission granted)
    const token = await getFCMToken();
    if (token) {
      if (__DEV__) {
        console.log('[notifications] FCM token obtained successfully, saving to backend...');
      }
      // Save token to backend - wrap in try-catch to prevent unhandled promise rejections
      try {
        const saved = await saveFCMTokenToBackend(token);
        if (__DEV__) {
          console.log('[notifications] Token save result:', saved);
        }
      } catch (saveError: any) {
        // Non-critical error - token was obtained, just couldn't save to backend
        if (__DEV__) {
          console.warn(
            '[notifications] Failed to save token to backend (non-critical):',
            saveError?.message
          );
        }
      }
      return token;
    } else {
      if (__DEV__) {
        console.warn('[notifications] Failed to get FCM token');
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
    // Wrap in try-catch to prevent unhandled promise rejections
    try {
      await saveFCMTokenToBackend(token);
    } catch (error: any) {
      // Non-critical error - token was refreshed, just couldn't save to backend
      if (__DEV__) {
        console.warn(
          '[notifications] Failed to save refreshed token to backend (non-critical):',
          error?.message
        );
      }
    }
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
