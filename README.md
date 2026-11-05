# QueuePass — Decentralized Queue Management on BOT Chain

**QueuePass** is a responsive, decentralized application (dApp) built for **BOT Chain** that revolutionizes digital line management. Businesses can launch transparent on-chain queues, and customers can take tickets, monitor live positions in line, and track service status in real-time.

---

## 🌐 Official BOT Chain Network Configuration

QueuePass is configured natively for BOT Chain using verified developer endpoints:

### **BOT Chain Testnet (Target Network)**
- **Network Name:** BOT Chain Testnet
- **Chain ID:** `968` (`0x3c8`)
- **Native Token:** `BOT` (18 decimals)
- **RPC URL:** `https://rpc.bohr.life`
- **Block Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)
- **Total Supply:** 150 Million BOT

### **BOT Chain Mainnet**
- **Network Name:** BOT Chain
- **Chain ID:** `677` (`0x2a5`)
- **Native Token:** `BOT` (18 decimals)
- **RPC URL:** `https://rpc.botchain.ai`
- **Block Explorer:** [https://scan.botchain.ai/](https://scan.botchain.ai/)

---

## ⚙️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Web3 & Wallet Connectivity:**
  - `@reown/appkit` & `@reown/appkit-adapter-wagmi`
  - `wagmi@2.x` & `viem`
  - `@tanstack/react-query`
- **Smart Contract:** Solidity `^0.8.24` compiled with Hardhat
- **Icons & UI:** Lucide React, Glassmorphism, Tailwind CSS

---

## 📜 Smart Contract Architecture (`QueuePass.sol`)

The `QueuePass.sol` contract enforces queue integrity, chronological fairness, and access control:

| Function | Access | Description |
| :--- | :--- | :--- |
| `createQueue(name, description)` | Anyone | Creates a new queue on BOT Chain and assigns a unique `queueId`. The caller becomes the queue `owner`. |
| `joinQueue(queueId)` | Customer | Joins an active queue, allocates the next sequential ticket number, and prevents duplicate active tickets. |
| `callNext(queueId)` | Queue Owner | Identifies the next waiting customer, transitions ticket to `Called`, and updates queue state. Automatically skips cancelled tickets. |
| `markServed(queueId, ticketId)` | Queue Owner | Marks a called ticket as `Served`, records service completion, and releases the customer's active ticket lock. |
| `leaveQueue(queueId)` | Customer | Allows a waiting customer to leave the line, setting ticket status to `Cancelled`. |
| `closeQueue(queueId)` | Queue Owner | Closes the queue permanently; no further tickets may be issued. |
| `getQueueStatus(queueId)` | View | Returns full queue state and statistics. |
| `getPositionInLine(queueId, ticketId)` | View | Calculates how many waiting customers are ahead of a ticket. |
| `getQueues(startId, count)` | View | Batch retrieval of queues for directory browsing. |
| `getQueueTickets(queueId, startId, count)` | View | Batch retrieval of tickets for the business dashboard. |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+` (or `v24+`)
- An EVM-compatible wallet (MetaMask, Rabby, Coinbase Wallet)
- BOT testnet tokens (obtainable from the BOT Chain faucet)

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Run Smart Contract Tests
Execute the comprehensive test suite covering permissions, sequential ticketing, duplicate prevention, cancellations, and status transitions:
```bash
npm run test
```

### 4. Deploy to BOT Chain Testnet
Set your deployer private key:
```bash
# Windows PowerShell
$env:PRIVATE_KEY="your_private_key_here"

# Linux / macOS
export PRIVATE_KEY="your_private_key_here"
```

Run the deployment script:
```bash
npm run deploy:testnet
```
The script will output the deployed contract address and BohrScan block explorer link.

### 5. Launch the Frontend
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Frontend Features & Pages

### 1. **Home Page (`/`)**
- QueuePass branding and BOT Chain Testnet status pill.
- Live platform metrics (total queues, customers waiting, served count).
- Search and filter active/closed queues.
- Quick "Take Ticket" and "Create Queue" buttons.

### 2. **Business Dashboard (`/business`)**
- Switch between owned queues.
- Real-time queue metrics: **Waiting**, **Called**, **Served**, and **Cancelled**.
- Spotlight for actively called tickets with instant **"Mark as Served"** execution.
- **"Call Next Customer"** button that queries the next waiting ticket on-chain.
- Complete tickets ledger with status filter.
- Safe **"Close Queue"** modal.

### 3. **Customer Dashboard (`/customer`)**
- "My Active Passes" showing all queues you are currently waiting in.
- Real-time line position tracking: *"You are #2 in line (1 person ahead of you)"*.
- Visual alert banner when your ticket is **Called**.
- **"Leave Queue"** button to cancel your waiting ticket.
- Directory of other open queues to join.

### 4. **Queue Details Page (`/queue/:id`)**
- Live board displaying current ticket being served and people waiting.
- Shareable queue URL with one-click link copying.
- Live ticket grid showing ticket numbers and color-coded status badges.
- One-click **"Take a Ticket"** interaction.

---

## 🔒 Security & Best Practices
- **No Mock Transactions:** All reads and writes interface with the real BOT Chain network.
- **Custom Error Handling:** Decodes reverts (`AlreadyHasActiveTicket`, `NotQueueOwner`, `NoWaitingCustomers`, `QueueNotActive`) into clear user feedback.
- **Explorer Verification:** Every transaction modal displays a direct link to the transaction on `https://scan.bohr.life/tx/{txHash}`.
- **Strict State Machines:** Tickets follow `Waiting -> Called -> Served` or `Waiting -> Cancelled`.

---

## 📄 License
MIT License.

