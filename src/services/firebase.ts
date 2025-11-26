import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  User,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
// @ts-ignore - the type definitions sometimes miss this helper but it exists at runtime.
import { getReactNativePersistence } from 'firebase/auth';
import {
  DocumentData,
  Firestore,
  Unsubscribe,
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { FirebaseStorage, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

import { FIREBASE_CONFIG } from '@/config/firebase';

let firebaseApp: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;

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
}

export interface StylistRequestListenerCallbacks {
  onRequestAdded?: (request: StylistRequest, requestId: string) => void;
  onRequestRemoved?: (requestId: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
}

const buildFirebaseConfig = (): FirebaseOptions | null => {
  const config = FIREBASE_CONFIG;
  const isConfigured = Object.values(config).every((value) => value && value.length > 0);

  if (!isConfigured) {
    if (__DEV__) {
      console.warn('Firebase configuration is incomplete. Please update FIREBASE_CONFIG.');
    }
    return null;
  }

  return config;
};

export const initializeFirebase = (): FirebaseApp | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const options = buildFirebaseConfig();
  if (!options) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(options);
    } else {
      firebaseApp = getApp();
    }

    firestoreInstance = getFirestore(firebaseApp);

    try {
      authInstance = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch (error: any) {
      if (error.code === 'auth/already-initialized') {
        authInstance = getAuth(firebaseApp);
      } else {
        authInstance = getAuth(firebaseApp);
      }
    }

    storageInstance = getStorage(firebaseApp);
    return firebaseApp;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to initialize Firebase:', error);
    }
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  if (authInstance) {
    return authInstance;
  }

  const app = initializeFirebase();
  if (!app) {
    return null;
  }

  authInstance = getAuth(app);
  return authInstance;
};

export const getFirestoreInstance = (): Firestore | null => {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const app = initializeFirebase();
  if (!app) {
    return null;
  }

  firestoreInstance = getFirestore(app);
  return firestoreInstance;
};

export const getFirebaseStorage = (): FirebaseStorage | null => {
  if (storageInstance) {
    return storageInstance;
  }

  const app = initializeFirebase();
  if (!app) {
    return null;
  }

  storageInstance = getStorage(app);
  return storageInstance;
};

export const signInWithFirebaseCustomToken = async (customToken: string): Promise<User | null> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Auth not initialized');
  }

  const credential = await signInWithCustomToken(auth, customToken);
  return credential.user;
};

export const signOutFirebase = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    return;
  }

  try {
    await signOut(auth);
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to sign out from Firebase:', error);
    }
  }
};

export const waitForFirebaseUser = (timeout = 5000): Promise<User | null> =>
  new Promise((resolve) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      resolve(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
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

export const listenToStylistRequests = (
  stylistId: number | string,
  callbacks: StylistRequestListenerCallbacks
): Unsubscribe | null => {
  const firestore = getFirestoreInstance();
  if (!firestore) {
    callbacks.onError?.(new Error('Firestore not initialized'));
    return null;
  }

  try {
    const requestsRef = collection(firestore, 'stylist_requests', String(stylistId), 'requests');
    const q = query(requestsRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
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
      (error) => {
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
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  const response = await fetch(imageUri);
  const blob = await response.blob();

  const imageName = fileName || `image_${Date.now()}.jpg`;
  const storageRef = ref(storage, `consultations/${consultationId}/images/${imageName}`);

  await uploadBytes(storageRef, blob);
  const downloadURL = await getDownloadURL(storageRef);
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
  const firestore = getFirestoreInstance();
  if (!firestore) {
    throw new Error('Firestore not initialized');
  }

  const firebaseUser = await waitForFirebaseUser(3000);
  if (!firebaseUser) {
    throw new Error('Firebase user not authenticated');
  }

  let attachmentUrl: string | undefined;
  let messageType: 'text' | 'image' = 'text';

  if (imageUri) {
    attachmentUrl = await uploadImageToStorage(consultationId, imageUri);
    messageType = 'image';
  }

  const messagesRef = collection(firestore, 'consultations', String(consultationId), 'messages');
  const messageData: Record<string, unknown> = {
    user_id: userId,
    user_name: userName,
    message_type: messageType,
    is_read: false,
    is_system_message: false,
    created_at: serverTimestamp(),
  };

  if (messageText?.trim()) {
    messageData.message = messageText.trim();
  }

  if (attachmentUrl) {
    messageData.attachment_url = attachmentUrl;
  }

  const docRef = await addDoc(messagesRef, messageData as DocumentData);

  try {
    const consultationRef = doc(firestore, 'consultations', String(consultationId));
    const consultationSnap = await getDoc(consultationRef);

    if (consultationSnap.exists()) {
      const consultationData = consultationSnap.data();
      const currentUnreadConsultant = consultationData.unread_count_consultant || 0;
      const currentUnreadUser = consultationData.unread_count_user || 0;

      let lastMessagePreview = '';
      if (messageText?.trim()) {
        lastMessagePreview = messageText.trim();
      } else if (attachmentUrl) {
        lastMessagePreview = isConsultant ? 'You sent an image' : `${userName} sent an image`;
      }

      const updates: Record<string, unknown> = {
        last_message: lastMessagePreview,
        last_message_at: serverTimestamp(),
        last_message_sender_id: userId,
        updated_at: serverTimestamp(),
      };

      if (isConsultant) {
        updates.unread_count_user = currentUnreadUser + 1;
      } else {
        updates.unread_count_consultant = currentUnreadConsultant + 1;
      }

      await updateDoc(consultationRef, updates);
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('Failed to update consultation metadata after sending message:', error);
    }
  }

  return docRef.id;
};

export const isFirebaseAvailable = (): boolean => buildFirebaseConfig() !== null;
