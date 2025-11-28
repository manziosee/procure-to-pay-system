import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const RoleBasedRoute = ({ 
  allowedRoles, 
  redirectTo = '/unauthorized' 
}: RoleBasedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} />;
  }

  return <Outlet />;
};