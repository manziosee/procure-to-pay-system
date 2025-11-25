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
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 bg-black">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-size-[16px_16px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-gray-300 border border-white/20 mb-4">
              <span className="h-2 w-2 rounded-full bg-white mr-2"></span>
              Transform your procurement process today
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              The all-in-one
              <span className="relative">
                <span className="relative z-10 text-white">
                  {' '}procurement platform
                </span>
                <span className="absolute bottom-2 left-0 w-full h-4 bg-gray-300 -z-10 opacity-30"></span>
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Automate and optimize your procurement workflow with our AI-powered platform. 
              Save time, reduce costs, and gain complete control over your spending.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg bg-white text-black hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-xl transform font-semibold">
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg border-white text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-105">
                <Link to="/login">Sign In to Your Account</Link>
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
                <div key={`stat-${stat.label}-${index}`} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-lg bg-black text-white mr-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-bold text-black">{stat.value}</span>
                  </div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-black rounded-full mb-4 border border-gray-300">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">Everything you need for seamless procurement</h2>
            <p className="text-lg text-gray-600">Streamline your procurement process with our comprehensive suite of features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={`feature-${feature.title}-${index}`} className="group">
                  <div className="h-full p-6 rounded-xl border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                    <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-black mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>

                  </div>
                </div>
              );
            })}
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
                Streamline your procurement process with modern technology
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={`benefit-${benefit.slice(0, 20)}-${index}`} className="flex items-start gap-3 p-4 rounded-lg bg-white border border-gray-200 transition-all duration-300 hover:scale-105 hover:shadow-lg transform hover:border-black">
                  <CheckCircle2 className="h-6 w-6 text-black shrink-0 mt-0.5 transition-transform duration-300 hover:scale-110" />
                  <span className="text-lg text-black">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Cards Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {ctaCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={`cta-${card.title}-${index}`} className="bg-gray-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-black">
                  <h3 className="text-xl font-semibold text-black mb-2">{card.title}</h3>
                  <p className="text-gray-600 mb-6">{card.description}</p>
                  <Button 
                    variant={card.variant as "default" | "outline"} 
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link to={card.buttonText === 'Book a Demo' ? '/demo' : '/register'} className="flex items-center justify-center">
                      {card.buttonText} <Icon className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to transform your procurement process?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Experience the future of procurement management with our innovative platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="secondary" 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              asChild
            >
              <Link to="/register">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
         
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="transform transition-transform duration-300 hover:scale-105">
              <LogoWithText size="sm" />
            </div>
            <p className="text-sm text-gray-600 hover:text-black transition-colors duration-300">
              © 2025 Procure2Pay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}