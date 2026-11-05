import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAccount, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { 
  Layers, 
  User, 
  Briefcase, 
  Wallet, 
  Settings, 
  Check, 
  Copy, 
  ExternalLink,
  ChevronDown,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { botchainTestnet } from '../contracts/config';

interface NavbarProps {
  contractAddress: `0x${string}`;
  onUpdateContractAddress: (newAddress: `0x${string}`) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  contractAddress,
  onUpdateContractAddress,
}) => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { open } = useAppKit();

  const [showSettings, setShowSettings] = useState(false);
  const [addressInput, setAddressInput] = useState<string>(contractAddress);
  const [copied, setCopied] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const isWrongNetwork = isConnected && chainId !== botchainTestnet.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput.startsWith('0x') && addressInput.length === 42) {
      onUpdateContractAddress(addressInput as `0x${string}`);
      setShowSettings(false);
    }
  };

  const navLinks = [
    { label: 'Browse Queues', path: '/', icon: Layers },
    { label: 'Customer Dashboard', path: '/customer', icon: User },
    { label: 'Business Hub', path: '/business', icon: Briefcase },
  ];

  return (
    <>
      {/* Network mismatch warning banner */}
      {isWrongNetwork && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs md:text-sm text-amber-300 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>You are connected to Chain ID {chainId}. Please switch to BOT Chain Testnet (Chain ID: 968).</span>
          <button
            onClick={() => switchChain?.({ chainId: botchainTestnet.id })}
            className="ml-2 underline font-semibold hover:text-white transition-colors"
          >
            Switch Network
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    QueuePass
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    BOT Chain
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 hidden sm:block">
                  Decentralized Queue Manager
                </div>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right actions: Contract Badge & Wallet Connect */}
          <div className="flex items-center gap-3">
            {/* Contract config pill */}
            <button
              onClick={() => {
                setAddressInput(contractAddress);
                setShowSettings(true);
              }}
              title="Click to change or view contract address"
              className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`}</span>
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* Reown AppKit / Wagmi Wallet Button */}
            {!isConnected ? (
              <button
                onClick={() => open()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform active:scale-95"
              >
                <Wallet className="w-4 h-4 text-slate-950" />
                <span>Connect Wallet</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-emerald-500/50 text-xs md:text-sm text-slate-200 transition-all"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="font-mono font-medium">
                    {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showWalletDropdown && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel border border-slate-700 bg-slate-900 shadow-2xl p-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-800 text-slate-400">
                      Connected to <span className="text-emerald-400 font-semibold">BOT Chain (968)</span>
                    </div>
                    <button
                      onClick={() => {
                        open();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                    >
                      <span>Wallet Details</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <a
                      href={`https://scan.bohr.life/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between"
                    >
                      <span>View on BohrScan</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-400 flex items-center justify-between mt-1"
                    >
                      <span>Disconnect</span>
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950/80 px-2 py-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                  isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Contract Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                Smart Contract Configuration
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              QueuePass interacts directly with the Solidity contract on BOT Chain Testnet. You can inspect the contract on BohrScan or point the dApp to your own deployed contract address.
            </p>

            <form onSubmit={handleSaveContract} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contract Address (BOT Chain Testnet - 968)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <a
                  href={`https://scan.bohr.life/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
                >
                  View Contract on BohrScan Explorer
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-xs"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

