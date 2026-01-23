import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Lazy import notifee to handle cases where native module isn't available yet
let notifee: any = null;
let EventType: any = null;

try {
  const notifeeModule = require('@notifee/react-native');
  notifee = notifeeModule.default;
  EventType = notifeeModule.EventType;
} catch (error) {
  if (__DEV__) {
    console.warn(
      '[notifications] Notifee not available - native module not linked. Rebuild the app after: npm install @notifee/react-native'
    );
  }
}
import {
  initializeNotifications,
  initializeNotificationChannel,
  setupTokenRefreshListener,
  setupForegroundMessageHandler,
  setupNotificationOpenedHandler,
  getInitialNotification,
  setupBackgroundMessageHandler,
  type NotificationData,
} from '@/services/notifications';
import { clearAllActiveChats } from '@/api/chat/useActiveChat';
import { useAuth } from '@/contexts/AuthContext';
import { useConsultationCompletionListener } from '@/hooks/useConsultationCompletionListener';

/**
 * NotificationHandler component
 * Handles all push notification logic and navigation
 */
const NotificationHandler: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Determine if user is a consultant
  const isConsultant = user?.role === 'consultant';

  // Handle notification navigation
  const handleNotification = (data: NotificationData) => {
    // Normalize data keys - support both snake_case and camelCase
    const consultationId = data.consultation_id || (data as any).consultationId;
    const requestId = data.request_id || (data as any).requestId;

    console.log('🔔 [NOTIFICATION] Handling notification navigation:', {
      type: data.type,
      consultation_id: data.consultation_id,
      consultationId: (data as any).consultationId,
      normalizedConsultationId: consultationId,
      request_id: data.request_id,
      requestId: (data as any).requestId,
      normalizedRequestId: requestId,
      screen: data.screen,
      fullData: data,
    });

    try {
      if (data.type === 'new_message' && consultationId) {
        // Navigate to chat screen
        const consultationIdStr = String(consultationId);
        if (!consultationIdStr) {
          console.error('🔔 [NOTIFICATION] Missing consultation_id in notification data');
          return;
        }

        const consultationIdNum = Number(consultationIdStr);
        if (isNaN(consultationIdNum) || consultationIdNum <= 0) {
          console.error('🔔 [NOTIFICATION] Invalid consultation_id:', consultationIdStr);
          return;
        }

        // Set asCustomer based on user role: true for customers, false for consultants
        const asCustomer = !isConsultant;
        console.log('🔔 [NOTIFICATION] Navigating to chat screen:', {
          consultationId: consultationIdNum,
          consultationIdStr,
          userRole: user?.role,
          isConsultant,
          asCustomer,
        });

        navigation.navigate('ConsultantChat', {
          consultationId: consultationIdNum,
          asCustomer,
        });
        console.log('🔔 [NOTIFICATION] Navigation to chat completed');
      } else if (data.type === 'consultation_completed' && consultationId) {
        // Navigate to chat screen for completed consultation (for consultants)
        const consultationIdStr = String(consultationId);
        if (!consultationIdStr) {
          console.error(
            '🔔 [NOTIFICATION] Missing consultation_id in consultation_completed notification'
          );
          return;
        }

        const consultationIdNum = Number(consultationIdStr);
        if (isNaN(consultationIdNum) || consultationIdNum <= 0) {
          console.error('🔔 [NOTIFICATION] Invalid consultation_id:', consultationIdStr);
          return;
        }

        console.log('🔔 [NOTIFICATION] Navigating to completed consultation:', {
          consultationId: consultationIdNum,
          consultationIdStr,
          userRole: user?.role,
          isConsultant,
        });

        // Navigate to chat screen (consultant view)
        navigation.navigate('ConsultantChat', {
          consultationId: consultationIdNum,
          asCustomer: false,
        });
        console.log('🔔 [NOTIFICATION] Navigation to completed consultation completed');
      } else if (data.type === 'new_request' && requestId) {
        // Navigate to requests screen (for consultants)
        // RequestTab is nested inside ConsultantTabs
        console.log('🔔 [NOTIFICATION] Navigating to requests screen:', { requestId });
        try {
          // Try nested navigation first (if we're in AppStack)
          navigation.navigate(
            'ConsultantTabs' as never,
            {
              screen: 'RequestTab',
            } as never
          );
          console.log('🔔 [NOTIFICATION] Navigation to requests completed');
        } catch (error) {
          // Fallback: try direct navigation (if we're already in ConsultantTabs)
          try {
            navigation.navigate('RequestTab' as never);
            console.log('🔔 [NOTIFICATION] Navigation to requests completed (direct)');
          } catch (fallbackError) {
            console.error('🔔 [NOTIFICATION] Failed to navigate to requests:', fallbackError);
          }
        }
      } else if (data.screen) {
        // Use screen from notification data if provided
        // Map notification screen names to actual screen names
        let screenName = data.screen;
        if (screenName === 'chat') {
          screenName = 'ConsultantChat';
        } else if (screenName === 'requests') {
          // Requests screen is nested inside ConsultantTabs
          screenName = 'ConsultantTabs';
        }

        const params: any = {};
        if (consultationId) {
          const consultationIdStr = String(consultationId);
          const consultationIdNum = Number(consultationIdStr);
          if (!isNaN(consultationIdNum) && consultationIdNum > 0) {
            params.consultationId = consultationIdNum;
            params.asCustomer = !isConsultant; // Set based on user role
          } else {
            console.error(
              '🔔 [NOTIFICATION] Invalid consultation_id in screen navigation:',
              consultationIdStr
            );
          }
        }
        if (requestId) {
          params.requestId = requestId;
        }
        console.log('🔔 [NOTIFICATION] Navigating to screen from data:', {
          originalScreen: data.screen,
          mappedScreen: screenName,
          params,
        });

        // Handle nested navigation for requests screen
        if (screenName === 'ConsultantTabs' && data.screen === 'requests') {
          try {
            navigation.navigate(
              'ConsultantTabs' as never,
              {
                screen: 'RequestTab',
              } as never
            );
            console.log('🔔 [NOTIFICATION] Navigation to requests completed');
            return;
          } catch (error) {
            console.error('🔔 [NOTIFICATION] Failed to navigate to requests:', error);
            return;
          }
        }

        // Validate that we have required params for chat screen
        if (screenName === 'ConsultantChat' && !params.consultationId) {
          console.error(
            '🔔 [NOTIFICATION] Cannot navigate to chat: missing or invalid consultationId'
          );
          return;
        }

        navigation.navigate(screenName as never, params);
        console.log('🔔 [NOTIFICATION] Navigation to screen completed');
      } else {
        console.warn('🔔 [NOTIFICATION] Unknown notification type or missing data:', data);
      }
    } catch (error: any) {
      console.error('🔔 [NOTIFICATION] Failed to navigate:', {
        error: error?.message,
        code: error?.code,
        stack: error?.stack?.substring(0, 300),
        data,
      });
    }
  };

  // Listen for consultation completion (only for consultants)
  useConsultationCompletionListener();

  useEffect(() => {
    // Don't initialize notifications here - wait for user to be logged in
    // Notifications will be initialized in AuthContext after successful login

    // Initialize notification channel (required for Android to display notifications)
    initializeNotificationChannel().catch((error) => {
      if (__DEV__) {
        console.warn('[notifications] Failed to initialize notification channel:', error);
      }
    });

    // Setup background message handler (must be called at top level)
    setupBackgroundMessageHandler();

    // Setup token refresh listener
    const tokenRefreshUnsubscribe = setupTokenRefreshListener();

    // Setup foreground message handler
    // Note: Foreground handler only logs - it does NOT navigate
    // Navigation happens only when user taps the notification
    console.log('🔔 [NOTIFICATION] Setting up foreground message handler...');
    const foregroundUnsubscribe = setupForegroundMessageHandler(() => {
      // This callback is not used for navigation in foreground
      // Navigation only happens on tap (via setupNotificationOpenedHandler)
      console.log('🔔 [NOTIFICATION] Foreground notification received (will navigate on tap)');
    });
    console.log('🔔 [NOTIFICATION] Foreground message handler set up');

    // Setup notification opened handler (when app is in background)
    console.log('🔔 [NOTIFICATION] Setting up notification opened handler...');
    const openedUnsubscribe = setupNotificationOpenedHandler(handleNotification);
    console.log('🔔 [NOTIFICATION] Notification opened handler set up');

    // Setup notifee event handler (for notifications displayed by notifee in foreground)
    // When user taps a notifee notification, handle navigation
    let notifeeForegroundUnsubscribe: (() => void) | null = null;

    if (notifee && EventType) {
      console.log('🔔 [NOTIFICATION] Setting up notifee event handler...');
      try {
        notifeeForegroundUnsubscribe = notifee.onForegroundEvent(({ type, detail }: any) => {
          console.log('🔔 [NOTIFICATION] Notifee foreground event:', { type, detail });
          if (type === EventType.PRESS) {
            // User tapped the notification
            const notificationData = detail.notification?.data as NotificationData;
            if (notificationData) {
              console.log('🔔 [NOTIFICATION] Notifee notification tapped, navigating...');
              handleNotification(notificationData);
            } else {
              console.warn('🔔 [NOTIFICATION] Notifee notification tapped but no data found');
            }
          }
        });
        console.log('🔔 [NOTIFICATION] Notifee event handler set up');
      } catch (error) {
        if (__DEV__) {
          console.warn('🔔 [NOTIFICATION] Failed to set up notifee event handler:', error);
        }
      }
    } else {
      if (__DEV__) {
        console.warn(
          '🔔 [NOTIFICATION] Notifee not available - event handler not set up. Rebuild the app.'
        );
      }
    }

    // Handle initial notification (when app opened from quit state)
    console.log('🔔 [NOTIFICATION] Checking for initial notification...');
    getInitialNotification().then((data) => {
      if (data) {
        console.log('🔔 [NOTIFICATION] Initial notification found, will navigate after delay');
        // Small delay to ensure navigation is ready
        setTimeout(() => {
          console.log('🔔 [NOTIFICATION] Navigating from initial notification...');
          handleNotification(data);
        }, 1000);
      } else {
        console.log('🔔 [NOTIFICATION] No initial notification found');
      }
    });

    // Handle app state changes
    console.log('🔔 [NOTIFICATION] Setting up app state listener...');
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('🔔 [NOTIFICATION] App state changed:', {
        from: appState.current,
        to: nextAppState,
      });

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background - clear all active chats
        console.log('🔔 [NOTIFICATION] App went to background, clearing all active chats...');
        clearAllActiveChats().catch((error) => {
          if (__DEV__) {
            console.warn('[notifications] Failed to clear active chats on background:', error);
          }
        });
      } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - check for notifications
        console.log('🔔 [NOTIFICATION] App came to foreground, checking for notifications...');
        getInitialNotification().then((data) => {
          if (data) {
            console.log('🔔 [NOTIFICATION] Found notification when app came to foreground');
            handleNotification(data);
          } else {
            console.log('🔔 [NOTIFICATION] No notification found when app came to foreground');
          }
        });
      }
      appState.current = nextAppState;
    });
    console.log('🔔 [NOTIFICATION] App state listener set up');

    return () => {
      tokenRefreshUnsubscribe();
      foregroundUnsubscribe();
      openedUnsubscribe();
      if (notifeeForegroundUnsubscribe) {
        notifeeForegroundUnsubscribe();
      }
      subscription.remove();
    };
  }, [navigation]);

  return null; // This component doesn't render anything
};

export default NotificationHandler;
