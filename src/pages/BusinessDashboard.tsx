import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Briefcase, 
  PlusCircle, 
  PhoneCall, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Lock, 
  RefreshCw, 
  ExternalLink,
  Users,
  AlertCircle
} from 'lucide-react';
import { QueueData, TicketData, TicketStatus, QueueStatus } from '../types';
import { TicketStatusBadge, QueueStatusBadge } from '../components/StatusBadge';

interface BusinessDashboardProps {
  queues: QueueData[];
  loadingQueues: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  fetchQueueTickets: (queueId: bigint, count: number) => Promise<TicketData[]>;
  onCallNext: (queueId: bigint) => Promise<boolean>;
  onMarkServed: (queueId: bigint, ticketId: bigint) => Promise<boolean>;
  onCloseQueue: (queueId: bigint) => Promise<boolean>;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
  queues,
  loadingQueues,
  onRefresh,
  onOpenCreateModal,
  fetchQueueTickets,
  onCallNext,
  onMarkServed,
  onCloseQueue,
}) => {
  const { address, isConnected } = useAccount();
  const { open } = useAppKit();

  // Find queues owned by connected address
  const ownedQueues = queues.filter(
    (q) => address && q.owner.toLowerCase() === address.toLowerCase()
  );

  const [selectedQueueId, setSelectedQueueId] = useState<bigint | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'waiting' | 'called' | 'served' | 'cancelled'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Set default selected queue
  useEffect(() => {
    if (ownedQueues.length > 0 && !selectedQueueId) {
      setSelectedQueueId(ownedQueues[0].id);
    } else if (ownedQueues.length === 0) {
      setSelectedQueueId(null);
    }
  }, [ownedQueues, selectedQueueId]);

  // Active selected queue
  const currentQueue = ownedQueues.find((q) => q.id === selectedQueueId);

  // Load tickets for selected queue
  const loadTickets = async () => {
    if (!currentQueue) return;
    setLoadingTickets(true);
    try {
      const data = await fetchQueueTickets(currentQueue.id, Number(currentQueue.totalTickets));
      setTickets(data);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (currentQueue) {
      loadTickets();
    } else {
      setTickets([]);
    }
  }, [currentQueue?.id, currentQueue?.totalTickets, currentQueue?.waitingCount]);

  // Actions
  const handleCallNext = async () => {
    if (!currentQueue) return;
    setActionLoading('callNext');
    try {
      const success = await onCallNext(currentQueue.id);
      if (success) {
        await loadTickets();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkServed = async (ticketId: bigint) => {
    if (!currentQueue) return;
    setActionLoading(`markServed-${ticketId}`);
    try {
      const success = await onMarkServed(currentQueue.id, ticketId);
      if (success) {
        await loadTickets();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseQueue = async () => {
    if (!currentQueue) return;
    setActionLoading('closeQueue');
    try {
      const success = await onCloseQueue(currentQueue.id);
      if (success) {
        setShowCloseConfirm(false);
        await onRefresh();
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    if (ticketFilter === 'waiting') return t.status === TicketStatus.Waiting;
    if (ticketFilter === 'called') return t.status === TicketStatus.Called;
    if (ticketFilter === 'served') return t.status === TicketStatus.Served;
    if (ticketFilter === 'cancelled') return t.status === TicketStatus.Cancelled;
    return true;
  });

  // Called tickets that need serving
  const activeCalledTickets = tickets.filter((t) => t.status === TicketStatus.Called);

  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <Briefcase className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect Your Business Wallet</h2>
        <p className="text-sm text-slate-300 mb-6 max-w-md mx-auto">
          Connect the wallet you used to create queues to manage incoming tickets, call customers, and complete services.
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Merchant Panel
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Owner: {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-emerald-400" />
            Business Management Hub
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loadingQueues}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Refresh state"
          >
            <RefreshCw className={`w-4 h-4 ${loadingQueues ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Queue</span>
          </button>
        </div>
      </div>

      {ownedQueues.length === 0 ? (
        /* Empty State */
        <div className="text-center py-20 rounded-2xl glass-card border border-slate-800">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">No Queues Owned Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            You have not created any queues with this wallet on BOT Chain. Create your first queue to start issuing digital tickets.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
          >
            Create Your First Queue
          </button>
        </div>
      ) : (
        /* Dashboard Content */
        <div className="space-y-6">
          {/* Queue Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            {ownedQueues.map((q) => {
              const isSelected = q.id === selectedQueueId;
              return (
                <button
                  key={q.id.toString()}
                  onClick={() => setSelectedQueueId(q.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{q.name}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{q.id.toString()}
                  </span>
                </button>
              );
            })}
          </div>

          {currentQueue && (
            <>
              {/* Queue Controls & Metrics Overview */}
              <div className="p-6 rounded-2xl glass-panel border border-slate-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">{currentQueue.name}</h2>
                      <QueueStatusBadge status={currentQueue.status} />
                    </div>
                    <p className="text-sm text-slate-400 max-w-xl">
                      {currentQueue.description || 'No notes set for this queue.'}
                    </p>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {currentQueue.status === QueueStatus.Active ? (
                      <>
                        <button
                          onClick={handleCallNext}
                          disabled={actionLoading === 'callNext' || currentQueue.waitingCount === 0n}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                          <PhoneCall className={`w-4 h-4 ${actionLoading === 'callNext' ? 'animate-bounce' : ''}`} />
                          <span>
                            {actionLoading === 'callNext'
                              ? 'Calling...'
                              : currentQueue.waitingCount === 0n
                              ? 'No Waiting Customers'
                              : 'Call Next Customer'}
                          </span>
                        </button>

                        <button
                          onClick={() => setShowCloseConfirm(true)}
                          disabled={actionLoading === 'closeQueue'}
                          className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-sm font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Close Queue</span>
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <span>Queue Closed (No new tickets accepted)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics 4-Box Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-amber-400 mb-1 font-semibold">
                      <span>Waiting</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">
                      {currentQueue.waitingCount.toString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Pending in line</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-indigo-400 mb-1 font-semibold">
                      <span>Called (Active)</span>
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">
                      {activeCalledTickets.length}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Ready to be served</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-emerald-400 mb-1 font-semibold">
                      <span>Served</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">
                      {currentQueue.servedCount.toString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Completed orders</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between text-xs text-rose-400 mb-1 font-semibold">
                      <span>Cancelled</span>
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-extrabold text-white font-mono">
                      {currentQueue.cancelledCount.toString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Left the line</div>
                  </div>
                </div>
              </div>

              {/* Spotlight: Active Called Tickets (Need Action) */}
              {activeCalledTickets.length > 0 && (
                <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <h3 className="text-base font-bold text-indigo-300 uppercase tracking-wider">
                      Currently Called — Awaiting Service
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCalledTickets.map((t) => (
                      <div
                        key={t.ticketId.toString()}
                        className="p-5 rounded-xl bg-slate-900/90 border border-indigo-500/40 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-xs text-indigo-400 font-semibold mb-0.5">
                            Ticket Number
                          </div>
                          <div className="text-3xl font-extrabold text-white font-mono">
                            #{t.ticketId.toString()}
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            Customer: {`${t.customer.slice(0, 6)}...${t.customer.slice(-4)}`}
                          </div>
                        </div>

                        <button
                          onClick={() => handleMarkServed(t.ticketId)}
                          disabled={actionLoading === `markServed-${t.ticketId}`}
                          className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {actionLoading === `markServed-${t.ticketId}`
                              ? 'Confirming...'
                              : 'Mark as Served'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Ledger Table */}
              <div className="p-6 rounded-2xl glass-panel border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Queue Tickets Ledger
                    </h3>
                    <p className="text-xs text-slate-400">
                      All tickets generated on BOT Chain for Queue #{currentQueue.id.toString()}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap rounded-xl bg-slate-900 p-1 border border-slate-800">
                    {(['all', 'waiting', 'called', 'served', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setTicketFilter(filter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                          ticketFilter === filter
                            ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTickets ? (
                  <div className="text-center py-16">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading tickets from blockchain...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-sm">
                    No tickets found matching the selected filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="py-3 px-4">Ticket #</th>
                          <th className="py-3 px-4">Customer Wallet</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Issued At</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredTickets.map((t) => {
                          const isCalled = t.status === TicketStatus.Called;
                          return (
                            <tr key={t.ticketId.toString()} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                                #{t.ticketId.toString()}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-300">
                                <a
                                  href={`https://scan.bohr.life/address/${t.customer}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-emerald-400 flex items-center gap-1"
                                >
                                  <span>{`${t.customer.slice(0, 6)}...${t.customer.slice(-4)}`}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-500" />
                                </a>
                              </td>
                              <td className="py-3.5 px-4">
                                <TicketStatusBadge status={t.status} size="sm" />
                              </td>
                              <td className="py-3.5 px-4 text-slate-400">
                                {new Date(Number(t.joinedAt) * 1000).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {isCalled && (
                                  <button
                                    onClick={() => handleMarkServed(t.ticketId)}
                                    disabled={actionLoading === `markServed-${t.ticketId}`}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 shadow-sm disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Mark Served</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Close Queue Confirmation Modal */}
      {showCloseConfirm && currentQueue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-rose-500/30 bg-slate-900 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Close This Queue?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Closing <strong>{currentQueue.name}</strong> is an irreversible action on BOT Chain. Customers will no longer be able to take tickets for this queue.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseQueue}
                disabled={actionLoading === 'closeQueue'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white transition-all disabled:opacity-50"
              >
                {actionLoading === 'closeQueue' ? 'Closing...' : 'Yes, Close Queue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

