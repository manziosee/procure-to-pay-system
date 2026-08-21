import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  FilePlus2,
  UserCheck,
  ReceiptText,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoWithText } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';

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
      icon: BarChart3,
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
    { value: '70%', label: 'Faster Processing', icon: Zap },
    { value: '99.9%', label: 'Accuracy Rate', icon: CheckCircle2 },
    { value: '24/7', label: 'Availability', icon: Clock },
  ];

  const steps = [
    { n: '01', icon: FilePlus2, title: 'Staff creates a request', desc: 'Title, amount and a proforma invoice — extracted automatically.' },
    { n: '02', icon: UserCheck, title: 'Level 1 & 2 approve', desc: 'Both approvers sign off; either can reject at any point.' },
    { n: '03', icon: FileText, title: 'PO is generated', desc: 'Final approval auto-generates the purchase order, no extra step.' },
    { n: '04', icon: ReceiptText, title: 'Receipt is validated', desc: 'Staff submits the receipt; it’s checked against the PO for you.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Floating centered navbar — page content scrolls underneath it */}
      <nav className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
        <div className="w-full max-w-4xl rounded-full bg-black/95 backdrop-blur-md border border-white/10 shadow-lg shadow-black/10 px-3 sm:px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center pl-1">
            <LogoWithText size="md" variant="light" />
          </Link>
          <div className="hidden lg:flex items-center gap-7 text-sm text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#benefits" className="hover:text-white transition-colors">Benefits</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-gray-300 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-white text-black hover:bg-gray-100 rounded-full px-4">
                Start Free Trial <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-36 pb-24 lg:pt-44 lg:pb-32 bg-black overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.04),transparent_50%)]"></div>
        </div>
        <div className="container mx-auto px-4 relative grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="animate-fade-in-up">
              <h1 className="text-4xl md:text-6xl font-display tracking-tight text-white mb-6 leading-[1.05]">
                The all-in-one
                <span className="relative inline-block ml-3">
                  procurement platform
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-white rounded-full animate-scale-x"></div>
                </span>
              </h1>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-xl font-body text-gray-300 max-w-xl mb-10">
                Create a request, route it through Level 1 and Level 2 approval, and get an
                auto-generated purchase order — with AI reading your proformas and validating
                receipts along the way.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Button size="lg" asChild className="bg-white text-black hover:bg-gray-100 font-semibold transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                <Link to="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-white text-white hover:bg-white hover:text-black backdrop-blur-sm font-semibold transform hover:scale-105 transition-all duration-300">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          {/* Hero visual — a real request card, not a stock photo */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                  <FileText className="h-4 w-4" />
                  Purchase Request #1042
                </div>
                <StatusBadge status="approved" />
              </div>
              <p className="text-lg font-heading text-black mb-1">MacBook Pro 16&Prime; — Engineering</p>
              <p className="text-2xl font-bold text-black mb-6">RWF 2,450,000</p>

              <div className="space-y-3">
                {[
                  { label: 'Staff', detail: 'Request created' },
                  { label: 'Approver L1', detail: 'Approved' },
                  { label: 'Approver L2', detail: 'Approved' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="flex items-center gap-1.5 text-black font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {row.detail}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <FilePlus2 className="h-3.5 w-3.5" />
                Purchase order auto-generated · PDF attached
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 max-w-6xl mx-auto px-4 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-display text-black mb-4">From request to receipt.</h2>
          <p className="text-lg font-body text-gray-600">One flow, four steps, full audit trail.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.n}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display text-2xl font-bold text-gray-300">{s.n}</span>
                </div>
                <h3 className="font-heading text-black mb-2">{s.title}</h3>
                <p className="text-sm font-body text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={`stat-${stat.label}-${index}`} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-shadow duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.15}s`}}>
                  <div className="flex items-center mb-3">
                    <div className="p-3 rounded-full bg-black text-white mr-4">
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
      <section id="features" className="py-16 bg-white scroll-mt-24">
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
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group p-6 rounded-xl border border-gray-200 hover:border-black bg-white hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-heading text-black mb-3">{feature.title}</h3>
                  <p className="font-body text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 bg-gray-50 scroll-mt-24">
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
              {benefits.map((benefit, index) => (
                <div key={benefit} className="flex items-start gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:border-black hover:-translate-y-0.5 hover:shadow-sm transition-all duration-300 animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="p-2 rounded-full bg-black">
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
                className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                asChild
              >
                <Link to="/register">
                  Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
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