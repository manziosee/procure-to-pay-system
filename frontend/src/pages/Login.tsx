import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, CheckCircle, TriangleAlert, ShieldCheck } from 'lucide-react';
import { useAuth, RequiresTwoFactorError } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell } from '@/components/AuthShell';

export default function Login() {
  const location = useLocation();
  const successMessage = location.state?.message;

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { login, verifyTwoFactor } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(credentials);
    } catch (err: any) {
      if (err instanceof RequiresTwoFactorError) {
        setTwoFactorChallenge(err.challenge);
        return;
      }
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge) return;
    setLoading(true);
    setError('');

    try {
      await verifyTwoFactor(twoFactorChallenge, twoFactorCode);
    } catch (err: any) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (twoFactorChallenge) {
    return (
      <AuthShell
        icon={ShieldCheck}
        title="Two-factor authentication"
        subtitle="Enter the 6-digit code from your authenticator app"
        footer={<p className="text-gray-400 text-xs">Secure, role-based access for every team</p>}
      >
        {error && (
          <Alert variant="destructive" className="mb-5">
            <TriangleAlert className="h-4 w-4" />
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="totp-code">Authentication code</Label>
            <Input
              id="totp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              required
              disabled={loading}
              className="h-11 text-center tracking-[0.3em] font-mono"
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 font-semibold bg-black hover:bg-gray-800 text-white"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white mr-2" />
                Verifying…
              </div>
            ) : (
              <>Verify</>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTwoFactorChallenge(null);
              setTwoFactorCode('');
              setError('');
            }}
            disabled={loading}
          >
            Back to login
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      icon={LogIn}
      title="Sign in"
      subtitle="Access your procurement dashboard"
      footer={<p className="text-gray-400 text-xs">Secure, role-based access for every team</p>}
    >
      {successMessage && (
        <Alert className="mb-5 border-gray-200 bg-gray-50">
          <CheckCircle className="h-4 w-4 text-black" />
          <AlertDescription className="text-gray-800 font-medium">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-5">
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            required
            disabled={loading}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              disabled={loading}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold bg-black hover:bg-gray-800 text-white"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/40 border-t-white mr-2" />
              Signing in…
            </div>
          ) : (
            <>Sign in</>
          )}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">New here?</span>
        </div>
      </div>

      <Button asChild variant="outline" className="w-full h-11 font-medium border-gray-300 hover:border-black hover:bg-black hover:text-white">
        <Link to="/register">Create an account</Link>
      </Button>
    </AuthShell>
  );
}
