import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
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
    email: '', 
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
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-black opacity-5 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-900 opacity-5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gray-800 opacity-3 rounded-full animate-float" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Back to Home Button */}
      <div className="absolute top-6 left-6 z-20">
        <Button asChild variant="ghost" className="text-gray-600 hover:text-black hover:bg-white/80 backdrop-blur-sm transition-all duration-300 border border-gray-200">
          <Link to="/" className="flex items-center px-4 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center px-4 py-8 min-h-screen relative z-10">
        <div className="w-full max-w-md space-y-6 animate-slide-up">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-6 shadow-2xl animate-pulse-glow">
              <LogIn className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-3 gradient-text">
              Welcome Back! 
              <span className="inline-block ml-2 text-4xl hover:animate-bounce cursor-pointer select-text" title="Rocket emoji - click to select">
                🚀
              </span>
            </h2>
            <p className="text-gray-600 text-lg font-medium">
              Access your procurement dashboard
            </p>
          </div>

          {/* Login Card */}
          <Card className="glass bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform animate-scale-in">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-black mb-2 flex items-center justify-center">
                <div className="h-6 w-6 bg-black rounded-full flex items-center justify-center mr-2">
                  📊
                </div>
                Access Dashboard
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {successMessage && (
                <Alert className="mb-4 border-green-200 bg-green-50/80 backdrop-blur-sm animate-slide-up">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700 font-medium">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-50/80 backdrop-blur-sm animate-slide-up">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-semibold">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                    required
                    disabled={loading}
                    className="form-input h-11 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                      required
                      disabled={loading}
                      className="form-input h-11 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl pr-12 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-all duration-300"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-black via-gray-800 to-black hover:from-gray-800 hover:via-black hover:to-gray-800 text-white transition-all duration-500 hover:scale-105 transform shadow-xl hover:shadow-2xl relative overflow-hidden group"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {loading ? (
                    <div className="flex items-center relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Signing you in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center relative z-10">
                      <LogIn className="mr-2 h-5 w-5" />
                      <span>Enter Dashboard</span>
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-gray-500 font-medium">New to our platform?</span>
                </div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <Button asChild variant="outline" className="w-full h-11 font-semibold border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
                  <Link to="/register" className="flex items-center justify-center">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create New Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center space-y-3 animate-slide-up">
            <div className="flex justify-center">
              <LogoWithText size="sm" />
            </div>
            <p className="text-gray-500 text-sm">
              🔒 Secure • 🚀 Professional • ⚡ Efficient
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}