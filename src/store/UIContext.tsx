import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: () => void;
}

interface UIContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  confirm: (title: string, message: string) => Promise<boolean>;
  alert: (title: string, message: string) => Promise<void>;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => {},
  });
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => {},
  });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  const confirm = useCallback((title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        resolve: (val: boolean) => {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          resolve(val);
        },
      });
    });
  }, []);

  const alert = useCallback((title: string, message: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        resolve: () => {
          setAlertState((prev) => ({ ...prev, isOpen: false }));
          resolve();
        },
      });
    });
  }, []);

  return (
    <UIContext.Provider value={{ toast, confirm, alert }}>
      {children}

      {/* TOASTS CONTAINER */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => {
          let bgColor = 'bg-slate-900/95 border-emerald-500/30 text-emerald-200';
          let Icon = CheckCircle2;
          let iconColor = 'text-emerald-400';
          if (t.type === 'error') {
            bgColor = 'bg-slate-900/95 border-rose-500/30 text-rose-200';
            Icon = XCircle;
            iconColor = 'text-rose-400';
          } else if (t.type === 'info') {
            bgColor = 'bg-slate-900/95 border-sky-500/30 text-sky-200';
            Icon = Info;
            iconColor = 'text-sky-400';
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-in-right ${bgColor}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
              <p className="text-sm font-medium flex-grow">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* CONFIRM DIALOG */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in" 
            onClick={() => confirmState.resolve(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 animate-zoom-in">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-500/10 p-3 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{confirmState.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{confirmState.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                onClick={() => confirmState.resolve(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                onClick={() => confirmState.resolve(true)}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity animate-fade-in" 
            onClick={() => alertState.resolve()}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 animate-zoom-in">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-600">
                <Info className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{alertState.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{alertState.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all"
                onClick={() => alertState.resolve()}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
