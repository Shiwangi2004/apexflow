import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/global/ErrorBoundary';
import { Header, ScreenTab } from './components/global/Header';
import { CommandPalette } from './components/global/CommandPalette';
import { CommandDeck } from './components/screens/CommandDeck';
import { ProgramsCatalog } from './components/screens/ProgramsCatalog';
import { DealBuilder } from './components/screens/DealBuilder';
import { ClaimPipeline } from './components/screens/ClaimPipeline';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ScreenTab>('deck');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);

  // Staged quote data for pipeline prefill
  const [pipelinePrefill, setPipelinePrefill] = useState<{
    vin: string;
    model: string;
    msrp: number;
    amount: number;
    programId: number;
  } | null>(null);

  const handleStageToPipeline = (dealData: {
    vin: string;
    model: string;
    msrp: number;
    amount: number;
    programId: number;
  }) => {
    setPipelinePrefill(dealData);
    setActiveTab('pipeline');
  };

  return (
    <div className="min-h-screen bg-asphalt text-bone bg-garage-grid selection:bg-amber selection:text-asphalt flex flex-col font-sans">
      {/* Telemetry Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCommandPalette={() => setIsCommandOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'deck' && (
          <CommandDeck
            onNavigateToPipeline={() => setActiveTab('pipeline')}
            onNavigateToQuote={() => setActiveTab('quote')}
          />
        )}

        {activeTab === 'programs' && (
          <ProgramsCatalog
            isCreateOpen={isCreateProgramOpen}
            onOpenCreate={() => setIsCreateProgramOpen(true)}
            onCloseCreate={() => setIsCreateProgramOpen(false)}
          />
        )}

        {activeTab === 'quote' && (
          <DealBuilder onFastClaimPrefill={handleStageToPipeline} />
        )}

        {activeTab === 'pipeline' && (
          <ClaimPipeline initialPrefill={pipelinePrefill} />
        )}
      </main>

      {/* Telemetry Console Footer */}
      <footer className="border-t border-steel bg-asphalt/90 py-4 px-4 sm:px-8 text-titanium font-mono text-[11px] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-bone font-bold">APEXFLOW TELEMETRY ENGINE</span>
          <span>//</span>
          <span>POSTGRESQL 16 + KAFKA KRAFT</span>
          <span>//</span>
          <span>SPRING BOOT 3.x CORE</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>HOTKEYS: [1] DECK [2] PROGS [3] QUOTE [4] PIPE</span>
          <span className="text-amber">WCAG AA COMPLIANT</span>
        </div>
      </footer>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={setActiveTab}
        onCreateProgramOpen={() => {
          setActiveTab('programs');
          setIsCreateProgramOpen(true);
        }}
        onQuickQuote={() => {
          setActiveTab('quote');
        }}
        onSubmitFastClaim={() => {
          setActiveTab('pipeline');
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
