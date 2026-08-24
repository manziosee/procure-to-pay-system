import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Shield, Building, Calendar, KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auth as authAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatRole } from '@/utils/formatters';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  const [twoFaBusy, setTwoFaBusy] = useState(false);

  const handleStartSetup = async () => {
    setTwoFaError('');
    setTwoFaBusy(true);
    try {
      const response = await authAPI.setupTwoFactor();
      setQrCode(response.data.qr_code_base64);
      setSetupSecret(response.data.secret);
    } catch (error) {
      console.error('Error starting 2FA setup:', error);
      setTwoFaError('Failed to start 2FA setup');
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleConfirmSetup = async () => {
    setTwoFaError('');
    setTwoFaBusy(true);
    try {
      await authAPI.enableTwoFactor(setupCode);
      setQrCode(null);
      setSetupSecret(null);
      setSetupCode('');
      await refreshUser();
    } catch (error: any) {
      setTwoFaError(error.response?.data?.error || 'Invalid code');
    } finally {
      setTwoFaBusy(false);
    }
  };

  const handleDisable = async () => {
    setTwoFaError('');
    setTwoFaBusy(true);
    try {
      await authAPI.disableTwoFactor(disablePassword);
      setShowDisableForm(false);
      setDisablePassword('');
      await refreshUser();
    } catch (error: any) {
      setTwoFaError(error.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setTwoFaBusy(false);
    }
  };

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

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security using an authenticator app (e.g. Google Authenticator)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFaError && (
            <Alert variant="destructive">
              <AlertDescription>{twoFaError}</AlertDescription>
            </Alert>
          )}

          {user.totp_enabled ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-black">2FA is enabled</p>
                  <p className="text-sm text-gray-600">You'll be asked for a code every time you log in</p>
                </div>
                <Badge className="bg-black text-white">Enabled</Badge>
              </div>

              {showDisableForm ? (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <Label htmlFor="disable-password">Confirm your password to disable 2FA</Label>
                  <div className="flex gap-2">
                    <Input
                      id="disable-password"
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                    />
                    <Button variant="destructive" onClick={handleDisable} disabled={twoFaBusy || !disablePassword}>
                      Disable
                    </Button>
                    <Button variant="outline" onClick={() => { setShowDisableForm(false); setDisablePassword(''); setTwoFaError(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowDisableForm(true)}>
                  Disable 2FA
                </Button>
              )}
            </div>
          ) : qrCode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
              </p>
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA setup QR code" className="border border-gray-200 rounded-lg" width={200} height={200} />
              </div>
              {setupSecret && (
                <p className="text-xs text-gray-500 text-center">
                  Can't scan? Enter this key manually: <span className="font-mono">{setupSecret}</span>
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  className="text-center tracking-[0.3em] font-mono"
                  maxLength={6}
                />
                <Button onClick={handleConfirmSetup} disabled={twoFaBusy || setupCode.length !== 6}>
                  Confirm
                </Button>
                <Button variant="outline" onClick={() => { setQrCode(null); setSetupSecret(null); setSetupCode(''); setTwoFaError(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black">2FA is not enabled</p>
                <p className="text-sm text-gray-600">Set it up to better protect your account</p>
              </div>
              <Button onClick={handleStartSetup} disabled={twoFaBusy}>
                Set up 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}