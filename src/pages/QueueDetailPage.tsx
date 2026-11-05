import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  ArrowLeft, 
  Clock, 
  PhoneCall, 
  CheckCircle2, 
  ExternalLink, 
  Share2, 
  Check, 
  RefreshCw, 
  Users, 
  ShieldCheck, 
  LogOut,
  AlertCircle
} from 'lucide-react';
import { QueueData, TicketData, TicketStatus, UserTicketInfo, QueueStatus } from '../types';
import { TicketStatusBadge, QueueStatusBadge } from '../components/StatusBadge';

interface QueueDetailPageProps {
  fetchQueueById: (queueId: bigint) => Promise<QueueData | null>;
  fetchQueueTickets: (queueId: bigint, count: number) => Promise<TicketData[]>;
  fetchUserTicketInQueue: (queueId: bigint, userAddress: `0x${string}`) => Promise<UserTicketInfo>;
  onJoinQueue: (queueId: bigint) => Promise<boolean>;
  onLeaveQueue: (queueId: bigint) => Promise<boolean>;
}

export const QueueDetailPage: React.FC<QueueDetailPageProps> = ({
  fetchQueueById,
  fetchQueueTickets,
  fetchUserTicketInQueue,
  onJoinQueue,
  onLeaveQueue,
}) => {
  const { id } = useParams<{ id: string }>();
  const queueId = BigInt(id || '0');

  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [queue, setQueue] = useState<QueueData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [userTicketInfo, setUserTicketInfo] = useState<UserTicketInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (queueId === 0n) return;
    setLoading(true);
    try {
      const q = await fetchQueueById(queueId);
      setQueue(q);

      if (q) {
        const ticketList = await fetchQueueTickets(queueId, Number(q.totalTickets));
        setTickets(ticketList);
      }

      if (address) {
        const uInfo = await fetchUserTicketInQueue(queueId, address);
        setUserTicketInfo(uInfo);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [queueId, address]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!isConnected) {
      open();
      return;
    }
    setIsJoining(true);
    try {
      const success = await onJoinQueue(queueId);
      if (success) {
        await loadData();
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      const success = await onLeaveQueue(queueId);
      if (success) {
        await loadData();
      }
    } finally {
      setIsLeaving(false);
    }
  };

  if (loading && !queue) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-300">Loading queue from BOT Chain...</p>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Queue Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          The requested queue does not exist on the current BOT Chain contract instance.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
        >
          Back to Directory
        </Link>
      </div>
    );
  }

  const isOwner = address && queue.owner.toLowerCase() === address.toLowerCase();
  const isOpen = queue.status === QueueStatus.Active;
  const hasActiveTicket = userTicketInfo?.hasActiveTicket && userTicketInfo.ticket.ticketId > 0n;
  const userTicket = userTicketInfo?.ticket;
  const position = Number(userTicketInfo?.positionInLine || 0n);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Queues</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh queue state"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Link' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Banner Header */}
      <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Queue #{queue.id.toString()}
              </span>
              <QueueStatusBadge status={queue.status} />
              {isOwner && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  You are the Owner
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              {queue.name}
            </h1>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              {queue.description || 'No special announcements for this queue.'}
            </p>

            {/* Owner explorer link */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Created by</span>
              <a
                href={`https://scan.bohr.life/address/${queue.owner}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{`${queue.owner.slice(0, 6)}...${queue.owner.slice(-4)}`}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* Quick CTA Card */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 text-center md:w-64">
            {!isOpen ? (
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-400">Queue Closed</span>
                <p className="text-[11px] text-slate-400">No new customers can take tickets.</p>
              </div>
            ) : hasActiveTicket ? (
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-emerald-400">
                  You Hold Ticket
                </div>
                <div className="text-4xl font-black text-white font-mono">
                  #{userTicket?.ticketId.toString()}
                </div>
                {userTicket?.status === TicketStatus.Waiting && (
                  <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{isLeaving ? 'Leaving...' : 'Cancel My Ticket'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-400">Ready to join?</div>
                <button
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Take a Ticket'}
                </button>
                <div className="text-[11px] text-slate-400">
                  Instant ticket via BOT Chain
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Currently Serving</div>
            <div className="text-2xl font-black text-indigo-400 font-mono mt-0.5">
              {queue.currentTicketServed > 0n ? `#${queue.currentTicketServed.toString()}` : '—'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Waiting in Line</div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
              {queue.waitingCount.toString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Completed / Served</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {queue.servedCount.toString()}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Issued</div>
            <div className="text-2xl font-black text-slate-200 font-mono mt-0.5">
              {queue.totalTickets.toString()}
            </div>
          </div>
        </div>
      </div>

      {/* User Active Ticket Banner if exists */}
      {hasActiveTicket && userTicket && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black font-mono text-2xl">
              #{userTicket.ticketId.toString()}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-white">Your Active Ticket</span>
                <TicketStatusBadge status={userTicket.status} size="sm" />
              </div>
              <p className="text-xs text-slate-300">
                {userTicket.status === TicketStatus.Called
                  ? 'Your ticket is called! Please proceed immediately to receive service.'
                  : position > 0
                  ? `You are #${position} in line (${Math.max(0, position - 1)} people ahead of you).`
                  : 'Ticket is waiting in line.'}
              </p>
            </div>
          </div>

          {isOwner && (
            <Link
              to="/business"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl"
            >
              Open Owner Controls
            </Link>
          )}
        </div>
      )}

      {/* Live Ticket Timeline / Roster */}
      <div className="p-6 rounded-2xl glass-panel border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Live Ticket Stream
            </h3>
            <p className="text-xs text-slate-400">
              Real-time ticket progression on the BOT Chain ledger
            </p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No tickets issued yet. Be the first to take a ticket!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {tickets.map((t) => {
              const isUserTicket =
                address && t.customer.toLowerCase() === address.toLowerCase();
              return (
                <div
                  key={t.ticketId.toString()}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                    t.status === TicketStatus.Called
                      ? 'bg-indigo-950/60 border-indigo-500/60 ring-2 ring-indigo-500/30'
                      : t.status === TicketStatus.Waiting
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : t.status === TicketStatus.Served
                      ? 'bg-slate-900/40 border-slate-800/80 opacity-60'
                      : 'bg-rose-950/10 border-rose-500/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-base font-extrabold text-white">
                      #{t.ticketId.toString()}
                    </span>
                    {isUserTicket && (
                      <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        You
                      </span>
                    )}
                  </div>
                  <TicketStatusBadge status={t.status} size="sm" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

