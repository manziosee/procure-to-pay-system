import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, Shield, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-center px-4 py-8 min-h-screen">
        <div className="w-full max-w-lg space-y-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-black rounded-full flex items-center justify-center mb-8">
              <UserPlus className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-3">
              Join Us Today
            </h2>
            <p className="text-gray-600 text-lg">
              Create your Procure-to-Pay account
            </p>
          </div>

          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-semibold text-black">Create Account</CardTitle>
              <CardDescription className="text-gray-600">
                Fill in your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-black font-medium">First Name</Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      required
                      disabled={loading}
                      className="h-11 border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-black font-medium">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      required
                      disabled={loading}
                      className="h-11 border-gray-300 focus:border-black focus:ring-black"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-black font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    required
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-black font-medium">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger className="h-11 border-gray-300 focus:border-black focus:ring-black">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-white border border-gray-300 shadow-lg">
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-black" />
                          Staff Member
                        </div>
                      </SelectItem>
                      <SelectItem value="approver_level_1">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-black" />
                          Approver Level 1
                        </div>
                      </SelectItem>
                      <SelectItem value="approver_level_2">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-black" />
                          Approver Level 2
                        </div>
                      </SelectItem>
                      <SelectItem value="finance">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-black" />
                          Finance Team
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-black font-medium">Department</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="IT, HR, Finance, etc."
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    disabled={loading}
                    className="h-11 border-gray-300 focus:border-black focus:ring-black"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      disabled={loading}
                      className="h-11 pr-12 border-gray-300 focus:border-black focus:ring-black"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      required
                      disabled={loading}
                      className="h-11 pr-12 border-gray-300 focus:border-black focus:ring-black"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent text-gray-400 hover:text-gray-600"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white font-semibold mt-6 transition-all duration-300 hover:scale-105 transform shadow-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Create Account
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-black hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}