import type { CSSProperties } from 'react';

interface LogoMarkProps {
  className?: string;
  style?: CSSProperties;
}

/** The glyph alone: an approved document. Uses currentColor, meant to sit inside a solid tile. */
export function LogoMark({ className = '', style }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <rect x="5" y="3" width="14" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 12.3 L10.8 14.8 L16 9.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  size?: number;
}

/** Self-contained icon tile (solid black square, white glyph) — same on any background. */
export function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <div
      className={`flex items-center justify-center bg-black rounded-xl shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <LogoMark className="text-white" style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}

interface LogoWithTextProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** 'dark' = black wordmark, for light backgrounds. 'light' = white wordmark, for dark backgrounds. */
  variant?: 'dark' | 'light';
}

export function LogoWithText({ className = '', size = 'md', variant = 'dark' }: LogoWithTextProps) {
  const sizes = {
    sm: { logo: 32, text: 'text-lg' },
    md: { logo: 40, text: 'text-xl' },
    lg: { logo: 48, text: 'text-2xl' },
  };
  const textColor = variant === 'light' ? 'text-white' : 'text-black';
  const taglineColor = variant === 'light' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={sizes[size].logo} />
      <div className="flex flex-col">
        <span className={`font-bold leading-tight ${sizes[size].text} ${textColor}`}>
          Procure2Pay
        </span>
        <span className={`text-[11px] uppercase tracking-wider leading-tight ${taglineColor}`}>
          Smart Procurement
        </span>
      </div>
    </div>
  );
}
