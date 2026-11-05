import { defineChain } from 'viem';

// Official BOT Chain Testnet configuration
export const botchainTestnet = defineChain({
  id: 968,
  name: 'BOT Chain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.bohr.life'],
    },
    public: {
      http: ['https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: 'https://scan.bohr.life',
    },
  },
  testnet: true,
});

// Official BOT Chain Mainnet configuration
export const botchainMainnet = defineChain({
  id: 677,
  name: 'BOT Chain',
  nativeCurrency: {
    decimals: 18,
    name: 'BOT',
    symbol: 'BOT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.botchain.ai'],
    },
    public: {
      http: ['https://rpc.botchain.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BOTScan',
      url: 'https://scan.botchain.ai',
    },
  },
  testnet: false,
});

// Default contract address (can be set via VITE_CONTRACT_ADDRESS or customized in UI)
export const DEFAULT_CONTRACT_ADDRESS: `0x${string}` = (
  (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) ||
  '0xbC40237702cCA86cC09231c3951271e47DDCC1Aa'
);

export const QUEUE_PASS_ABI = [
  {
    "type": "error",
    "name": "AlreadyHasActiveTicket",
    "inputs": []
  },
  {
    "type": "error",
    "name": "EmptyQueueName",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidTicketTransition",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoActiveTicket",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoWaitingCustomers",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotQueueOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QueueAlreadyClosed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QueueNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QueueNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TicketNotFound",
    "inputs": []
  },
  {
    "type": "event",
    "name": "CustomerServed",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "ticketId", "type": "uint256", "indexed": true },
      { "name": "customer", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "QueueClosed",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "QueueCreated",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "name", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketCancelled",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "ticketId", "type": "uint256", "indexed": true },
      { "name": "customer", "type": "address", "indexed": true },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketCalled",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "ticketId", "type": "uint256", "indexed": true },
      { "name": "customer", "type": "address", "indexed": true },
      { "name": "ticketNumber", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TicketIssued",
    "inputs": [
      { "name": "queueId", "type": "uint256", "indexed": true },
      { "name": "ticketId", "type": "uint256", "indexed": true },
      { "name": "customer", "type": "address", "indexed": true },
      { "name": "ticketNumber", "type": "uint256", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ],
    "anonymous": false
  },
  {
    "type": "function",
    "name": "callNext",
    "inputs": [{ "name": "queueId", "type": "uint256" }],
    "outputs": [{ "name": "ticketId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "closeQueue",
    "inputs": [{ "name": "queueId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createQueue",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "description", "type": "string" }
    ],
    "outputs": [{ "name": "queueId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getPositionInLine",
    "inputs": [
      { "name": "queueId", "type": "uint256" },
      { "name": "ticketId", "type": "uint256" }
    ],
    "outputs": [{ "name": "position", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getQueueCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getQueueStatus",
    "inputs": [{ "name": "queueId", "type": "uint256" }],
    "outputs": [
      { "name": "id", "type": "uint256" },
      { "name": "owner", "type": "address" },
      { "name": "name", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "status", "type": "uint8" },
      { "name": "totalTickets", "type": "uint256" },
      { "name": "currentTicketServed", "type": "uint256" },
      { "name": "waitingCount", "type": "uint256" },
      { "name": "servedCount", "type": "uint256" },
      { "name": "cancelledCount", "type": "uint256" },
      { "name": "createdAt", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getQueueTickets",
    "inputs": [
      { "name": "queueId", "type": "uint256" },
      { "name": "startTicketId", "type": "uint256" },
      { "name": "count", "type": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          { "name": "ticketId", "type": "uint256" },
          { "name": "queueId", "type": "uint256" },
          { "name": "customer", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "joinedAt", "type": "uint256" },
          { "name": "updatedAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getQueues",
    "inputs": [
      { "name": "startId", "type": "uint256" },
      { "name": "count", "type": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "owner", "type": "address" },
          { "name": "name", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "status", "type": "uint8" },
          { "name": "totalTickets", "type": "uint256" },
          { "name": "currentTicketServed", "type": "uint256" },
          { "name": "nextTicketToCall", "type": "uint256" },
          { "name": "waitingCount", "type": "uint256" },
          { "name": "servedCount", "type": "uint256" },
          { "name": "cancelledCount", "type": "uint256" },
          { "name": "createdAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTicket",
    "inputs": [
      { "name": "queueId", "type": "uint256" },
      { "name": "ticketId", "type": "uint256" }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "ticketId", "type": "uint256" },
          { "name": "queueId", "type": "uint256" },
          { "name": "customer", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "joinedAt", "type": "uint256" },
          { "name": "updatedAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserTicketInfo",
    "inputs": [
      { "name": "queueId", "type": "uint256" },
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "hasActiveTicket", "type": "bool" },
      {
        "name": "ticket",
        "type": "tuple",
        "components": [
          { "name": "ticketId", "type": "uint256" },
          { "name": "queueId", "type": "uint256" },
          { "name": "customer", "type": "address" },
          { "name": "status", "type": "uint8" },
          { "name": "joinedAt", "type": "uint256" },
          { "name": "updatedAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "joinQueue",
    "inputs": [{ "name": "queueId", "type": "uint256" }],
    "outputs": [{ "name": "ticketId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "leaveQueue",
    "inputs": [{ "name": "queueId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "markServed",
    "inputs": [
      { "name": "queueId", "type": "uint256" },
      { "name": "ticketId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
] as const;

