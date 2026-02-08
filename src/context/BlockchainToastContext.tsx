import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import BlockchainToast from '../components/BlockchainToast';

interface Toast {
  id: number;
  title: string;
  description: string;
  txHash: string | null;
  duration: number;
}

interface BlockchainToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: number) => void;
}

const BlockchainToastContext = createContext<BlockchainToastContextType | undefined>(undefined);

export const useBlockchainToast = () => {
  const context = useContext(BlockchainToastContext);
  if (!context) {
    throw new Error('useBlockchainToast must be used within BlockchainToastProvider');
  }
  return context;
};

export const BlockchainToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ title, description, txHash, duration = 6000 }: Omit<Toast, 'id'>) => {
    console.log('🔔 [TOAST] showToast called with:', { title, txHash });
    
    const id = Date.now();
    const newToast: Toast = {
      title,
      description,
      txHash,
      duration,
      id
    };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const hideToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <BlockchainToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="toast-container" style={{ position: 'fixed', top: 0, right: 0, zIndex: 999999, pointerEvents: 'none' }}>
        {toasts.map((toast, index) => (
          <BlockchainToast 
            key={toast.id} 
            toast={toast} 
            onClose={() => hideToast(toast.id)}
            style={{ top: `${80 + index * 120}px`, pointerEvents: 'auto' }}
          />
        ))}
      </div>
    </BlockchainToastContext.Provider>
  );
};