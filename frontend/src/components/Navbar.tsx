import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogoWithText } from '@/components/Logo';
import { formatRole } from '@/utils/formatters';

export default function Navbar() {
  const { user, logout } = useAuth();

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <nav className="border-b border-payhawk-gray bg-payhawk-dark">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <Link to="/">
                <LogoWithText size="md" />
              </Link>
            </div>
            
            {/* Role-based Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                to="/" 
                className="text-sm text-gray-300 hover:text-payhawk-green transition-colors duration-300"
              >
                Dashboard
              </Link>
              
              {user?.role === 'staff' && (
                <Link 
                  to="/requests/new" 
                  className="text-sm text-gray-300 hover:text-payhawk-green transition-colors duration-300"
                >
                  New Request
                </Link>
              )}
              

              
              {user?.role?.includes('approver') && (
                <Link 
                  to="/approvals" 
                  className="text-sm text-gray-300 hover:text-payhawk-green transition-colors duration-300"
                >
                  Approvals
                </Link>
              )}
              
              {user?.role === 'finance' && (
                <Link 
                  to="/finance" 
                  className="text-sm text-gray-300 hover:text-payhawk-green transition-colors duration-300"
                >
                  Finance
                </Link>
              )}

            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={logout} className="border-payhawk-green text-payhawk-green hover:bg-payhawk-green hover:text-payhawk-darker transition-all duration-300 hover:scale-105">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-payhawk-gray transition-all duration-300 hover:scale-110">
                  <Avatar>
                    <AvatarFallback className="bg-payhawk-green text-payhawk-darker">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-payhawk-dark">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {user?.email}
                    </p>
                    <p className="text-xs text-gray-600">
                      {user?.role && formatRole(user.role)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}