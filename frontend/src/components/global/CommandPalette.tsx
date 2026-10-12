import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon, GaugeIcon, TagIcon, SlidersIcon, PipelineIcon, ShieldCheckIcon } from '../icons';
import { ScreenTab } from './Header';

interface ActionItem {
  id: string;
  title: string;
  section: 'NAVIGATE' | 'ACTIONS';
  shortcut?: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ScreenTab) => void;
  onCreateProgramOpen: () => void;
  onQuickQuote: () => void;
  onSubmitFastClaim: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onCreateProgramOpen,
  onQuickQuote,
  onSubmitFastClaim,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: ActionItem[] = [
    {
      id: 'nav-deck',
      title: 'Navigate to Command Deck (Gauges & Ticker)',
      section: 'NAVIGATE',
      shortcut: '1',
      icon: <GaugeIcon size={16} />,
      perform: () => {
        onNavigate('deck');
        onClose();
      },
    },
    {
      id: 'nav-programs',
      title: 'Navigate to Programs Catalog (Window Stickers)',
      section: 'NAVIGATE',
      shortcut: '2',
      icon: <TagIcon size={16} />,
      perform: () => {
        onNavigate('programs');
        onClose();
      },
    },
    {
      id: 'nav-quote',
      title: 'Navigate to Deal Builder (Offer Lanes Calculator)',
      section: 'NAVIGATE',
      shortcut: '3',
      icon: <SlidersIcon size={16} />,
      perform: () => {
        onNavigate('quote');
        onClose();
      },
    },
    {
      id: 'nav-pipeline',
      title: 'Navigate to Claim Pipeline (Kafka Hero)',
      section: 'NAVIGATE',
      shortcut: '4',
      icon: <PipelineIcon size={16} />,
      perform: () => {
        onNavigate('pipeline');
        onClose();
      },
    },
    {
      id: 'act-new-program',
      title: 'Create Incentive Program Spec Card',
      section: 'ACTIONS',
      shortcut: 'N',
      icon: <TagIcon size={16} />,
      perform: () => {
        onClose();
        onCreateProgramOpen();
      },
    },
    {
      id: 'act-calc-quote',
      title: 'Preset F-150 $52,000 Deal Scenario',
      section: 'ACTIONS',
      shortcut: 'P',
      icon: <SlidersIcon size={16} />,
      perform: () => {
        onNavigate('quote');
        onClose();
        onQuickQuote();
      },
    },
    {
      id: 'act-submit-claim',
      title: 'Submit High-Priority Claim via Kafka Pipe',
      section: 'ACTIONS',
      shortcut: 'C',
      icon: <ShieldCheckIcon size={16} />,
      perform: () => {
        onNavigate('pipeline');
        onClose();
        onSubmitFastClaim();
      },
    },
  ];

  const filtered = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.section.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcut toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
        return;
      }

      if (!isOpen) {
        // Direct number shortcuts when not in input
        if (['1', '2', '3', '4'].includes(e.key) && !(e.target as HTMLElement)?.matches('input, textarea')) {
          e.preventDefault();
          const targetTabs: Record<string, ScreenTab> = {
            '1': 'deck',
            '2': 'programs',
            '3': 'quote',
            '4': 'pipeline',
          };
          onNavigate(targetTabs[e.key]);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].perform();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, onNavigate]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-asphalt/85 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-graphite border border-steel shadow-2xl chamfer-box relative z-10 overflow-hidden"
          >
            {/* Input Header */}
            <div className="flex items-center px-4 border-b border-steel bg-asphalt/60">
              <span className="text-amber mr-3">
                <SearchIcon size={18} />
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type command or jump to screen... (ESC to close)"
                className="w-full bg-transparent py-3.5 text-sm font-mono text-bone placeholder-titanium/50 focus:outline-none"
              />
              <kbd className="text-[10px] font-mono px-2 py-0.5 border border-steel text-titanium bg-asphalt rounded">
                ESC
              </kbd>
            </div>

            {/* Action Results */}
            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-steel/20">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-titanium">
                  NO MATCHING COMMANDS FOUND FOR "{query}"
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={item.perform}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[2px] text-left transition-colors font-mono text-xs ${
                        isSelected
                          ? 'bg-steel/50 text-amber border-l-2 border-amber pl-2.5'
                          : 'text-titanium hover:text-bone hover:bg-steel/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isSelected ? 'text-amber' : 'text-titanium'}>
                          {item.icon}
                        </span>
                        <span className={isSelected ? 'text-bone font-medium' : ''}>
                          {item.title}
                        </span>
                      </div>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 bg-asphalt text-bone border border-steel text-[10px] rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer telemetry notice */}
            <div className="px-4 py-2 bg-asphalt/80 border-t border-steel text-[10px] font-mono text-titanium flex justify-between items-center">
              <span>↑↓ NAVIGATE // ENTER TO SELECT</span>
              <span>APEXFLOW::DEALER_CONSOLE_V2</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
