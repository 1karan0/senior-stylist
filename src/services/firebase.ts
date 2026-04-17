import { getApp } from '@react-native-firebase/app';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  getAuth,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
} from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { FIREBASE_CONFIG } from '@/config/firebase';

export interface StylistRequest {
  customer_id: string;
  customer_name: string;
  short_meta?: {
    problem_description?: string;
    has_image?: boolean;
  };
  sent_at: number;
  expires_at: number;
  status: string;
  image_url?: string;
}

export interface StylistRequestListenerCallbacks {
  onRequestAdded?: (request: StylistRequest, requestId: string) => void;
  onRequestRemoved?: (requestId: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

/** Type for the function returned by Firestore onSnapshot (and similar) to unsubscribe. */
export type Unsubscribe = () => void;

// React Native Firebase auto-initializes from google-services.json
// Use getApp() to ensure Firebase is initialized (new API, non-deprecated)
export const initializeFirebase = (): boolean => {
  try {
    // Use getApp() to get the default Firebase app instance
    // This ensures Firebase is initialized and uses the new non-deprecated API
    const app = getApp();
    return app !== null;
  } catch (error: any) {
    if (__DEV__) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('No Firebase App')) {
        console.warn(
          '⚠️ Firebase not initialized. This usually means:',
          '\n1. The app needs to be rebuilt after package name change',
          '\n2. Run: cd android && ./gradlew clean && ./gradlew :app:assembleDebug',
          '\n3. Make sure google-services.json package_name matches: com.seniorstylist.app'
        );
      } else {
        console.error('Firebase initialization error:', error);
      }
    }
    return false;
  }
};

// Helper to get auth instance (RN Firebase)
// Ensure Firebase app is initialized first
export const getFirebaseAuth = () => {
  try {
    getApp(); // Ensure Firebase is initialized
    return getAuth();
  } catch (error) {
    if (__DEV__) {
      console.error('Firebase Auth not available:', error);
    }
    throw error;
  }
};

// Helper to get firestore instance (RN Firebase)
// Ensure Firebase app is initialized first
export const getFirestoreInstance = () => {
  try {
    getApp(); // Ensure Firebase is initialized
    return firestore();
  } catch (error) {
    if (__DEV__) {
      console.error('Firestore not available:', error);
    }
    throw error;
  }
};

export const signInWithFirebaseCustomToken = async (customToken: string) => {
  try {
    getApp(); // Ensure Firebase is initialized
    const userCredential = await signInWithCustomToken(getAuth(), customToken);
    return userCredential.user;
  } catch (error: any) {
    if (__DEV__) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('No Firebase App')) {
        console.error(
          '❌ Firebase not initialized. Please rebuild the app:',
          '\n   cd android && ./gradlew clean && ./gradlew :app:assembleDebug',
          '\n   Then reinstall the app on your device.'
        );
      } else {
        console.error('Failed to sign in with custom token:', error);
        console.log('firebase config checking=======', FIREBASE_CONFIG);
      }
    }
    throw error;
  }
};

export const signOutFirebase = async (): Promise<void> => {
  try {
    await signOut(getAuth());
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to sign out from Firebase:', error);
    }
  }
};

export const sendPhoneVerificationCode = async (phoneNumber: string): Promise<string> => {
  getApp(); // Ensure Firebase is initialized
  try {
    const confirmation = await signInWithPhoneNumber(getAuth(), phoneNumber);
    const verificationId = confirmation.verificationId;

    if (!verificationId) {
      throw new Error('Unable to get verification ID from Firebase.');
    }

    return verificationId;
  } catch (error: any) {
    const errorCode = error?.code;

    if (errorCode === 'auth/app-not-authorized') {
      throw new Error(
        'This app build is not authorized for Firebase Phone Auth. Add this build package and SHA-1/SHA-256 in Firebase Console, then rebuild.'
      );
    }

    if (errorCode === 'auth/too-many-requests') {
      throw new Error('Too many OTP attempts from this device. Please wait and try again later.');
    }

    throw error;
  }
};

export const verifyPhoneOtpCode = async (verificationId: string, code: string) => {
  getApp(); // Ensure Firebase is initialized
  const credential = PhoneAuthProvider.credential(verificationId, code);
  const userCredential = await signInWithCredential(getAuth(), credential);
  return userCredential.user;
};

export const waitForFirebaseUser = (timeout = 5000): Promise<FirebaseAuthTypes.User | null> =>
  new Promise<FirebaseAuthTypes.User | null>((resolve) => {
    try {
      getApp(); // Ensure Firebase is initialized
    } catch (error) {
      resolve(null);
      return;
    }

    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;

    // If user is already signed in, return immediately
    if (currentUser) {
      resolve(currentUser);
      return;
    }

    // Otherwise, wait for auth state change
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });

    setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, timeout);
  });

