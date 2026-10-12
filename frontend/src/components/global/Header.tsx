import React, { useEffect, useState } from 'react';
import { GaugeIcon, PipelineIcon, TagIcon, SlidersIcon, RefreshIcon } from '../icons';
import { api } from '../../api/client';

export type ScreenTab = 'deck' | 'programs' | 'quote' | 'pipeline';

interface HeaderProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCommandPalette,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // UTC clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Periodic health check
  const checkHealth = async () => {
    setIsCheckingHealth(true);
    const ok = await api.checkHealth();
    setIsBackendHealthy(ok);
    setIsCheckingHealth(false);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // every 15s
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ScreenTab; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'deck', label: 'Command Deck', icon: <GaugeIcon size={16} />, shortcut: '1' },
    { id: 'programs', label: 'Programs', icon: <TagIcon size={16} />, shortcut: '2' },
    { id: 'quote', label: 'Deal Builder', icon: <SlidersIcon size={16} />, shortcut: '3' },
    { id: 'pipeline', label: 'Claim Pipeline', icon: <PipelineIcon size={16} />, shortcut: '4' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-asphalt/95 backdrop-blur-md border-b border-steel select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand and Telemetry ID */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-amber rounded-[1px] rotate-45 shadow-[0_0_8px_#FFB020]" />
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold uppercase tracking-wider text-bone leading-none">
                Apex<span className="text-amber">Flow</span>
              </span>
              <span className="font-mono text-[9px] text-titanium tracking-widest uppercase">
                AUTOMOTIVE TELEMETRY // V2.4-PROD
              </span>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-steel mx-1" />

          {/* System Health Dot */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-graphite border border-steel rounded-[2px] font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendHealthy
                  ? 'bg-mint shadow-[0_0_6px_#35F2C2]'
                  : 'bg-signal shadow-[0_0_6px_#FF4D4D]'
              }`}
            />
            <span className="text-titanium uppercase">
              {isBackendHealthy ? 'CLUSTER LINK: OK' : 'LINK DOWN'}
            </span>
            <button
              onClick={checkHealth}
              title="Refresh connection status"
              className={`text-titanium hover:text-bone ml-1 ${isCheckingHealth ? 'animate-spin' : ''}`}
            >
              <RefreshIcon size={12} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative px-3 py-1.5 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider transition-all duration-150 rounded-[2px] ${
                  isActive
                    ? 'text-bone bg-graphite border border-amber/70 font-semibold'
                    : 'text-titanium hover:text-bone hover:bg-graphite/50 border border-transparent'
                }`}
              >
                <span className={isActive ? 'text-amber' : 'text-titanium'}>{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Clock & Command Palette Trigger */}
        <div className="flex items-center gap-3">
          {/* UTC Clock */}
          <div className="hidden lg:block font-mono text-[11px] text-titanium tabular-nums">
            {currentTime}
          </div>

          {/* Ctrl+K Search button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1 bg-graphite hover:bg-steel/50 border border-steel hover:border-titanium/50 text-titanium hover:text-bone rounded-[2px] font-mono text-xs transition-colors"
            title="Open Command Palette (Ctrl+K or Cmd+K)"
          >
            <span className="hidden sm:inline">DECK CMD</span>
            <kbd className="px-1.5 py-0.5 bg-asphalt text-bone border border-steel text-[10px] rounded-[2px]">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
