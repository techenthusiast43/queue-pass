import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  User, 
  Clock, 
  ArrowRight, 
  PhoneCall, 
  CheckCircle2, 
  LogOut, 
  RefreshCw, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { QueueData, TicketStatus, UserTicketInfo, QueueStatus } from '../types';
import { TicketStatusBadge } from '../components/StatusBadge';

interface CustomerDashboardProps {
  queues: QueueData[];
  loadingQueues: boolean;
  onRefresh: () => void;
  fetchUserTicketInQueue: (queueId: bigint, userAddress: `0x${string}`) => Promise<UserTicketInfo>;
  onLeaveQueue: (queueId: bigint) => Promise<boolean>;
  onJoinQueue: (queueId: bigint) => Promise<boolean>;
}

interface ActiveUserTicketEntry {
  queue: QueueData;
  info: UserTicketInfo;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  queues,
  loadingQueues,
  onRefresh,
  fetchUserTicketInQueue,
  onLeaveQueue,
  onJoinQueue,
}) => {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  const [activeTickets, setActiveTickets] = useState<ActiveUserTicketEntry[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [leavingQueueId, setLeavingQueueId] = useState<bigint | null>(null);
  const [joiningQueueId, setJoiningQueueId] = useState<bigint | null>(null);

  // Load customer's active tickets across all queues
  const loadUserTickets = async () => {
    if (!address || queues.length === 0) {
      setActiveTickets([]);
      return;
    }
    setLoadingTickets(true);
    try {
      const results: ActiveUserTicketEntry[] = [];
      for (const q of queues) {
        const info = await fetchUserTicketInQueue(q.id, address);
        if (info.hasActiveTicket && info.ticket.ticketId > 0n) {
          results.push({
            queue: q,
            info,
          });
        }
      }
      setActiveTickets(results);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    loadUserTickets();
  }, [address, queues]);

  const handleLeave = async (queueId: bigint) => {
    setLeavingQueueId(queueId);
    try {
      const success = await onLeaveQueue(queueId);
      if (success) {
        await loadUserTickets();
      }
    } finally {
      setLeavingQueueId(null);
    }
  };

  const handleJoin = async (queueId: bigint) => {
    setJoiningQueueId(queueId);
    try {
      const success = await onJoinQueue(queueId);
      if (success) {
        await loadUserTickets();
      }
    } finally {
      setJoiningQueueId(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <User className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
          Connect your EVM wallet to view your active queue tickets, track your real-time position in line, or join new queues.
        </p>
        <button
          onClick={() => open()}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // Active queues the customer has NOT joined yet
  const otherActiveQueues = queues.filter(
    (q) =>
      q.status === QueueStatus.Active &&
      !activeTickets.some((at) => at.queue.id === q.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Customer Pass
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">
              {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-emerald-400" />
            My Active Passes & Position
          </h1>
        </div>

        <button
          onClick={() => {
            onRefresh();
            loadUserTickets();
          }}
          disabled={loadingTickets || loadingQueues}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors self-start md:self-auto"
          title="Refresh ticket state"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Active Passes Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <span>Active Queue Tickets ({activeTickets.length})</span>
        </h2>

        {loadingTickets ? (
          <div className="text-center py-16 rounded-2xl glass-card border border-slate-800">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-300">Checking active tickets on BOT Chain...</p>
          </div>
        ) : activeTickets.length === 0 ? (
          <div className="p-8 rounded-2xl glass-card border border-slate-800 text-center">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">You Have No Active Tickets</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
              You are not currently waiting in any queues. Browse active queues below to get your digital ticket number.
            </p>
            <a
              href="#available-queues"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>Explore Queues</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTickets.map(({ queue, info }) => {
              const ticket = info.ticket;
              const isCalled = ticket.status === TicketStatus.Called;
              const isWaiting = ticket.status === TicketStatus.Waiting;
              const position = Number(info.positionInLine || 0n);
              const peopleAhead = Math.max(0, position - 1);

              return (
                <div
                  key={queue.id.toString()}
                  className={`p-6 rounded-2xl glass-panel border transition-all ${
                    isCalled
                      ? 'border-indigo-500/60 bg-indigo-950/20 ring-1 ring-indigo-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Queue #{queue.id.toString()}
                    </span>
                    <TicketStatusBadge status={ticket.status} size="md" />
                  </div>

                  {/* Business Title */}
                  <h3 className="text-xl font-bold text-white mb-1">{queue.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-6">
                    {queue.description || 'General queue'}
                  </p>

                  {/* Alert if Called! */}
                  {isCalled && (
                    <div className="p-4 mb-6 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 flex items-center gap-3 animate-pulse">
                      <PhoneCall className="w-6 h-6 text-indigo-400 shrink-0" />
                      <div>
                        <div className="font-bold text-sm">Your Ticket Has Been Called!</div>
                        <div className="text-xs text-indigo-300">
                          Please proceed to the counter or service area now.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ticket Visual Pass */}
                  <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Your Ticket Number
                      </div>
                      <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
                        #{ticket.ticketId.toString()}
                      </div>
                    </div>

                    {isWaiting && (
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Position In Line
                        </div>
                        <div className="text-3xl font-extrabold text-amber-400 font-mono">
                          {position > 0 ? `#${position}` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {peopleAhead === 0
                            ? "You're next in line!"
                            : `${peopleAhead} people ahead`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Queue Context Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs mb-6">
                    <div>
                      <span className="text-slate-500">Currently Serving: </span>
                      <span className="font-mono font-bold text-white">
                        {queue.currentTicketServed > 0n ? `#${queue.currentTicketServed.toString()}` : 'None'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500">Total Waiting: </span>
                      <span className="font-mono font-bold text-amber-400">
                        {queue.waitingCount.toString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <Link
                      to={`/queue/${queue.id.toString()}`}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>Live Board</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {isWaiting && (
                      <button
                        onClick={() => handleLeave(queue.id)}
                        disabled={leavingQueueId === queue.id}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{leavingQueueId === queue.id ? 'Leaving...' : 'Leave Queue'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Queues To Join */}
      <div id="available-queues" className="pt-8 border-t border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Available Queues to Join</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Take a ticket from other open queues on BOT Chain
            </p>
          </div>
        </div>

        {otherActiveQueues.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No other open queues available to join at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherActiveQueues.map((q) => (
              <div
                key={q.id.toString()}
                className="p-4 rounded-xl glass-card border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono text-slate-400">Queue #{q.id.toString()}</span>
                    <span className="text-emerald-400 font-medium">Open</span>
                  </div>
                  <h4 className="font-bold text-white text-base mb-1 line-clamp-1">{q.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {q.description || 'No service notes.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="text-xs">
                    <span className="text-slate-500">In Line: </span>
                    <span className="font-mono font-bold text-amber-400">
                      {q.waitingCount.toString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleJoin(q.id)}
                    disabled={joiningQueueId === q.id}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {joiningQueueId === q.id ? 'Joining...' : 'Take Ticket'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

