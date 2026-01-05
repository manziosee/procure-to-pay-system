import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Users, 
  BarChart3,
  Shield, 
  Zap,
  ArrowRight,
  Clock,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/Logo';

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const features = [
    {
      icon: FileText,
      title: 'Smart Request Management',
      description: 'Create and track purchase requests with automated document processing and AI-powered validation.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
    },
    {
      icon: Users,
      title: 'Multi-Level Approvals',
      description: 'Streamlined approval workflows with role-based access control and real-time notifications.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with complete audit trails and compliance tracking.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
    },
    {
      icon: Zap,
      title: 'Automated Processing',
      description: 'AI-powered document extraction and automatic purchase order generation.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Real-time dashboards and comprehensive reporting for better decision making.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
    },
    {
      icon: Clock,
      title: 'Save Time',
      description: 'Reduce processing time by 70% with automated workflows and smart validations.',
      color: 'text-payhawk-green',
      bg: 'bg-payhawk-light'
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
    { value: '70%', label: 'Faster Processing', icon: Zap },
    { value: '99.9%', label: 'Accuracy Rate', icon: CheckCircle2 },
    { value: '24/7', label: 'Availability', icon: Clock },
  ];
  
  const ctaCards = [
    {
      title: 'Start Free Trial',
      description: 'Try our platform free for 14 days, no credit card required.',
      buttonText: 'Start Free Trial',
      icon: ArrowRight,
      variant: 'default'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className={`fixed w-full backdrop-blur-sm border-b z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 border-gray-200' 
          : 'bg-black/95 border-white/20'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className={`flex items-center gap-3 transition-colors duration-300`}>
                  <svg
                    width={56}
                    height={56}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="50" cy="50" r="48" stroke={isScrolled ? "#000000" : "#ffffff"} strokeWidth="3" fill="none" />
                    <path
                      d="M25 30 L25 70 L45 70 L45 30 Z"
                      stroke={isScrolled ? "#000000" : "#ffffff"}
                      strokeWidth="2.5"
                      fill="none"
                    />
                    <line x1="28" y1="38" x2="42" y2="38" stroke={isScrolled ? "#000000" : "#ffffff"} strokeWidth="2" />
                    <line x1="28" y1="45" x2="42" y2="45" stroke={isScrolled ? "#000000" : "#ffffff"} strokeWidth="2" />
                    <line x1="28" y1="52" x2="42" y2="52" stroke={isScrolled ? "#000000" : "#ffffff"} strokeWidth="2" />
                    <path
                      d="M48 50 L60 50"
                      stroke={isScrolled ? "#000000" : "#ffffff"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M56 45 L60 50 L56 55"
                      stroke={isScrolled ? "#000000" : "#ffffff"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <circle cx="72" cy="50" r="12" stroke={isScrolled ? "#000000" : "#ffffff"} strokeWidth="2.5" fill="none" />
                    <path
                      d="M67 50 L70 53 L77 46"
                      stroke={isScrolled ? "#000000" : "#ffffff"}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className={`font-bold leading-tight text-3xl transition-colors duration-300 ${
                      isScrolled ? 'text-black' : 'text-white'
                    }`}>
                      Procure<span className={isScrolled ? 'text-black' : 'text-white'}>2</span>Pay
                    </span>
                    <span className={`text-xs leading-tight transition-colors duration-300 ${
                      isScrolled ? 'text-gray-600' : 'text-gray-300'
                    }`}>
                      Smart Procurement System
                    </span>
                  </div>
                </div>
              </Link>
              <nav className="ml-10 hidden space-x-8 lg:block">
                <a href="#features" className={`text-sm font-medium transition-colors ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-black' 
                    : 'text-gray-300 hover:text-white'
                }`}>Features</a>
              </nav>
            </div>
            <div className="flex justify-center pt-2">
              <Button asChild className={`h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                isScrolled 
                  ? 'bg-black hover:bg-gray-800 text-white' 
                  : 'bg-white hover:bg-gray-100 text-black'
              }`}>
                <Link to="/login" className="flex items-center">
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 bg-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)] animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-display tracking-tight text-white mb-4">
                The all-in-one
                <span className="relative inline-block ml-3">
                  <span className="text-white">
                    procurement platform
                  </span>
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-white rounded-full animate-scale-x"></div>
                </span>
              </h1>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <p className="text-xl font-body text-gray-300 max-w-2xl mx-auto">
                Automate your procurement workflow with our AI-powered platform. 
                <span className="text-white font-semibold">Save time, reduce costs</span>, and gain complete control.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <Button size="lg" asChild className="bg-white text-black hover:bg-gray-100 font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 animate-bounce-x" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-white text-white hover:bg-white hover:text-black backdrop-blur-sm font-semibold transform hover:scale-105 transition-all duration-300">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={`stat-${stat.label}-${index}`} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
                  <div className="flex items-center mb-3">
                    <div className="p-3 rounded-full bg-black text-white mr-4 animate-pulse">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-black">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-display text-black mb-4">
              Powerful Features for 
              <span className="text-gray-600">
                Modern Procurement
              </span>
            </h2>
            <p className="text-lg font-body text-gray-600">Essential tools that transform your procurement workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 6).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={`feature-${feature.title}-${index}`} className="group p-6 rounded-xl border border-gray-200 hover:border-black bg-white hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4 group-hover:animate-bounce">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-heading text-black mb-3 group-hover:text-gray-800 transition-colors">{feature.title}</h3>
                  <p className="font-body text-gray-600 group-hover:text-gray-700">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-display mb-4 text-black">
                Why Choose 
                <span className="text-gray-600">
                  Procure2Pay?
                </span>
              </h2>
              <p className="text-lg font-body text-gray-600">Transform your procurement with cutting-edge technology</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.slice(0, 6).map((benefit, index) => (
                <div key={`benefit-${benefit.slice(0, 20)}-${index}`} className="flex items-start gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:border-black hover:bg-gray-50 transform hover:scale-105 transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="p-2 rounded-full bg-black animate-pulse">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-body text-gray-800 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.1),transparent_50%)] animate-pulse"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.05),transparent_50%)] animate-pulse" style={{animationDelay: '1.5s'}}></div>
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl md:text-5xl font-display text-white mb-6">
              Ready to 
              <span className="text-gray-300">
                transform
              </span>
              {' '}your procurement?
            </h2>
            <p className="text-xl font-body text-gray-300 max-w-2xl mx-auto mb-10">
              Join thousands of companies already using our platform to streamline their procurement process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl animate-bounce-slow"
                asChild
              >
                <Link to="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5 animate-bounce-x" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-black backdrop-blur-sm font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300"
                asChild
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <LogoWithText size="sm" />
            <p className="text-xs text-gray-600">
              © 2025 Procure2Pay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}