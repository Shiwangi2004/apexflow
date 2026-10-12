import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheckIcon, AlertOctagonIcon, XIcon, TerminalIcon } from '../components/icons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'receipt' | 'info';
  title: string;
  description?: string;
  receiptData?: {
    vin?: string;
    program?: string;
    dealerId?: string;
    reason?: string;
    timestamp?: string;
    errorCode?: string;
  };
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showRejectReceipt: (data: { vin: string; program: string; reason: string; dealerId: string; errorCode?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || (toast.type === 'receipt' ? 8000 : 4500);
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const showRejectReceipt = useCallback(
    (data: { vin: string; program: string; reason: string; dealerId: string; errorCode?: string }) => {
      addToast({
        type: 'receipt',
        title: 'CLAIM REJECTION RECEIPT',
        receiptData: {
          vin: data.vin,
          program: data.program,
          dealerId: data.dealerId,
          reason: data.reason,
          errorCode: data.errorCode || 'RULE_EVAL_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showRejectReceipt }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto w-full"
            >
              {t.type === 'receipt' && t.receiptData ? (
                /* Specialized Mono Telemetry Reject Receipt */
                <div className="bg-graphite border-2 border-signal p-4 shadow-2xl chamfer-box relative font-mono text-xs text-bone">
                  <div className="flex items-center justify-between border-b border-signal/40 pb-2 mb-2 text-signal">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[11px]">
                      <AlertOctagonIcon size={14} />
                      {t.title}
                    </span>
                    <button
                      onClick={() => removeToast(t.id)}
                      className="text-titanium hover:text-bone"
                    >
                      <XIcon size={14} />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-[11px] leading-relaxed text-titanium">
                    <div className="flex justify-between">
                      <span>TIMESTAMP:</span>
                      <span className="text-bone">{t.receiptData.timestamp?.slice(11, 19)} UTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VIN:</span>
                      <span className="text-amber font-mono font-bold">{t.receiptData.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PROGRAM:</span>
                      <span className="text-bone">{t.receiptData.program}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEALER ID:</span>
                      <span className="text-bone">{t.receiptData.dealerId}</span>
                    </div>
                    <div className="border-t border-steel pt-2 mt-2 text-signal bg-signal/5 p-2 rounded-[2px] border border-signal/20">
                      <div className="font-bold text-[10px] tracking-wider uppercase mb-0.5">FAILURE REASON:</div>
                      <div className="text-bone/90 break-words">{t.receiptData.reason}</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Telemetry Toast */
                <div
                  className={`p-3 bg-graphite border chamfer-box-sm shadow-xl flex items-start gap-3 relative ${
                    t.type === 'success'
                      ? 'border-mint/60 text-mint'
                      : t.type === 'error'
                      ? 'border-signal/60 text-signal'
                      : 'border-steel text-bone'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {t.type === 'success' ? (
                      <ShieldCheckIcon size={18} className="text-mint" />
                    ) : t.type === 'error' ? (
                      <AlertOctagonIcon size={18} className="text-signal" />
                    ) : (
                      <TerminalIcon size={18} className="text-amber" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading font-bold uppercase tracking-wider text-sm text-bone">
                      {t.title}
                    </div>
                    {t.description && (
                      <div className="text-xs text-titanium mt-0.5 font-sans break-words">
                        {t.description}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeToast(t.id)}
                    className="text-titanium hover:text-bone p-1"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
