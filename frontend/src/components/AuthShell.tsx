import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, type LucideIcon, FileText, Users, Shield, BarChart3 } from 'lucide-react';
import { LogoWithText } from '@/components/Logo';

interface AuthShellProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

const highlights = [
  { icon: FileText, text: 'AI reads your proformas automatically' },
  { icon: Users, text: 'Level 1 & Level 2 approval, built in' },
  { icon: Shield, text: 'Full audit trail on every request' },
  { icon: BarChart3, text: 'Real-time spend visibility' },
];

const roles = ['Staff', 'Approver L1', 'Approver L2', 'Finance'];

export function AuthShell({ icon: Icon, title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand & value prop */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12 bg-black relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />

        <div className="relative">
          <Link to="/">
            <LogoWithText size="md" variant="light" className="mb-16" />
          </Link>

          <h2 className="text-3xl font-display font-bold text-white mb-4 leading-snug">
            One flow from request<br />to purchase order.
          </h2>
          <p className="text-gray-400 leading-relaxed mb-10">
            Multi-level approvals, AI document processing, and a complete audit trail — for every
            purchase request your team makes.
          </p>

          <div className="flex flex-col gap-4">
            {highlights.map((h) => {
              const HIcon = h.icon;
              return (
                <div key={h.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                    <HIcon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 text-sm">{h.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-4">
            {roles.map((r) => (
              <span key={r} className="px-3 py-1 rounded-full text-xs font-medium bg-white/[0.06] border border-white/10 text-gray-400">
                {r}
              </span>
            ))}
          </div>
          <p className="text-gray-500 text-xs">One workspace, every role.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8 relative">
        <div className="absolute top-6 left-6 lg:left-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>

        <div className="w-full max-w-md">
          <LogoWithText size="sm" className="lg:hidden mb-8" />

          <div className="mb-8">
            <div className="h-11 w-11 bg-black rounded-xl flex items-center justify-center mb-5">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-1.5">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
