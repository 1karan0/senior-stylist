import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
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
import { initializeNotifications, deleteFCMTokenFromBackend } from '@/services/notifications';
import { useVersionCheck } from '@/api/app/useVersionCheck';
import DeviceInfo from 'react-native-device-info';
import { clearAllActiveChats } from '@/api/chat/useActiveChat';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnbordingCompleted: boolean;
  forceUpdateRequired: boolean;
  versionCheckMessage: string | null;
  openStoreForUpdate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;

  logout: () => void;
  completeOnbording: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnBordingCompleted, setIsBordingCompleted] = useState(false);
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [versionCheckMessage, setVersionCheckMessage] = useState<string | null>(null);

  const loginMutation = useLoginApi();
  const verifyEmailMutation = useVerifyEmailApi();
  const versionCheckMutation = useVersionCheck();

  //check if user is logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

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
      // 1) Check app version first, while splash screen is visible
      try {
        const currentVersion = DeviceInfo.getVersion(); // Gets native app version (Android: versionName, iOS: CFBundleShortVersionString)
        const res = await versionCheckMutation.mutateAsync({
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          current_version: currentVersion,
        });

        if (res?.data?.force_update_required) {
          setForceUpdateRequired(true);
          setVersionCheckMessage(res.data.message || 'A new version of the app is required.');
          // Stop further auth/loading logic – splash screen can now show a forced-update UI
          setIsLoading(false);
          return;
        } else {
          setForceUpdateRequired(false);
          setVersionCheckMessage(null);
        }
      } catch (error) {
        // If version check fails, allow user to continue using the app
        setForceUpdateRequired(false);
        setVersionCheckMessage(null);
      }

      // 2) Normal auth status check
      const [token, userData, onbordingCompleted] = await Promise.all([
        storage.getToken(),
        storage.getUserData(),
        storage.getOnbordingCompleted(),
      ]);

      if (token && userData) {
        setUser(userData);
        await ensureFirebaseSession();

        // Request notification permissions and register FCM token after restoring session
        initializeNotifications().catch((error) => {
          if (__DEV__) {
            console.warn('[auth] Failed to initialize notifications:', error);
          }
        });
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

      const token = response?.data?.access_token;
      const user = response?.data?.user;
      const firebaseToken = response?.data?.firebase_custom_token;

      if (!token) throw new Error('Token missing in API response');

      await Promise.all([storage.setToken(token), storage.setUserData(user)]);
      setUser(user);

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
      initializeNotifications()
        .then((token) => {
          if (__DEV__) {
            if (token) {
              console.log(
                '[auth] Notifications initialized successfully, token:',
                token.substring(0, 20) + '...'
              );
            } else {
              console.warn('[auth] Notifications initialized but no token obtained');
            }
          }
        })
        .catch((error) => {
          if (__DEV__) {
            console.error('[auth] Failed to initialize notifications:', error);
            console.error('[auth] Notification error details:', {
              message: error?.message,
              code: error?.code,
            });
          }
        });
    } catch (err) {
      throw err;
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const response = await verifyEmailMutation.mutateAsync({ email, code });

      const token = response.data?.access_token;
      const userData = response.data?.user;

      if (!token) {
        return { success: false, error: 'Token missing' };
      }

      await Promise.all([storage.setToken(token), storage.setUserData(userData)]);

      setUser(userData);

      return { success: true };
    } catch (err: any) {
      const message =
        err?.response?.data?.errors?.code?.[0] || err?.message || 'Something went wrong';

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Delete FCM token from Firestore before clearing auth data
      // This prevents notifications from being sent to the wrong user
      // when a different user logs in on the same device
      if (__DEV__) {
        console.log('[auth] Logging out, cleaning up FCM token and active chats...');
      }

      // Get user data BEFORE clearing it (needed for token deletion)
      const userData = await storage.getUserData();
      if (__DEV__) {
        console.log('[auth] User data retrieved for cleanup:', {
          hasUserData: !!userData,
          userId: userData?.id,
        });
      }

      // Delete FCM token and clear active chats
      const [tokenDeleted, chatsCleared] = await Promise.all([
        deleteFCMTokenFromBackend().catch((error) => {
          if (__DEV__) {
            console.error('[auth] Failed to delete FCM token on logout:', error);
            console.error('[auth] Token deletion error details:', {
              message: error?.message,
              code: error?.code,
            });
          }
          return false;
        }),
        clearAllActiveChats().catch((error) => {
          if (__DEV__) {
            console.error('[auth] Failed to clear active chats on logout:', error);
          }
          return false;
        }),
      ]);

      if (__DEV__) {
        console.log('[auth] Cleanup results:', {
          tokenDeleted,
          chatsCleared,
        });
      }

      // Now clear auth data and sign out
      await storage.clearAuthData();
      await signOutFirebase();
      setUser(null);

      if (__DEV__) {
        console.log('[auth] Logout completed');
      }
    } catch (error) {
      console.error('[auth] Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnbording = async () => {
    await storage.setOnbordingCompleted();
    setIsBordingCompleted(true);
  };

  const openStoreForUpdate = async () => {
    const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.seniorstylist'; // TODO: confirm package name
    const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000'; // TODO: replace with real App Store id

    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch {
      // Silently fail; splash/update UI can optionally show an error
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isOnbordingCompleted: isOnBordingCompleted,
    forceUpdateRequired,
    versionCheckMessage,
    openStoreForUpdate,
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
