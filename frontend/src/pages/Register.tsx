import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Shield, Users, Building, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogoWithText } from '@/components/Logo';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    role: '',
    department: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { auth } = await import('@/services/api');
      await auth.register({
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        username: formData.username
      });
      
      navigate('/login', { 
        state: { message: 'Account created successfully! Please sign in.' }
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
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
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gray-800 opacity-3 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
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

      <div className="flex items-center justify-center px-4 py-6 min-h-screen relative z-10">
        <div className="w-full max-w-lg space-y-6 animate-slide-up">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-500 hover:scale-110 hover:rotate-6 shadow-2xl animate-pulse-glow">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-3 gradient-text">
              Join Our Platform! 🎆
            </h2>
            <p className="text-gray-600 text-lg font-medium">
              Create your account and get started
            </p>
          </div>

          {/* Registration Card */}
          <Card className="glass bg-white/95 backdrop-blur-xl border-2 border-gray-200/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 transform animate-scale-in">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold text-black mb-2">Create Account</CardTitle>
              <CardDescription className="text-gray-600">
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-50/80 backdrop-blur-sm animate-slide-up">
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-black font-semibold text-sm">First Name</Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                      disabled={loading}
                      className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-black font-semibold text-sm">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                      disabled={loading}
                      className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Username and Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-black font-semibold text-sm">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required
                      disabled={loading}
                      className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-black font-semibold text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={loading}
                      className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Role and Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-black font-semibold text-sm">Role</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                      <SelectTrigger className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-white border-2 border-gray-200 shadow-xl rounded-xl">
                        <SelectItem value="staff" className="py-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-black" />
                            <span>Staff Member</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approver_level_1" className="py-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-black" />
                            <span>Approver Level 1</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="approver_level_2" className="py-2">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-black" />
                            <span>Approver Level 2</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="finance" className="py-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-black" />
                            <span>Finance Team</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-black font-semibold text-sm">Department</Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="IT, HR, Finance..."
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      disabled={loading}
                      className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl transition-all duration-300"
                    />
                  </div>
                </div>
                
                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-black font-semibold text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        disabled={loading}
                        className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl pr-10 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-all duration-300"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black font-semibold text-sm">Confirm</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                        disabled={loading}
                        className="h-10 border-2 border-gray-200 focus:border-black focus:ring-4 focus:ring-black/10 rounded-xl pr-10 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black transition-all duration-300"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-black via-gray-800 to-black hover:from-gray-800 hover:via-black hover:to-gray-800 text-white transition-all duration-500 hover:scale-105 transform shadow-xl hover:shadow-2xl relative overflow-hidden group mt-6"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  {loading ? (
                    <div className="flex items-center relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center relative z-10">
                      <UserPlus className="mr-2 h-5 w-5" />
                      <span>Create My Account</span>
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
                  <span className="bg-white px-3 text-gray-500 font-medium">Already have an account?</span>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <Button asChild variant="outline" className="w-full h-11 font-semibold border-2 border-gray-300 hover:border-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
                  <Link to="/login" className="flex items-center justify-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sign In to Existing Account
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