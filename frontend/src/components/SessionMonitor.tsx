import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth as authAPI, getAccessToken } from '@/services/api';

export const SessionMonitor = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkSession = async () => {
      const token = getAccessToken();
      const loginTime = localStorage.getItem('loginTime');

      const isExpired = (t: string) => {
        try {
          const payload = JSON.parse(atob(t.split('.')[1]));
          return payload.exp * 1000 < Date.now();
        } catch {
          return true;
        }
      };

      // Access token lives in memory and expires quickly (15 min) - try to silently
      // refresh it via the httpOnly cookie before giving up on the session.
      if (!token || isExpired(token)) {
        try {
          await authAPI.refreshToken();
        } catch {
          logout();
          return;
        }
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
      if (e.key === 'currentUser' && !e.newValue) {
        logout();
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