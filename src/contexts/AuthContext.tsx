import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '@/services/storage';
import { useLoginApi } from '@/api/auth/useLogin';
import { useVerifyEmailApi } from '@/api/auth/useVerifyEmail';
import { User } from '@/common/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isOnbordingCompleted: boolean;
  login: (email: string, password: string) => void;
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

  const checkAuthStatus = async () => {
    try {
      const [token, userData, onbordingCompleted] = await Promise.all([
        storage.getToken(),
        storage.getUserData(),
        storage.getOnbordingCompleted(),
      ]);

      if (token && userData) {
        setUser(userData);
      }
      setIsBordingCompleted(onbordingCompleted);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await loginMutation.mutateAsync({ email, password });

      const token = response.data?.access_token;
      const user = response.data?.user;

      if (!token) {
        throw new Error('Token missing in API response');
      }

      await Promise.all([storage.setToken(token), storage.setUserData(user)]);

      setUser(user);
    } catch (err) {
      console.log('Login API error:', err);
      throw err;
    } finally {
      setIsLoading(false);
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
        err?.response?.data?.errors?.code?.[0] ||
        err?.response?.data?.message ||
        'Something went wrong';

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await storage.clearAuthData();
      setUser(null);
    } catch (error) {
      console.log('Logout error:', error);
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
