import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User, LoginCredentials } from '@/types';
import { auth as authAPI, getAccessToken } from '@/services/api';

// Thrown by login() when the account has 2FA enabled, instead of completing the
// login. Carries the short-lived challenge that verifyTwoFactor() needs.
export class RequiresTwoFactorError extends Error {
  challenge: string;
  constructor(challenge: string) {
    super('Two-factor authentication code required');
    this.name = 'RequiresTwoFactorError';
    this.challenge = challenge;
  }
}

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  verifyTwoFactor: (challenge: string, code: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Validate session on app load. The access token lives only in memory, so a page
  // reload always starts with none - use the httpOnly refresh cookie to get a fresh
  // one before trusting the locally cached user profile.
  const validateSession = async () => {
    const savedUser = localStorage.getItem('currentUser');

    if (!savedUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      await authAPI.refreshToken();
      await authAPI.getProfile();
      setUser(JSON.parse(savedUser));
    } catch (error) {
      // No valid refresh cookie (or backend rejected it), clear the cached session
      localStorage.removeItem('currentUser');
      localStorage.removeItem('loginTime');
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    validateSession();
  }, []);

  // Check session on visibility change (tab switch/copy-paste)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const token = getAccessToken();
        if (!token || isTokenExpired(token)) {
          logout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const finishLogin = (userData: User): User => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(userData);
    return userData;
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    let response;
    try {
      response = await authAPI.login({
        email: credentials.email,
        password: credentials.password
      });
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
    }

    if (response.requires_2fa) {
      throw new RequiresTwoFactorError(response.challenge);
    }

    return finishLogin(response.user);
  };

  const verifyTwoFactor = async (challenge: string, code: string): Promise<User> => {
    try {
      const response = await authAPI.verifyTwoFactor(challenge, code);
      return finishLogin(response.user);
    } catch (error) {
      console.error('2FA verification error:', error);
      throw new Error('Invalid code');
    }
  };

  // Re-fetches the current user (e.g. after enabling/disabling 2FA) and updates
  // both state and the locally cached copy used to restore the session on reload.
  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      finishLogin(response.data);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('loginTime');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    verifyTwoFactor,
    logout,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};