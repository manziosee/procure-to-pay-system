import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User, LoginCredentials } from '@/types';
import { auth as authAPI } from '@/services/api';

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

// Mock users for demo
const mockUsers: Record<string, User> = {
  staff: {
    id: 1,
    username: 'staff',
    email: 'staff@example.com',
    first_name: 'John',
    last_name: 'Staff',
    role: 'staff',
    department: 'Operations'
  },
  approver1: {
    id: 2,
    username: 'approver1',
    email: 'approver1@example.com',
    first_name: 'Jane',
    last_name: 'Approver',
    role: 'approver_level_1',
    department: 'Management'
  },
  approver2: {
    id: 3,
    username: 'approver2',
    email: 'approver2@example.com',
    first_name: 'Bob',
    last_name: 'Manager',
    role: 'approver_level_2',
    department: 'Management'
  },
  finance: {
    id: 4,
    username: 'finance',
    email: 'finance@example.com',
    first_name: 'Alice',
    last_name: 'Finance',
    role: 'finance',
    department: 'Finance'
  }
};

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

  // Validate session on app load and route changes
  const validateSession = async () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!token || !savedUser || isTokenExpired(token)) {
      // Clear invalid session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Verify token with backend
      await authAPI.getProfile();
      setUser(JSON.parse(savedUser));
    } catch (error) {
      // Token invalid, clear session
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
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
        const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
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