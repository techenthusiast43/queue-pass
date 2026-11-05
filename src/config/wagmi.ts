import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { botchainTestnet, botchainMainnet } from '../contracts/config';

// 1. Get projectId from https://cloud.reown.com (public fallback provided for zero-friction setup)
export const projectId = (
  (import.meta.env.VITE_REOWN_PROJECT_ID as string) ||
  'c4f79cc821944d9680842e34466bfbd'
);

// 2. Set up target networks (BOT Chain Testnet primary, Mainnet supported)
export const networks = [botchainTestnet, botchainMainnet] as const;

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [botchainTestnet, botchainMainnet],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

// 4. Initialize Reown AppKit modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [botchainTestnet, botchainMainnet],
  defaultNetwork: botchainTestnet,
  projectId,
  metadata: {
    name: 'QueuePass',
    description: 'Decentralized Queue Management Application on BOT Chain',
    url: 'https://queuepass.botchain.ai',
    icons: ['https://avatars.githubusercontent.com/u/179229932'],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#10B981',
    '--w3m-color-mix': '#0B0F19',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '12px',
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

