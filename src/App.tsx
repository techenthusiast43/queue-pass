import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useQueuePass } from './hooks/useQueuePass';
import { DEFAULT_CONTRACT_ADDRESS } from './contracts/config';
import { Navbar } from './components/Navbar';
import { CreateQueueModal } from './components/CreateQueueModal';
import { TransactionModal } from './components/TransactionModal';
import { HomePage } from './pages/HomePage';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { QueueDetailPage } from './pages/QueueDetailPage';
import { Layers, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export function App() {
  // Store custom contract address in localStorage if user updates it
  const [contractAddress, setContractAddress] = useState<`0x${string}`>(() => {
    const saved = localStorage.getItem('QUEUEPASS_CONTRACT_ADDRESS');
    return (saved as `0x${string}`) || DEFAULT_CONTRACT_ADDRESS;
  });

  const handleUpdateContractAddress = (newAddress: `0x${string}`) => {
    setContractAddress(newAddress);
    localStorage.setItem('QUEUEPASS_CONTRACT_ADDRESS', newAddress);
  };

  const {
    queues,
    loadingQueues,
    txStatus,
    clearTxStatus,
    fetchQueues,
    fetchQueueById,
    fetchQueueTickets,
    fetchUserTicketInQueue,
    createQueue,
    joinQueue,
    callNext,
    markServed,
    leaveQueue,
    closeQueue,
  } = useQueuePass(contractAddress);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingQueue, setIsCreatingQueue] = useState(false);

  const handleCreateQueue = async (name: string, description: string) => {
    setIsCreatingQueue(true);
    try {
      const success = await createQueue(name, description);
      if (success) {
        setIsCreateModalOpen(false);
      }
    } finally {
      setIsCreatingQueue(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#0B0F19] text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
        {/* Navigation */}
        <Navbar
          contractAddress={contractAddress}
          onUpdateContractAddress={handleUpdateContractAddress}
        />

        {/* Page Content */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  queues={queues}
                  loadingQueues={loadingQueues}
                  onRefresh={fetchQueues}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  onJoinQueue={joinQueue}
                />
              }
            />
            <Route
              path="/business"
              element={
                <BusinessDashboard
                  queues={queues}
                  loadingQueues={loadingQueues}
                  onRefresh={fetchQueues}
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                  fetchQueueTickets={fetchQueueTickets}
                  onCallNext={callNext}
                  onMarkServed={markServed}
                  onCloseQueue={closeQueue}
                />
              }
            />
            <Route
              path="/customer"
              element={
                <CustomerDashboard
                  queues={queues}
                  loadingQueues={loadingQueues}
                  onRefresh={fetchQueues}
                  fetchUserTicketInQueue={fetchUserTicketInQueue}
                  onLeaveQueue={leaveQueue}
                  onJoinQueue={joinQueue}
                />
              }
            />
            <Route
              path="/queue/:id"
              element={
                <QueueDetailPage
                  fetchQueueById={fetchQueueById}
                  fetchQueueTickets={fetchQueueTickets}
                  fetchUserTicketInQueue={fetchUserTicketInQueue}
                  onJoinQueue={joinQueue}
                  onLeaveQueue={leaveQueue}
                />
              }
            />
          </Routes>
        </main>

        {/* Global Modals */}
        <CreateQueueModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateQueue}
          isSubmitting={isCreatingQueue}
        />

        <TransactionModal
          status={txStatus}
          onClose={clearTxStatus}
          explorerBaseUrl="https://scan.bohr.life"
        />

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">QueuePass — BOT Chain</div>
                <div className="text-[11px] text-slate-500">
                  Decentralized Queue Management Protocol
                </div>
              </div>
            </div>

            {/* Network specs & links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>BOT Chain Testnet (ID: 968)</span>
              </span>
              <a
                href="https://scan.bohr.life"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>BohrScan Explorer</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <a
                href="https://rpc.bohr.life"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>RPC: rpc.bohr.life</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <a
                href="https://dev-docs.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>BOT Chain Docs</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>

            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} QueuePass. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

