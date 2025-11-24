import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginCredentials } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogoWithText } from '@/components/Logo';
import { TriangleAlert, CheckCircle } from 'lucide-react';

export default function Login() {
  const location = useLocation();
  const successMessage = location.state?.message;
  
  const [credentials, setCredentials] = useState<LoginCredentials>({ 
    username: '', 
    password: '' 
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(credentials);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-12 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-black rounded-full flex items-center justify-center mb-8 transform transition-all duration-300 hover:scale-110 hover:rotate-12">
              <LogIn className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-3">
              Welcome Back
            </h2>
            <p className="text-gray-600 text-lg">
              Sign in to your Procure-to-Pay account
            </p>
          </div>

          <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 transform">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-semibold text-black">Sign In</CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {successMessage && (
                <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-black font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                    required
                    disabled={loading}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      required
                      disabled={loading}
                      className="h-12 border-gray-300 focus:border-black focus:ring-black pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-colors duration-200"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold transition-all duration-300 hover:scale-105 transform"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                New to Procure2Pay?{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>



          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-black hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}