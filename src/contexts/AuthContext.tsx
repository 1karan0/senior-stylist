import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { User, AuthContextValue } from '@/common/types';
import { setStorageItem, removeItem } from '@/services/storage';



const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const MOCK_USER = (email: string): User => ({
  id: '1',
  name: 'Test User',
  email,
  token: 'mock-token',
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<User['token'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true);
    try {
      await new Promise<void>(resolve => setTimeout(resolve, 500));
      const mockUser = MOCK_USER(email);
      setUser(mockUser);
      setToken(mockUser.token);
      setIsAuthenticated(true);
      await setStorageItem('auth_token', mockUser.token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
    await removeItem('auth_token');
  }, [setIsAuthenticated, setUser, setToken]);

  const value: AuthContextValue = {
    isAuthenticated,
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