export const listenToStylistRequests = async (
  stylistId: number | string,
  callbacks: StylistRequestListenerCallbacks
) => {
  try {
    getApp(); // Ensure Firebase is initialized

    // Wait for Firebase user authentication before setting up listener
    const firebaseUser = await waitForFirebaseUser(5000);
    if (!firebaseUser) {
      if (__DEV__) {
        console.warn('[firebase] Firebase user not authenticated, cannot set up listener');
      }
      callbacks.onError?.(new Error('Firebase user not authenticated'));
      return null;
    }

    const requestsRef = firestore()
      .collection('stylist_requests')
      .doc(String(stylistId))
      .collection('requests')
      .where('status', '==', 'pending');

    const unsubscribe = requestsRef.onSnapshot(
      (snapshot) => {
        // Check for permission denied errors in snapshot
        if (snapshot.metadata.hasPendingWrites && snapshot.empty) {
          // This might indicate a permission issue, but we'll let the error handler catch it
        }

        snapshot.docChanges().forEach((change) => {
          const requestId = change.doc.id;
          const data = change.doc.data() as StylistRequest;

          if (change.type === 'added' || change.type === 'modified') {
            callbacks.onRequestAdded?.(data, requestId);
          } else if (change.type === 'removed') {
            callbacks.onRequestRemoved?.(requestId);
          }
        });

        callbacks.onConnectionChange?.(!snapshot.metadata.fromCache);
      },
      (error: any) => {
        // Handle permission denied errors gracefully
        if (error?.code === 'permission-denied' || error?.code === 'firestore/permission-denied') {
          if (__DEV__) {
            console.warn(
              '[firebase] Firestore permission denied. User may not be authenticated or lacks permissions.'
            );
          }
          // Don't call onError for permission denied - it's expected in some cases
          callbacks.onConnectionChange?.(false);
          return;
        }

        if (__DEV__) {
          console.error('Firestore listener error:', error);
        }
        callbacks.onError?.(error as Error);
        callbacks.onConnectionChange?.(false);
      }
    );

    return unsubscribe;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to set up Firestore listener:', error);
    }
    callbacks.onError?.(error as Error);
    return null;
  }
};

export const uploadImageToStorage = async (
  consultationId: number,
  imageUri: string,
  fileName?: string
): Promise<string> => {
  getApp(); // Ensure Firebase is initialized
  const imageName = fileName || `image_${Date.now()}.jpg`;
  const path = `consultations/${consultationId}/images/${imageName}`;
  const storageRef = storage().ref(path);

  if (imageUri.startsWith('data:image')) {
    // Extract base64 string from data URI (remove "data:image/jpeg;base64," prefix)
    const base64String = imageUri.split(',')[1];
    if (!base64String) {
      throw new Error('Invalid data URI: missing base64 data');
    }

    // Upload base64 string directly using putString
    await storageRef.putString(base64String, 'base64', {
      contentType: 'image/jpeg',
    });
  } else {
    // For file:// or content:// URIs, use putFile
    let uploadUri = imageUri;
    if (imageUri.startsWith('file://')) {
      uploadUri = imageUri.replace('file://', '');
    }
    await storageRef.putFile(uploadUri);
  }

  const downloadURL = await storageRef.getDownloadURL();
  return downloadURL;
};

export const sendMessageToFirestore = async (
  consultationId: number,
  userId: string,
  userName: string,
  isConsultant: boolean,
  messageText?: string,
  imageUri?: string
): Promise<string> => {
  getApp(); // Ensure Firebase is initialized
  const firebaseUser = await waitForFirebaseUser(3000);
  if (!firebaseUser) {
    throw new Error('Firebase user not authenticated');
  }

  let attachmentUrl: string | undefined;
  let messageType: 'text' | 'image' = 'text';

  if (imageUri) {
    if (__DEV__) {
      console.log('[chat] uploading image for consultation', { consultationId, imageUri });
    }

    // Upload image to Firebase Storage and get download URL
    // uploadImageToStorage handles both data URIs and file URIs
    attachmentUrl = await uploadImageToStorage(consultationId, imageUri);
    messageType = 'image';

    if (__DEV__) {
      console.log('[chat] image uploaded, got URL', attachmentUrl);
    }
  }

  const messagesRef = firestore()
    .collection('consultations')
    .doc(String(consultationId))
    .collection('messages');

  const messageData: Record<string, unknown> = {
    user_id: userId,
    user_name: userName,
    message_type: messageType,
    is_read: false,
    is_system_message: false,
    created_at: firestore.FieldValue.serverTimestamp(),
  };

  if (messageText?.trim()) {
    messageData.message = messageText.trim();
  }

  if (attachmentUrl) {
    messageData.attachment_url = attachmentUrl;
  }

  const docRef = await messagesRef.add(messageData);

  try {
    const consultationRef = firestore().collection('consultations').doc(String(consultationId));
    const consultationSnap = await consultationRef.get();

    if (consultationSnap.exists()) {
      const consultationData = consultationSnap.data();
      const currentUnreadConsultant = consultationData?.unread_count_consultant || 0;
      const currentUnreadUser = consultationData?.unread_count_user || 0;

      let lastMessagePreview = '';
      if (messageText?.trim()) {
        lastMessagePreview = messageText.trim();
      } else if (attachmentUrl) {
        lastMessagePreview = isConsultant ? 'You sent an image' : `${userName} sent an image`;
      }

      const updates: Record<string, unknown> = {
        last_message: lastMessagePreview,
        last_message_at: firestore.FieldValue.serverTimestamp(),
        last_message_sender_id: userId,
        updated_at: firestore.FieldValue.serverTimestamp(),
      };

      if (isConsultant) {
        updates.unread_count_user = currentUnreadUser + 1;
      } else {
        updates.unread_count_consultant = currentUnreadConsultant + 1;
      }

      await consultationRef.update(updates);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to update consultation metadata after sending message:', error);
    }
  }

  return docRef.id;
};

export const isFirebaseAvailable = (): boolean => {
  // React Native Firebase auto-initializes from google-services.json
  // If the packages are installed, Firebase is available
  // Runtime errors will occur if google-services.json is missing, but that's handled elsewhere
  return true;
};
