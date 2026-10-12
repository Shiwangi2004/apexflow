import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface GaugeArcProps {
  value: number; // Current value
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
  unit?: string;
  color?: 'amber' | 'mint' | 'signal';
  formatValue?: (val: number) => string;
  size?: number;
}

export const GaugeArc: React.FC<GaugeArcProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  sublabel,
  unit = '',
  color = 'mint',
  formatValue = (v) => Math.round(v).toLocaleString(),
  size = 200,
}) => {
  const [displayValue, setDisplayValue] = useState(min);

  // Gauge geometry: 240-degree sweep from -210 deg to 30 deg (or 150 deg to 390 deg)
  // Let startAngle = -120 deg (top-left) to +120 deg (top-right) => sweep of 240 deg
  const startAngle = -120;
  const endAngle = 120;
  const sweepAngle = endAngle - startAngle; // 240 degrees

  // Clamped fraction (0 to 1)
  const fraction = Math.min(Math.max((value - min) / (max - min || 1), 0), 1);

  // Animated spring for smooth needle sweep
  const springValue = useSpring(0, { stiffness: 60, damping: 14 });

  useEffect(() => {
    springValue.set(fraction);
  }, [fraction, springValue]);

  // Count up the numerical readout
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s countup
    const startVal = displayValue;
    const endVal = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayValue(startVal + (endVal - startVal) * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  const needleAngle = useTransform(springValue, [0, 1], [startAngle, endAngle]);

  // Arc path helpers
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size * 0.38;

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, radius, endA);
    const end = polarToCartesian(x, y, radius, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);
  const activeEndAngle = startAngle + sweepAngle * fraction;
  const activePath = fraction > 0 ? describeArc(cx, cy, r, startAngle, activeEndAngle) : '';

  const colorHex = {
    amber: '#FFB020',
    mint: '#35F2C2',
    signal: '#FF4D4D',
  }[color];

  // Generate tick marks around arc
  const totalTicks = 25;
  const ticks = Array.from({ length: totalTicks }).map((_, i) => {
    const angle = startAngle + (sweepAngle / (totalTicks - 1)) * i;
    const isMajor = i % 4 === 0;
    const tickR1 = r + 8;
    const tickR2 = r + (isMajor ? 16 : 12);
    const p1 = polarToCartesian(cx, cy, tickR1, angle);
    const p2 = polarToCartesian(cx, cy, tickR2, angle);
    const isActive = angle <= activeEndAngle;
    return { p1, p2, isMajor, isActive };
  });

  return (
    <div className="relative flex flex-col items-center justify-center p-3 bg-graphite border border-steel chamfer-box panel-ticks select-none">
      {/* Telemetry Header */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono tracking-wider text-titanium mb-1">
        <span className="uppercase">{label}</span>
        {sublabel && <span className="text-bone/50 text-[10px]">{sublabel}</span>}
      </div>

      <div className="relative" style={{ width: size, height: size * 0.78 }}>
        <svg width={size} height={size * 0.85} viewBox={`0 0 ${size} ${size * 0.85}`} className="overflow-visible">
          <defs>
            {/* Glow filters */}
            <filter id={`gauge-glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={colorHex} floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="#232A32"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Ticks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.p1.x}
              y1={t.p1.y}
              x2={t.p2.x}
              y2={t.p2.y}
              stroke={t.isActive ? colorHex : '#232A32'}
              strokeWidth={t.isMajor ? 2 : 1}
              opacity={t.isActive ? 0.9 : 0.4}
            />
          ))}

          {/* Active Arc */}
          {activePath && (
            <path
              d={activePath}
              fill="none"
              stroke={colorHex}
              strokeWidth="5"
              strokeLinecap="round"
              filter={`url(#gauge-glow-${color})`}
            />
          )}

          {/* Center Hub Outer Ring */}
          <circle cx={cx} cy={cy} r="14" fill="#14181D" stroke="#232A32" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="6" fill="#0B0D10" stroke={colorHex} strokeWidth="1.5" />

          {/* Needle */}
          <motion.g
            style={{
              originX: `${cx}px`,
              originY: `${cy}px`,
              rotate: needleAngle,
            }}
          >
            {/* Needle Line */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - r + 4}
              stroke={colorHex}
              strokeWidth="2.5"
              strokeLinecap="round"
              filter={`url(#gauge-glow-${color})`}
            />
            {/* Counterbalance tail */}
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy + 12}
              stroke="#9AA5B1"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Min/Max Endpoints */}
          <text
            x={polarToCartesian(cx, cy, r + 24, startAngle).x}
            y={polarToCartesian(cx, cy, r + 24, startAngle).y + 4}
            textAnchor="middle"
            fill="#9AA5B1"
            className="text-[9px] font-mono"
            opacity="0.6"
          >
            {min}
          </text>
          <text
            x={polarToCartesian(cx, cy, r + 24, endAngle).x}
            y={polarToCartesian(cx, cy, r + 24, endAngle).y + 4}
            textAnchor="middle"
            fill="#9AA5B1"
            className="text-[9px] font-mono"
            opacity="0.6"
          >
            {max}
          </text>
        </svg>

        {/* Digital Readout Center/Bottom */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-2xl font-bold tracking-tight text-bone tabular-nums">
              {formatValue(displayValue)}
            </span>
            {unit && <span className="font-mono text-xs text-titanium">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
