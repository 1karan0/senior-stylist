import React, { createContext, useContext, useState, useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { storage } from '@/services/storage';
import { BASE_URL } from '@/config';
import { useLoginApi } from '@/api/auth/useLogin';
import { useVerifyEmailApi } from '@/api/auth/useVerifyEmail';
import { useLoginWithPhone } from '@/api/auth/useLoginWithPhone';
import { useVerifyPhone } from '@/api/auth/useVerifyPhone';
import { User } from '@/common/types';
import axios from 'axios';
import { fetchFirebaseCustomToken } from '@/api/auth/getFirebaseCustomToken';
import {
  getFirebaseAuth,
  initializeFirebase,
  signInWithFirebaseCustomToken,
  signOutFirebase,
  verifyPhoneOtpCode,
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
  isGuest: boolean;
  isLoading: boolean;
  isOnbordingCompleted: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithPhone: (firebaseId: string) => Promise<void>;
  /**
   * Post-signup (phone): pass `phoneVerificationId` from Firebase SMS.
   * 1) Firebase validates the SMS code on the device.
   * 2) The same code is sent to `/api/verify-email` so your server can record verification / issue tokens.
   */
  verifyEmail: (
    email: string,
    otp: string,
    phoneVerificationId?: string
  ) => Promise<{
    success: boolean;
    error?: string;
    requiresAdminVerification?: boolean;
    user?: User;
  }>;
  verifyPhone: (params: {
    name: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
    firebaseIdToken: string;
    referral?: string;
    isConsultant?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    requiresAdminVerification?: boolean;
    user?: User;
  }>;
  refreshAuthUser: () => Promise<void>;

  logout: () => Promise<void>;
  completeOnbording: () => void;
  continueAsGuest: () => void;
  exitGuest: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnBordingCompleted, setIsBordingCompleted] = useState(false);

  const loginMutation = useLoginApi();
  const verifyEmailMutation = useVerifyEmailApi();
  const loginWithPhoneMutation = useLoginWithPhone();
  const verifyPhoneMutation = useVerifyPhone();

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
      }
      setIsBordingCompleted(onbordingCompleted);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuthUser = async () => {
    const token = await storage.getToken();
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Device-Type': Platform.OS,
          'X-App-Version': '1.0.0',
        },
      });

      const latestUser = res?.data?.data?.user;
      if (!latestUser) return;

      await storage.setUserData(latestUser);
      setUser(latestUser);
    } catch (error) {
      if (__DEV__) {
        console.warn('[auth] Failed to refresh auth user:', error);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await loginMutation.mutateAsync({ email, password });

      console.log('response======>', response);

      const token = response?.data?.access_token;
      const user = response?.data?.user;
      const firebaseToken = response?.data?.firebase_custom_token;
      console.log('response======>', response);
      console.log('token======>', token);
      console.log('user======>', user);
      console.log('firebaseToken======>', firebaseToken);

      if (!token) throw new Error('Token missing in API response');

      await Promise.all([
        storage.setToken(token),
        storage.setUserData(user),
        storage.setPhoneVerifyPromptShown(false),
      ]);
      setUser(user);
      setIsGuest(false);
      console.log('user======>', user);

      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }
    } catch (err) {
      throw err;
    }
  };

  const loginWithPhone = async (firebaseIdToken: string) => {
    try {
      const response = await loginWithPhoneMutation.mutateAsync(firebaseIdToken);

      console.log('loginWithPhone response======>', response);

      const token = response?.data?.access_token;
      const user = response?.data?.user;
      const firebaseToken = response?.data?.firebase_custom_token;

      if (!token) throw new Error('Token missing in API response');

      await Promise.all([
        storage.setToken(token),
        storage.setUserData(user),
        storage.setPhoneVerifyPromptShown(false),
      ]);
      setUser(user);
      setIsGuest(false);

      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }
    } catch (err) {
      throw err;
    }
  };

  const verifyEmail = async (email: string, code: string, phoneVerificationId?: string) => {
    try {
      // Step 1 — Firebase Phone Auth: must succeed before we talk to your API.
      if (phoneVerificationId) {
        initializeFirebase();
        const user = await verifyPhoneOtpCode(phoneVerificationId, code);
        console.log('user--===', user);
      }

      // Step 2 — Backend: send the same OTP + Firebase verification id
      // so the server can validate/link the exact Firebase verification session.
      const response = await verifyEmailMutation.mutateAsync({
        email,
        code,
      });

      const token = response.data?.access_token;
      const userData = response.data?.user;
      const firebaseToken = response.data?.firebase_custom_token;

      // Check if this is a consultant who needs admin verification
      // Consultants don't get access_token until admin verifies them
      if (!token && userData?.role === 'consultant') {
        if (phoneVerificationId) {
          await signOutFirebase();
        }
        return {
          success: true,
          requiresAdminVerification: true,
          user: userData,
        };
      }
      console.log('response======>', response);

      if (!token) {
        if (phoneVerificationId) {
          await signOutFirebase();
        }
        return { success: false, error: 'Token missing' };
      }

      await Promise.all([
        storage.setToken(token),
        storage.setUserData(userData),
        storage.setPhoneVerifyPromptShown(false),
      ]);

      setUser(userData);
      setIsGuest(false);
      console.log('userData======>', userData);

      // Initialize Firebase session
      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }

      return { success: true };
    } catch (err: any) {
      if (phoneVerificationId) {
        try {
          await signOutFirebase();
        } catch {
          /* ignore */
        }
      }
      const message =
        err?.response?.data?.errors?.code?.[0] || err?.message || 'Something went wrong';

      return { success: false, error: message };
    }
  };

  const verifyPhone = async (params: {
    name: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
    firebaseIdToken: string;
    referral?: string;
    isConsultant?: boolean;
  }) => {
    try {
      const response = await verifyPhoneMutation.mutateAsync({
        name: params.name,
        email: params.email,
        phone: params.phone,
        phone_country_code: params.phoneCountryCode,
        firebase_id_token: params.firebaseIdToken,
        referral_code: params.referral,
      });

      const token = response.data?.access_token;
      const userData = response.data?.user;
      const firebaseToken = response.data?.firebase_custom_token;

      // Check if this is a consultant who needs admin verification
      if (!token && userData?.role === 'consultant') {
        return {
          success: true,
          requiresAdminVerification: true,
          user: userData,
        };
      }

      if (!token) {
        return { success: false, error: 'Token missing' };
      }

      await Promise.all([
        storage.setToken(token),
        storage.setUserData(userData),
        storage.setPhoneVerifyPromptShown(false),
      ]);

      setUser(userData);
      setIsGuest(false);

      // Initialize Firebase session
      if (firebaseToken) {
        await initializeFirebase();
        await signInWithFirebaseCustomToken(firebaseToken);
      } else {
        await ensureFirebaseSession();
      }

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
    setIsGuest(false);

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
    if (__DEV__) {
      console.log('[auth] Onboarding completed, initializing notifications...');
    }
    scheduleNotificationsInit();
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
  };

  const exitGuest = async () => {
    setIsGuest(false);
    // Mark onboarding as completed so user is redirected to Login screen, not Onboarding
    await storage.setOnbordingCompleted();
    setIsBordingCompleted(true);
  };

  const value: AuthContextType = {
    user,
    isGuest,
    isLoading,
    isOnbordingCompleted: isOnBordingCompleted,
    login,
    loginWithPhone,
    verifyEmail,
    verifyPhone,
    refreshAuthUser,
    logout,
    completeOnbording,
    continueAsGuest,
    exitGuest,
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
