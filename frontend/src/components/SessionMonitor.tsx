import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const SessionMonitor = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const token = localStorage.getItem('token');
      const loginTime = localStorage.getItem('loginTime');
      
      // Check if token exists and is not expired
      if (!token) {
        logout();
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        
        if (isExpired) {
          logout();
          return;
        }
      } catch {
        logout();
        return;
      }

      // Check if session is older than 24 hours (additional security)
      if (loginTime) {
        const sessionAge = Date.now() - parseInt(loginTime);
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge > maxSessionAge) {
          logout();
          return;
        }
      }
    };

    // Check session immediately
    checkSession();

    // Check session every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Check session when page becomes visible (handles copy-paste scenarios)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    // Check session when page gains focus (handles new tab scenarios)
    const handleFocus = () => {
      checkSession();
    };

    // Check session on storage changes (handles multiple tab scenarios)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'currentUser') {
        if (!e.newValue) {
          logout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, logout]);

  return null; // This component doesn't render anything
};