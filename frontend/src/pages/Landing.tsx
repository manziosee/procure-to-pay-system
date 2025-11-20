import { Link } from 'react-router-dom';
import { 
  CheckCircle, 
  FileText, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogoWithText } from '@/components/Logo';

export default function Landing() {
  const features = [
    {
      icon: FileText,
      title: 'Smart Request Management',
      description: 'Create and track purchase requests with automated document processing and AI-powered validation.',
    },
    {
      icon: Users,
      title: 'Multi-Level Approvals',
      description: 'Streamlined approval workflows with role-based access control and real-time notifications.',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with complete audit trails and compliance tracking.',
    },
    {
      icon: Zap,
      title: 'Automated Processing',
      description: 'AI-powered document extraction and automatic purchase order generation.',
    },
    {
      icon: TrendingUp,
      title: 'Analytics & Insights',
      description: 'Real-time dashboards and comprehensive reporting for better decision making.',
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce processing time by 70% with automated workflows and smart validations.',
    },
  ];

  const benefits = [
    'Reduce procurement cycle time by up to 70%',
    'Eliminate manual data entry errors',
    'Complete visibility into spending',
    'Automated compliance checks',
    'Real-time approval tracking',
    'Seamless integration with existing systems',
  ];

  const stats = [
    { value: '70%', label: 'Faster Processing' },
    { value: '99.9%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'Availability' },
    { value: '100+', label: 'Happy Clients' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <LogoWithText size="md" />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" asChild className="text-black hover:bg-gray-100 transition-all duration-300 hover:scale-105">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black animate-fade-in">
              Streamline Your{' '}
              <span className="text-black relative">
                <span className="relative z-10">Procurement Process</span>
                <span className="absolute inset-0 bg-gray-200 transform scale-x-0 origin-left transition-transform duration-500 hover:scale-x-100 -z-10"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto transform transition-all duration-500 hover:text-black">
              Transform your procure-to-pay workflow with intelligent automation, 
              multi-level approvals, and real-time insights. Save time, reduce errors, 
              and gain complete visibility.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl transform">
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform transition-all duration-300 hover:scale-110 hover:-translate-y-2">
                <div className="text-4xl font-bold text-black mb-2 transition-colors duration-300 hover:text-gray-600">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
              Everything You Need to Manage Procurement
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to simplify your entire procure-to-pay process
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all duration-300 hover:scale-105 hover:shadow-xl transform bg-white">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4 transition-all duration-300 hover:bg-black hover:text-white group">
                    <feature.icon className="h-6 w-6 text-black group-hover:text-white transition-colors duration-300" />
                  </div>
                  <CardTitle className="text-black">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">
                Why Choose Procure2Pay?
              </h2>
              <p className="text-xl text-gray-600">
                Join hundreds of companies streamlining their procurement
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-lg transform hover:border-black">
                  <CheckCircle className="h-6 w-6 text-black flex-shrink-0 mt-0.5 transition-transform duration-300 hover:scale-110" />
                  <span className="text-lg text-black">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-black transition-all duration-500 hover:scale-105 transform hover:shadow-2xl">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-bold text-black">
                Ready to Transform Your Procurement?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Start your free trial today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild className="text-lg bg-black text-white hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-xl transform group">
                  <Link to="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg border-black text-black hover:bg-black hover:text-white transition-all duration-300 hover:scale-105">
                  <Link to="/login">Sign In to Your Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <LogoWithText size="sm" />
            </div>
            <p className="text-sm text-gray-600 hover:text-black transition-colors duration-300">
              © 2024 Procure2Pay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}