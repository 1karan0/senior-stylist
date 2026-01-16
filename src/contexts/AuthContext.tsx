import React, { createContext, useContext, useState, useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { storage } from '@/services/storage';
import { useLoginApi } from '@/api/auth/useLogin';
import { useVerifyEmailApi } from '@/api/auth/useVerifyEmail';
import { User } from '@/common/types';
import { fetchFirebaseCustomToken } from '@/api/auth/getFirebaseCustomToken';
import {
  getFirebaseAuth,
  initializeFirebase,
  signInWithFirebaseCustomToken,
  signOutFirebase,
} from '@/services/firebase';
import {
  initializeNotifications,
  deleteFCMTokenForUser,
  clearLocalFCMToken,
} from '@/services/notifications';
import { clearAllActiveChatsForUser } from '@/api/chat/useActiveChat';

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`[auth] Timeout: ${label} after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnbordingCompleted: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (
    email: string,
    otp: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresAdminVerification?: boolean;
    user?: User;
  }>;

  logout: () => Promise<void>;
  completeOnbording: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnBordingCompleted, setIsBordingCompleted] = useState(false);

  const loginMutation = useLoginApi();
  const verifyEmailMutation = useVerifyEmailApi();

  //check if user is logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const scheduleNotificationsInit = () => {
    // On iOS (especially TestFlight/Release), requesting permissions during navigation transitions
    // can fail to show the system prompt. Defer until after interactions and a short delay.
    InteractionManager.runAfterInteractions(() => {
      const delayMs = Platform.OS === 'ios' ? 800 : 0;
      setTimeout(() => {
        initializeNotifications().catch((error) => {
          if (__DEV__) {
            console.warn('[auth] Failed to initialize notifications:', error);
          }
        });
      }, delayMs);
    });
  };

  const ensureFirebaseSession = async () => {
    try {
      const app = initializeFirebase();
      if (!app) {
        return;
      }

      const auth = getFirebaseAuth();
      if (auth?.currentUser) {
        return;
      }

      const customToken = await fetchFirebaseCustomToken();
      if (customToken) {
        await signInWithFirebaseCustomToken(customToken);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to restore Firebase session:', error);
      }
    }
  };

  const checkAuthStatus = async () => {
    try {
      const [token, userData, onbordingCompleted] = await Promise.all([
        storage.getToken(),
        storage.getUserData(),
        storage.getOnbordingCompleted(),
      ]);

      if (token && userData) {
        setUser(userData);
        await ensureFirebaseSession();

        // Request notification permissions and register FCM token after restoring session
        scheduleNotificationsInit();
      }
      setIsBordingCompleted(onbordingCompleted);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await loginMutation.mutateAsync({ email, password });

      console.log('response======>', response);

      const token = response?.data?.access_token;
      const user = response?.data?.user;
      const firebaseToken = response?.data?.firebase_custom_token;

      if (!token) throw new Error('Token missing in API response');

      await Promise.all([storage.setToken(token), storage.setUserData(user)]);
      setUser(user);
      console.log('user======>', user);

      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }

      // Request notification permissions and register FCM token after successful login
      if (__DEV__) {
        console.log('[auth] User logged in, initializing notifications...');
      }
      scheduleNotificationsInit();
    } catch (err) {
      throw err;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await verifyEmailMutation.mutateAsync({ email, code });

      const token = response.data?.access_token;
      const userData = response.data?.user;
      const firebaseToken = response.data?.firebase_custom_token;

      // Check if this is a consultant who needs admin verification
      // Consultants don't get access_token until admin verifies them
      if (!token && userData?.role === 'consultant') {
        return {
          success: true,
          requiresAdminVerification: true,
          user: userData,
        };
      }
      console.log('response======>', response);

      if (!token) {
        return { success: false, error: 'Token missing' };
      }

      await Promise.all([storage.setToken(token), storage.setUserData(userData)]);

      setUser(userData);
      console.log('userData======>', userData);

      // Initialize Firebase session
      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }

      // Request notification permissions and register FCM token after successful email verification
      if (__DEV__) {
        console.log('[auth] Email verified, initializing notifications...');
      }
      scheduleNotificationsInit();

      return { success: true };
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.code?.[0] || err?.message || 'Something went wrong';

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    // IMPORTANT: Never block logout UI on networked Firestore calls.
    // If Firestore hangs (common on flaky iOS networks), Promise.all can hang forever and the app
    // gets stuck on the loading spinner ("can't logout"). We log out locally first, then do best-effort cleanup.
    setIsLoading(true);

    // Capture userId for best-effort cleanup BEFORE storage is cleared.
    const userData = await storage.getUserData().catch(() => null);
    const userId: string | null = userData?.id ? String(userData.id) : null;

    // Log out locally immediately so navigation can switch to AuthStack.
    setUser(null);

    // Best-effort cleanup (bounded by timeouts so we never hang the JS thread).
    const cleanupTasks: Promise<unknown>[] = [];
    if (userId) {
      cleanupTasks.push(
        withTimeout(deleteFCMTokenForUser(userId), 2500, 'deleteFCMTokenForUser').catch((error) => {
          if (__DEV__)
            console.warn('[auth] deleteFCMTokenForUser failed:', error?.message || error);
        })
      );
      cleanupTasks.push(
        withTimeout(clearAllActiveChatsForUser(userId), 2500, 'clearAllActiveChatsForUser').catch(
          (error) => {
            if (__DEV__)
              console.warn('[auth] clearAllActiveChatsForUser failed:', error?.message || error);
          }
        )
      );
    }
    cleanupTasks.push(
      withTimeout(clearLocalFCMToken(), 2000, 'clearLocalFCMToken').catch((error) => {
        if (__DEV__) console.warn('[auth] clearLocalFCMToken failed:', error?.message || error);
      })
    );
    if (cleanupTasks.length > 0) {
      await Promise.allSettled(cleanupTasks);
    }

    // Clear local auth state with short timeouts (these should be fast; if they hang, still finish logout).
    try {
      await withTimeout(storage.clearAuthData(), 1500, 'storage.clearAuthData');
    } catch (error) {
      if (__DEV__) console.warn('[auth] clearAuthData timeout/failure:', error);
    }

    try {
      await withTimeout(signOutFirebase(), 1500, 'signOutFirebase');
    } catch (error) {
      if (__DEV__) console.warn('[auth] signOutFirebase timeout/failure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnbording = async () => {
    await storage.setOnbordingCompleted();
    setIsBordingCompleted(true);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isOnbordingCompleted: isOnBordingCompleted,
    login,
    verifyEmail,
    logout,
    completeOnbording,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an Authprovider');
  }
  return context;
};
