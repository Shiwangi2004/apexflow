import React from 'react';

type BadgeVariant = 'amber' | 'mint' | 'signal' | 'steel' | 'titanium';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'steel',
  size = 'sm',
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    amber: 'bg-amber/10 text-amber border-amber/40',
    mint: 'bg-mint/10 text-mint border-mint/40',
    signal: 'bg-signal/10 text-signal border-signal/40',
    steel: 'bg-steel/30 text-titanium border-steel',
    titanium: 'bg-steel/20 text-bone border-titanium/30',
  };

  const pulseColors: Record<BadgeVariant, string> = {
    amber: 'bg-amber',
    mint: 'bg-mint',
    signal: 'bg-signal',
    steel: 'bg-titanium',
    titanium: 'bg-bone',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-wider border rounded-[2px] ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px] leading-none' : 'px-2 py-1 text-xs'
      } ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pulseColors[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};
