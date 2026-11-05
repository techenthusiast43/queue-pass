import React from 'react';
import { QueueStatus, TicketStatus } from '../types';
import { Clock, PhoneCall, CheckCircle2, XCircle, Activity, Lock } from 'lucide-react';

interface TicketBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const TicketStatusBadge: React.FC<TicketBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  switch (status) {
    case TicketStatus.Waiting:
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <Clock className="w-3.5 h-3.5" />
          Waiting
        </span>
      );
    case TicketStatus.Called:
      return (
        <span className={`inline-flex items-center rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ring-1 ring-indigo-500/20 ${sizeClasses}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-90"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
          Called (Now Serving)
        </span>
      );
    case TicketStatus.Served:
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          Served
        </span>
      );
    case TicketStatus.Cancelled:
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
          Unknown
        </span>
      );
  }
};

interface QueueBadgeProps {
  status: QueueStatus;
  size?: 'sm' | 'md';
}

export const QueueStatusBadge: React.FC<QueueBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  }[size];

  if (status === QueueStatus.Active) {
    return (
      <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 ${sizeClasses}`}>
        <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
        Open
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
      <Lock className="w-3 h-3 text-slate-400" />
      Closed
    </span>
  );
};

