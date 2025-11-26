import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Building, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatRole } from '@/utils/formatters';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Please log in to view your profile</p>
        <Button onClick={() => navigate('/login')} className="bg-black text-white hover:bg-gray-800">
          Login
        </Button>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'approver_level_1': return 'bg-green-100 text-green-800';
      case 'approver_level_2': return 'bg-purple-100 text-purple-800';
      case 'finance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-black">My Profile</h1>
            <p className="text-gray-600">View and manage your account information</p>
          </div>
        </div>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center mb-6">
            <div className="h-24 w-24 bg-black rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">First Name</p>
                <p className="text-black font-medium">{user.first_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Last Name</p>
                <p className="text-black font-medium">{user.last_name}</p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Username</p>
              <p className="text-black font-medium">{user.username}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Email Address</p>
                <p className="text-black font-medium">{user.email}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Role</p>
                <Badge className={getRoleColor(user.role)}>
                  {formatRole(user.role)}
                </Badge>
              </div>
            </div>

            {user.department && (
              <>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Department</p>
                    <p className="text-black font-medium">{user.department}</p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Member Since</p>
                <p className="text-black font-medium">
                  {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-black">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-black">Account Active</p>
              <p className="text-sm text-gray-600">Your account is in good standing</p>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}