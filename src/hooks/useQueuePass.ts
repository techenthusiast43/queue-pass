import { useState, useCallback, useEffect } from 'react';
import { 
  useAccount, 
  usePublicClient, 
  useWalletClient,
  useChainId,
  useSwitchChain 
} from 'wagmi';
import { createPublicClient, http } from 'viem';
import { 
  QUEUE_PASS_ABI, 
  botchainTestnet, 
  DEFAULT_CONTRACT_ADDRESS 
} from '../contracts/config';
import { QueueData, TicketData, UserTicketInfo, TxStatus } from '../types';

// Fallback public client for reading BOT Chain even when wallet is not connected
const fallbackPublicClient = createPublicClient({
  chain: botchainTestnet,
  transport: http('https://rpc.bohr.life'),
});

export function useQueuePass(customContractAddress?: `0x${string}`) {
  const contractAddress = customContractAddress || DEFAULT_CONTRACT_ADDRESS;
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient() || fallbackPublicClient;
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [queues, setQueues] = useState<QueueData[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: 'idle' });

  const clearTxStatus = useCallback(() => {
    setTxStatus({ step: 'idle' });
  }, []);

  // Format EVM error message
  const parseContractError = (err: any): string => {
    const errorStr = (err?.message || err?.shortMessage || String(err)).toLowerCase();

    if (errorStr.includes('alreadyhasactiveticket')) {
      return 'You already hold an active ticket in this queue.';
    }
    if (errorStr.includes('nowaitingcustomers')) {
      return 'No waiting customers remaining in the queue.';
    }
    if (errorStr.includes('notqueueowner')) {
      return 'Unauthorized: Only the queue owner can perform this action.';
    }
    if (errorStr.includes('queuenotactive') || errorStr.includes('queuealreadyclosed')) {
      return 'This queue has been closed and cannot accept actions.';
    }
    if (errorStr.includes('invalidtickettransition')) {
      return 'Action rejected: Invalid ticket status transition.';
    }
    if (errorStr.includes('noactiveticket')) {
      return 'You do not hold an active waiting ticket in this queue.';
    }
    if (errorStr.includes('user rejected') || errorStr.includes('rejected by user') || errorStr.includes('denied')) {
      return 'Transaction signature was rejected by user in wallet.';
    }
    if (errorStr.includes('insufficient funds')) {
      return 'Insufficient BOT tokens to pay for network gas. Please fund your wallet via the BOT Chain faucet.';
    }

    return err?.shortMessage || err?.message || 'Transaction failed on BOT Chain.';
  };

  // Ensure user is on BOT Chain Testnet before sending tx
  const ensureCorrectNetwork = async () => {
    if (chainId !== botchainTestnet.id && switchChainAsync) {
      try {
        await switchChainAsync({ chainId: botchainTestnet.id });
      } catch (e) {
        throw new Error('Please switch your wallet network to BOT Chain Testnet (Chain ID 968).');
      }
    }
  };

  // Fetch all queues from the smart contract
  const fetchQueues = useCallback(async () => {
    try {
      setLoadingQueues(true);
      const totalCount = await fallbackPublicClient.readContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: 'getQueueCount',
      }) as bigint;

      const count = Number(totalCount);
      if (count === 0) {
        setQueues([]);
        return;
      }

      // Fetch batch of queues
      const queueList = await fallbackPublicClient.readContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: 'getQueues',
        args: [1n, BigInt(count)],
      }) as any[];

      const formatted: QueueData[] = queueList.map((q) => ({
        id: BigInt(q.id),
        owner: q.owner,
        name: q.name,
        description: q.description,
        status: Number(q.status),
        totalTickets: BigInt(q.totalTickets),
        currentTicketServed: BigInt(q.currentTicketServed),
        waitingCount: BigInt(q.waitingCount),
        servedCount: BigInt(q.servedCount),
        cancelledCount: BigInt(q.cancelledCount),
        createdAt: BigInt(q.createdAt),
      }));

      // Sort with newest first
      formatted.sort((a, b) => Number(b.id - a.id));
      setQueues(formatted);
    } catch (err) {
      console.warn('Failed to fetch queues from contract:', err);
    } finally {
      setLoadingQueues(false);
    }
  }, [contractAddress]);

  // Fetch single queue status
  const fetchQueueById = useCallback(async (queueId: bigint): Promise<QueueData | null> => {
    try {
      const q = await fallbackPublicClient.readContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: 'getQueueStatus',
        args: [queueId],
      }) as any;

      return {
        id: BigInt(q[0]),
        owner: q[1],
        name: q[2],
        description: q[3],
        status: Number(q[4]),
        totalTickets: BigInt(q[5]),
        currentTicketServed: BigInt(q[6]),
        waitingCount: BigInt(q[7]),
        servedCount: BigInt(q[8]),
        cancelledCount: BigInt(q[9]),
        createdAt: BigInt(q[10]),
      };
    } catch (err) {
      console.error('Error fetching queue by id:', err);
      return null;
    }
  }, [contractAddress]);

  // Fetch tickets for a specific queue
  const fetchQueueTickets = useCallback(async (queueId: bigint, count: number): Promise<TicketData[]> => {
    try {
      if (count === 0) return [];
      const rawTickets = await fallbackPublicClient.readContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: 'getQueueTickets',
        args: [queueId, 1n, BigInt(count)],
      }) as any[];

      return rawTickets.map((t) => ({
        ticketId: BigInt(t.ticketId),
        queueId: BigInt(t.queueId),
        customer: t.customer,
        status: Number(t.status),
        joinedAt: BigInt(t.joinedAt),
        updatedAt: BigInt(t.updatedAt),
      }));
    } catch (err) {
      console.error('Error fetching queue tickets:', err);
      return [];
    }
  }, [contractAddress]);

  // Fetch user's active ticket and position in a given queue
  const fetchUserTicketInQueue = useCallback(async (queueId: bigint, userAddress: `0x${string}`): Promise<UserTicketInfo> => {
    try {
      const [hasActive, rawTicket] = await fallbackPublicClient.readContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: 'getUserTicketInfo',
        args: [queueId, userAddress],
      }) as [boolean, any];

      if (!hasActive || Number(rawTicket.ticketId) === 0) {
        return {
          hasActiveTicket: false,
          ticket: {
            ticketId: 0n,
            queueId,
            customer: userAddress,
            status: 0,
            joinedAt: 0n,
            updatedAt: 0n,
          },
        };
      }

      const ticket: TicketData = {
        ticketId: BigInt(rawTicket.ticketId),
        queueId: BigInt(rawTicket.queueId),
        customer: rawTicket.customer,
        status: Number(rawTicket.status),
        joinedAt: BigInt(rawTicket.joinedAt),
        updatedAt: BigInt(rawTicket.updatedAt),
      };

      let positionInLine = 0n;
      if (ticket.status === 1) { // 1 = Waiting
        positionInLine = await fallbackPublicClient.readContract({
          address: contractAddress,
          abi: QUEUE_PASS_ABI,
          functionName: 'getPositionInLine',
          args: [queueId, ticket.ticketId],
        }) as bigint;
      }

      return {
        hasActiveTicket: true,
        ticket,
        positionInLine,
      };
    } catch (err) {
      console.error('Error fetching user ticket:', err);
      return {
        hasActiveTicket: false,
        ticket: {
          ticketId: 0n,
          queueId,
          customer: userAddress,
          status: 0,
          joinedAt: 0n,
          updatedAt: 0n,
        },
      };
    }
  }, [contractAddress]);

  // Execute a write transaction with full lifecycle tracking
  const executeTx = async (
    actionTitle: string,
    functionName: string,
    args: any[]
  ): Promise<boolean> => {
    if (!walletClient || !address) {
      setTxStatus({
        step: 'error',
        actionTitle,
        message: 'Please connect your EVM wallet first.',
      });
      return false;
    }

    try {
      await ensureCorrectNetwork();

      setTxStatus({
        step: 'wallet',
        actionTitle,
        message: 'Confirm the transaction in your wallet...',
      });

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: QUEUE_PASS_ABI,
        functionName: functionName as any,
        args: args as any,
      });

      setTxStatus({
        step: 'pending',
        actionTitle,
        txHash: hash,
        message: 'Broadcasting and verifying on BOT Chain Testnet...',
      });

      const receipt = await fallbackPublicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        setTxStatus({
          step: 'success',
          actionTitle,
          txHash: hash,
          message: 'Confirmed on BOT Chain block #' + receipt.blockNumber,
        });
        await fetchQueues();
        return true;
      } else {
        setTxStatus({
          step: 'error',
          actionTitle,
          txHash: hash,
          message: 'Transaction reverted by the BOT Chain network.',
        });
        return false;
      }
    } catch (err: any) {
      console.error('Transaction execution failed:', err);
      setTxStatus({
        step: 'error',
        actionTitle,
        message: parseContractError(err),
      });
      return false;
    }
  };

  // Smart contract actions
  const createQueue = async (name: string, description: string) => {
    return executeTx('Create Queue', 'createQueue', [name, description]);
  };

  const joinQueue = async (queueId: bigint) => {
    return executeTx('Join Queue', 'joinQueue', [queueId]);
  };

  const callNext = async (queueId: bigint) => {
    return executeTx('Call Next Customer', 'callNext', [queueId]);
  };

  const markServed = async (queueId: bigint, ticketId: bigint) => {
    return executeTx('Mark as Served', 'markServed', [queueId, ticketId]);
  };

  const leaveQueue = async (queueId: bigint) => {
    return executeTx('Leave Queue', 'leaveQueue', [queueId]);
  };

  const closeQueue = async (queueId: bigint) => {
    return executeTx('Close Queue', 'closeQueue', [queueId]);
  };

  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  return {
    contractAddress,
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
  };
}

