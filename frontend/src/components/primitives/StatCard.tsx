import React, { useEffect, useState } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  numericTarget?: number;
  prefix?: string;
  suffix?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  icon?: React.ReactNode;
  color?: 'amber' | 'mint' | 'signal' | 'bone';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  numericTarget,
  prefix = '',
  suffix = '',
  delta,
  deltaType = 'positive',
  subtext,
  icon,
  color = 'bone',
}) => {
  const [displayNumber, setDisplayNumber] = useState<number | null>(
    typeof value === 'number' ? 0 : null
  );

  useEffect(() => {
    if (typeof value !== 'number' && numericTarget === undefined) return;
    const target = numericTarget !== undefined ? numericTarget : (value as number);

    let startTimestamp: number | null = null;
    const duration = 1000;
    const startVal = displayNumber ?? 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayNumber(startVal + (target - startVal) * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, numericTarget]);

  const colorClass = {
    amber: 'text-amber',
    mint: 'text-mint',
    signal: 'text-signal',
    bone: 'text-bone',
  }[color];

  const deltaColors = {
    positive: 'text-mint border-mint/30 bg-mint/10',
    negative: 'text-signal border-signal/30 bg-signal/10',
    neutral: 'text-titanium border-steel bg-steel/20',
  }[deltaType];

  return (
    <div className="relative p-4 bg-graphite border border-steel chamfer-box panel-ticks flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-titanium flex items-center gap-1.5">
          {icon && <span className="text-amber">{icon}</span>}
          {label}
        </span>
        {delta && (
          <span className={`text-[10px] font-mono px-1.5 py-0.5 border rounded-[2px] ${deltaColors}`}>
            {delta}
          </span>
        )}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1 my-1">
        {prefix && <span className="font-heading text-lg font-bold text-titanium">{prefix}</span>}
        <span className={`font-heading text-3xl font-extrabold tracking-tight tabular-nums ${colorClass}`}>
          {displayNumber !== null
            ? Math.round(displayNumber).toLocaleString()
            : value}
        </span>
        {suffix && <span className="font-mono text-xs text-titanium ml-1">{suffix}</span>}
      </div>

      {/* Subtext */}
      {subtext && (
        <div className="text-[11px] font-sans text-titanium/80 truncate mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
};
