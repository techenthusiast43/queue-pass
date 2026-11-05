import React from 'react';
import { TxStatus } from '../types';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X, ShieldAlert } from 'lucide-react';

interface TransactionModalProps {
  status: TxStatus;
  onClose: () => void;
  explorerBaseUrl?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  status,
  onClose,
  explorerBaseUrl = 'https://scan.bohr.life',
}) => {
  if (status.step === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl glass-panel border border-slate-700/80 shadow-2xl">
        {/* Close Button (visible only when finished or error) */}
        {(status.step === 'success' || status.step === 'error') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center">
          {/* Step Icons */}
          {status.step === 'wallet' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status.step === 'pending' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {status.step === 'success' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {status.step === 'error' && (
            <div className="w-16 h-16 mb-4 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
          )}

          {/* Titles */}
          <h3 className="text-xl font-bold text-white mb-2">
            {status.step === 'wallet' && 'Confirm in Wallet'}
            {status.step === 'pending' && 'Broadcasting to BOT Chain'}
            {status.step === 'success' && 'Transaction Confirmed!'}
            {status.step === 'error' && 'Transaction Failed'}
          </h3>

          {/* Action Context */}
          {status.actionTitle && (
            <p className="text-sm font-medium text-emerald-400 mb-3 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-800/40">
              {status.actionTitle}
            </p>
          )}

          {/* Message descriptions */}
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            {status.step === 'wallet' &&
              'Please review and sign the transaction in your connected EVM wallet (e.g. MetaMask, Rabby).'}
            {status.step === 'pending' &&
              'Waiting for block validation on BOT Chain (Chain ID: 968). This takes just a few seconds.'}
            {status.step === 'success' &&
              (status.message || 'Your queue state has been updated on the BOT Chain ledger.')}
            {status.step === 'error' &&
              (status.message || 'An error occurred while executing the transaction on BOT Chain.')}
          </p>

          {/* Transaction Explorer Link */}
          {status.txHash && (
            <a
              href={`${explorerBaseUrl}/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-700/60 rounded-xl transition-all mb-4 group"
            >
              <span>View on BohrScan Explorer</span>
              <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          )}

          {/* Action button */}
          {(status.step === 'success' || status.step === 'error') && (
            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${
                status.step === 'success'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {status.step === 'success' ? 'Continue' : 'Dismiss'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

