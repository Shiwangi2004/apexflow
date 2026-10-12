import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagonIcon, RefreshIcon } from '../icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Telemetric ErrorBoundary captured crash:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-asphalt text-bone flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-graphite border-2 border-signal p-6 chamfer-box panel-ticks shadow-2xl">
            <div className="flex items-center gap-3 text-signal mb-4 border-b border-signal/30 pb-3">
              <AlertOctagonIcon size={24} />
              <h1 className="font-heading text-xl uppercase font-bold tracking-wider">
                SUBSYSTEM FAULT DETECTED
              </h1>
            </div>
            <p className="font-mono text-xs text-titanium mb-4">
              An uncaught runtime exception interrupted telemetry streaming. The diagnostic trace is below:
            </p>
            <div className="bg-asphalt p-3 border border-steel rounded-[2px] font-mono text-[11px] text-signal/90 mb-6 overflow-x-auto">
              {this.state.error?.message || 'Unknown kernel exception'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber text-asphalt font-mono font-bold uppercase text-xs hover:bg-amber/90 transition-colors"
            >
              <RefreshIcon size={14} />
              RE-INITIALIZE TELEMETRY DECK
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
