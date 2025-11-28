interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="50" cy="50" r="48" stroke="#000000" strokeWidth="3" fill="none" />
      
      {/* Document icon on left */}
      <path
        d="M25 30 L25 70 L45 70 L45 30 Z"
        stroke="#000000"
        strokeWidth="2.5"
        fill="none"
      />
      <line x1="28" y1="38" x2="42" y2="38" stroke="#000000" strokeWidth="2" />
      <line x1="28" y1="45" x2="42" y2="45" stroke="#000000" strokeWidth="2" />
      <line x1="28" y1="52" x2="42" y2="52" stroke="#000000" strokeWidth="2" />
      
      {/* Arrow in middle */}
      <path
        d="M48 50 L60 50"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M56 45 L60 50 L56 55"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Checkmark/Payment symbol on right */}
      <circle cx="72" cy="50" r="12" stroke="#000000" strokeWidth="2.5" fill="none" />
      <path
        d="M67 50 L70 53 L77 46"
        stroke="#000000"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoWithTextProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LogoWithText({ className = '', size = 'md' }: LogoWithTextProps) {
  const sizes = {
    sm: { logo: 32, text: 'text-lg' },
    md: { logo: 40, text: 'text-xl' },
    lg: { logo: 56, text: 'text-3xl' },
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={sizes[size].logo} />
      <div className="flex flex-col">
        <span className={`font-bold leading-tight ${sizes[size].text} text-black`}>
          Procure<span className="text-black">2</span>Pay
        </span>
        <span className="text-xs text-gray-600 leading-tight">
          Smart Procurement System
        </span>
      </div>
    </div>
  );
}