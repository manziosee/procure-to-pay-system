import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      const response = await authAPI.login({
        email: credentials.email,
        password: credentials.password
      });
      
      const userData = response.user;
      localStorage.setItem('currentUser', JSON.stringify(userData));
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