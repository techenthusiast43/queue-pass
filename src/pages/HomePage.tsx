import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Users, 
  Layers, 
  PlusCircle, 
  Search, 
  Clock, 
  ArrowRight, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { QueueData, QueueStatus } from '../types';
import { QueueStatusBadge } from '../components/StatusBadge';

interface HomePageProps {
  queues: QueueData[];
  loadingQueues: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onJoinQueue: (queueId: bigint) => Promise<boolean>;
}

export const HomePage: React.FC<HomePageProps> = ({
  queues,
  loadingQueues,
  onRefresh,
  onOpenCreateModal,
  onJoinQueue,
}) => {
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [joiningId, setJoiningId] = useState<bigint | null>(null);

  // Filter queues
  const filteredQueues = queues.filter((q) => {
    const matchesSearch =
      q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toString() === searchTerm;

    if (statusFilter === 'active') return matchesSearch && q.status === QueueStatus.Active;
    if (statusFilter === 'closed') return matchesSearch && q.status === QueueStatus.Closed;
    return matchesSearch;
  });

  const totalWaiting = queues.reduce((sum, q) => sum + Number(q.waitingCount), 0);
  const totalServed = queues.reduce((sum, q) => sum + Number(q.servedCount), 0);

  const handleJoin = async (queueId: bigint) => {
    if (!isConnected) {
      open();
      return;
    }
    setJoiningId(queueId);
    try {
      await onJoinQueue(queueId);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          {/* BOT Chain Testnet Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-xs font-medium text-emerald-300 mb-6 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live on BOT Chain Testnet</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-slate-400">Chain ID: 968</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Next-Gen Decentralized <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Queue Management
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Eliminate physical waiting lines. Businesses issue verifiable on-chain tickets, while customers track live positions directly on BOT Chain.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => {
                if (!isConnected) {
                  open();
                } else {
                  onOpenCreateModal();
                }
              }}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/35 transition-all flex items-center gap-2 transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>Create a Queue</span>
            </button>

            <a
              href="#browse-queues"
              className="px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Browse Active Queues</span>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl glass-card text-left">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Total Queues
              </div>
              <div className="text-2xl font-bold text-white font-mono">{queues.length}</div>
            </div>

            <div className="p-4 rounded-xl glass-card text-left">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                People Waiting
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalWaiting}</div>
            </div>

            <div className="p-4 rounded-xl glass-card text-left">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Customers Served
              </div>
              <div className="text-2xl font-bold text-white font-mono">{totalServed}</div>
            </div>

            <div className="p-4 rounded-xl glass-card text-left">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Speed & Finality
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">Sub-Second</div>
            </div>
          </div>
        </div>
      </section>

      {/* Directory Section */}
      <section id="browse-queues" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-400" />
              Active Queues
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a queue to view details, monitor real-time ticket progression, or join line.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={loadingQueues}
              title="Refresh queues from BOT Chain"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingQueues ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (!isConnected) open();
                else onOpenCreateModal();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>Create Queue</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by queue name, service note, or queue ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 shrink-0">
            {(['all', 'active', 'closed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === filter
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Queues List */}
        {loadingQueues && queues.length === 0 ? (
          <div className="text-center py-20 rounded-2xl glass-card border border-slate-800">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-300">Loading queues from BOT Chain...</p>
          </div>
        ) : filteredQueues.length === 0 ? (
          <div className="text-center py-20 rounded-2xl glass-card border border-slate-800/80">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No queues found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              {searchTerm
                ? 'No queues match your search query.'
                : 'There are currently no queues deployed on this contract instance.'}
            </p>
            <button
              onClick={() => {
                if (!isConnected) open();
                else onOpenCreateModal();
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
            >
              Create the First Queue
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredQueues.map((q) => {
              const isOpen = q.status === QueueStatus.Active;
              return (
                <div
                  key={q.id.toString()}
                  className="rounded-2xl glass-panel border border-slate-800/90 p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl transition-all group"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        Queue #{q.id.toString()}
                      </span>
                      <QueueStatusBadge status={q.status} />
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                      {q.name}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 min-h-[32px]">
                      {q.description || 'No additional service notes provided.'}
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-5">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Serving</div>
                        <div className="text-sm font-bold text-indigo-400 font-mono">
                          {q.currentTicketServed > 0n ? `#${q.currentTicketServed.toString()}` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Waiting</div>
                        <div className="text-sm font-bold text-amber-400 font-mono">
                          {q.waitingCount.toString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Total Issued</div>
                        <div className="text-sm font-bold text-slate-300 font-mono">
                          {q.totalTickets.toString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <Link
                      to={`/queue/${q.id.toString()}`}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    {isOpen && (
                      <button
                        onClick={() => handleJoin(q.id)}
                        disabled={joiningId === q.id}
                        className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {joiningId === q.id ? 'Joining...' : 'Take Ticket'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

