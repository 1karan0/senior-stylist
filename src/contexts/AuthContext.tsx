import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { clearAllActiveChats } from '@/api/chat/useActiveChat';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnbordingCompleted: boolean;
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

  const loginMutation = useLoginApi();
  const verifyEmailMutation = useVerifyEmailApi();

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

      console.log(response, 'response');

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
      const firebaseToken = response.data?.firebase_custom_token;

      if (!token) {
        return { success: false, error: 'Token missing' };
      }

      await Promise.all([storage.setToken(token), storage.setUserData(userData)]);

      setUser(userData);

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
