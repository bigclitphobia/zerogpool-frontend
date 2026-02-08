import React, { useEffect } from 'react';
import { X, ExternalLink, Zap, AlertCircle } from 'lucide-react';
import './BlockchainToast.css';

const BLOCK_EXPLORER = 'https://chainscan.0g.ai/tx/';

interface ToastProps {
  toast: {
    title: string;
    description: string;
    txHash: string | null;
    duration: number;
  };
  onClose: () => void;
  style?: React.CSSProperties;
}

export default function BlockchainToast({ toast, onClose, style }: ToastProps) {
  if (!toast) return null;

  const handleTxClick = () => {
    if (toast.txHash) {
      window.open(`${BLOCK_EXPLORER}${toast.txHash}`, '_blank');
    }
  };

  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const isError = toast.title.includes('❌') || toast.title.includes('Failed');
  const isWarning = !toast.txHash && !isError;

  return (
    <div
      className={`blockchain-toast blockchain-toast-enter ${isError ? 'toast-error' : isWarning ? 'toast-warning' : ''}`}
      style={style}
    >
      <div className={`toast-icon ${isError ? 'icon-error' : isWarning ? 'icon-warning' : ''}`}>
        {isError ? <AlertCircle size={24} /> : <Zap size={24} />}
      </div>

      <div className="toast-content">
        <div className="toast-header">
          <h4>{toast.title}</h4>
          <button className="toast-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        
        <p className="toast-description">{toast.description}</p>
        
        {toast.txHash ? (
          <button className="toast-tx-link" onClick={handleTxClick}>
            <span className="tx-hash">
              {toast.txHash.slice(0, 10)}...{toast.txHash.slice(-8)}
            </span>
            <ExternalLink size={14} />
          </button>
        ) : isWarning ? (
          <div className="toast-warning-text">
            <AlertCircle size={14} />
            <span>Blockchain recording pending</span>
          </div>
        ) : null}
      </div>

      <div 
        className="toast-progress"
        style={{
          animation: `progress-shrink ${toast.duration / 1000}s linear forwards`
        }}
      />
    </div>
  );
}