import firestore from '@react-native-firebase/firestore';
import DeviceInfo from 'react-native-device-info';
import { storage } from '@/services/storage';
import { getApp } from '@react-native-firebase/app';
import { waitForFirebaseUser } from '@/services/firebase';

/**
 * Set active chat for the current user (Firestore direct)
 * Call this when user opens a chat screen
 */
export const setActiveChat = async (consultationId: number | null): Promise<boolean> => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn('[active-chat] Firebase user not authenticated, skipping active chat update');
      }
      return false;
    }

    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[active-chat] No user ID, skipping active chat update');
      }
      return false;
    }

    const userId = userData.id.toString();
    const deviceId = await DeviceInfo.getUniqueId();

    if (consultationId) {
      // Set active chat
      await firestore()
        .collection('user_active_chats')
        .doc(userId)
        .collection('activeChats')
        .doc(consultationId.toString())
        .set(
          {
            consultationId: consultationId.toString(),
            lastActivityAt: firestore.FieldValue.serverTimestamp(),
            deviceId: deviceId,
          },
          { merge: true }
        );

      if (__DEV__) {
        console.log('[active-chat] Active chat set in Firestore:', {
          userId,
          consultationId,
          deviceId,
        });
      }
    } else {
      // Clear active chat (when consultationId is null)
      // Note: We don't clear here, we delete the specific chat when user closes it
      if (__DEV__) {
        console.log(
          '[active-chat] Clearing active chat requested (use clearActiveChat for specific chat)'
        );
      }
    }

    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[active-chat] Failed to set active chat in Firestore:', error);
      console.error('[active-chat] Error details:', {
        message: error?.message,
        code: error?.code,
      });
    }
    return false;
  }
};

/**
 * Clear active chat for a specific consultation (when user closes/leaves chat)
 */
export const clearActiveChat = async (consultationId: number): Promise<boolean> => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn('[active-chat] Firebase user not authenticated, skipping active chat clear');
      }
      return false;
    }

    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[active-chat] No user ID, skipping active chat clear');
      }
      return false;
    }

    const userId = userData.id.toString();

    await firestore()
      .collection('user_active_chats')
      .doc(userId)
      .collection('activeChats')
      .doc(consultationId.toString())
      .delete();

    if (__DEV__) {
      console.log('[active-chat] Active chat cleared in Firestore:', {
        userId,
        consultationId,
      });
    }

    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[active-chat] Failed to clear active chat in Firestore:', error);
    }
    return false;
  }
};

/**
 * Clear all active chats for the current user (when app goes to background)
 */
export const clearAllActiveChats = async (): Promise<boolean> => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn(
          '[active-chat] Firebase user not authenticated, skipping clear all active chats'
        );
      }
      return false;
    }

    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[active-chat] No user ID, skipping clear all active chats');
      }
      return false;
    }

    const userId = userData.id.toString();

    // Get all active chats
    const activeChatsSnapshot = await firestore()
      .collection('user_active_chats')
      .doc(userId)
      .collection('activeChats')
      .get();

    // Delete all active chats
    const deletePromises = activeChatsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

    if (__DEV__) {
      console.log('[active-chat] All active chats cleared in Firestore:', {
        userId,
        count: activeChatsSnapshot.docs.length,
      });
    }

    return true;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[active-chat] Failed to clear all active chats in Firestore:', error);
    }
    return false;
  }
};

/**
 * Get current active chat for the user (from Firestore)
 */
export const getActiveChat = async (): Promise<number | null> => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Ensure Firebase Auth user is authenticated (required for Firestore security rules)
    const firebaseUser = await waitForFirebaseUser(3000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn('[active-chat] Firebase user not authenticated, skipping active chat fetch');
      }
      return null;
    }

    const userData = await storage.getUserData();
    if (!userData?.id) {
      if (__DEV__) {
        console.warn('[active-chat] No user ID, skipping active chat fetch');
      }
      return null;
    }

    const userId = userData.id.toString();

    // Get the most recent active chat
    const activeChatsSnapshot = await firestore()
      .collection('user_active_chats')
      .doc(userId)
      .collection('activeChats')
      .orderBy('lastActivityAt', 'desc')
      .limit(1)
      .get();

    if (!activeChatsSnapshot.empty) {
      const activeChat = activeChatsSnapshot.docs[0].data();
      const consultationId = activeChat.consultationId ? Number(activeChat.consultationId) : null;

      if (__DEV__) {
        console.log('[active-chat] Active chat retrieved from Firestore:', consultationId);
      }

      return consultationId;
    }

    if (__DEV__) {
      console.log('[active-chat] No active chat found in Firestore');
    }

    return null;
  } catch (error: any) {
    if (__DEV__) {
      console.error('[active-chat] Failed to get active chat from Firestore:', error);
    }
    return null;
  }
};
