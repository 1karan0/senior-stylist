import { useEffect, useRef } from 'react';
import firestore from '@react-native-firebase/firestore';
import { waitForFirebaseUser } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';

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
      '[consultation-completion] Notifee not available - native module not linked. Rebuild the app after: npm install @notifee/react-native'
    );
  }
}

/**
 * Hook to listen for consultation completion and show notifications
 * Only active for consultants
 */
export const useConsultationCompletionListener = () => {
  const { user } = useAuth();
  const isConsultant = user?.role === 'consultant';
  const consultantId = user?.id ? String(user.id) : null;
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const completedConsultationsRef = useRef<Set<number>>(new Set());
  const previousStatusesRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (!isConsultant || !consultantId) {
      return;
    }

    const setupListener = async () => {
      const firebaseUser = await waitForFirebaseUser(3000);
      if (!firebaseUser) {
        if (__DEV__) {
          console.warn('[consultation-completion] Firebase user not authenticated');
        }
        return;
      }

      // Create notification channel for Android
      let channelId: string | null = null;
      if (Platform.OS === 'android' && notifee && AndroidImportance) {
        try {
          channelId = await notifee.createChannel({
            id: 'consultation_completion',
            name: 'Consultation Completion',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
          });
        } catch (error) {
          if (__DEV__) {
            console.warn('[consultation-completion] Failed to create channel:', error);
          }
        }
      }

      // Listen to consultations for this consultant
      const query = firestore()
        .collection('consultations')
        .where('consultant_id', '==', consultantId);

      // First, load existing consultations to initialize previous statuses
      const initialSnapshot = await query.get();
      initialSnapshot.docs.forEach((doc) => {
        const consultationId = Number(doc.id);
        const data = doc.data();
        const status = data.status || 'pending';
        previousStatusesRef.current.set(consultationId, status);
        // If already completed, mark as processed
        if (status === 'completed') {
          completedConsultationsRef.current.add(consultationId);
        }
      });

      const unsubscribe = query.onSnapshot(
        async (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const consultationId = Number(change.doc.id);
            const data = change.doc.data();
            const currentStatus = data.status || 'pending';
            const previousStatus = previousStatusesRef.current.get(consultationId);

            // Update the previous status for this consultation
            previousStatusesRef.current.set(consultationId, currentStatus);

            // Check if consultation status changed to 'completed'
            // Only trigger if:
            // 1. Current status is 'completed'
            // 2. Previous status was NOT 'completed' (or didn't exist)
            // 3. We haven't already notified about this completion
            const statusChangedToCompleted =
              currentStatus === 'completed' &&
              previousStatus !== 'completed' &&
              !completedConsultationsRef.current.has(consultationId);

            if (statusChangedToCompleted) {
              // Mark as processed to avoid duplicate notifications
              completedConsultationsRef.current.add(consultationId);

              // Get customer name for notification
              const customerName = data.user_name || 'Customer';
              const consultationTitle = `Consultation Completed`;

              if (__DEV__) {
                console.log('[consultation-completion] Consultation completed:', {
                  consultationId,
                  customerName,
                  previousStatus,
                  currentStatus,
                });
              }

              // Show local notification
              if (notifee) {
                notifee
                  .displayNotification({
                    title: consultationTitle,
                    body: `${customerName} has completed the consultation`,
                    android: {
                      channelId: channelId || 'senior_stylist_notifications',
                      importance: AndroidImportance?.HIGH,
                      sound: 'default',
                      vibrationPattern: [300, 500],
                      pressAction: {
                        id: 'default',
                      },
                    },
                    ios: {
                      sound: 'default',
                    },
                    data: {
                      type: 'consultation_completed',
                      consultation_id: String(consultationId),
                      screen: 'ConsultantChat',
                    },
                  })
                  .catch((error: any) => {
                    if (__DEV__) {
                      console.error(
                        '[consultation-completion] Failed to show notification:',
                        error
                      );
                    }
                  });
              }
            }
          });
        },
        (error) => {
          if (__DEV__) {
            console.error('[consultation-completion] Listener error:', error);
          }
        }
      );

      unsubscribeRef.current = unsubscribe;
    };

    setupListener();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      // Clear completed consultations set and previous statuses when unmounting
      completedConsultationsRef.current.clear();
      previousStatusesRef.current.clear();
    };
  }, [isConsultant, consultantId]);

  return null;
};
