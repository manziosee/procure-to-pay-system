import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User, LoginCredentials } from '@/types';
import { auth as authAPI, getAccessToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
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

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authAPI.login({
        email: credentials.email,
        password: credentials.password
      });
      
      const userData = response.user;
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid credentials');
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
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};