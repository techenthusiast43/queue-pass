export enum QueueStatus {
  Active = 0,
  Closed = 1,
}

export enum TicketStatus {
  None = 0,
  Waiting = 1,
  Called = 2,
  Served = 3,
  Cancelled = 4,
}

export interface QueueData {
  id: bigint;
  owner: `0x${string}`;
  name: string;
  description: string;
  status: QueueStatus;
  totalTickets: bigint;
  currentTicketServed: bigint;
  waitingCount: bigint;
  servedCount: bigint;
  cancelledCount: bigint;
  createdAt: bigint;
}

export interface TicketData {
  ticketId: bigint;
  queueId: bigint;
  customer: `0x${string}`;
  status: TicketStatus;
  joinedAt: bigint;
  updatedAt: bigint;
}

export interface UserTicketInfo {
  hasActiveTicket: boolean;
  ticket: TicketData;
  positionInLine?: bigint;
}

export type TxStep = 'idle' | 'wallet' | 'pending' | 'success' | 'error';

export interface TxStatus {
  step: TxStep;
  txHash?: `0x${string}`;
  message?: string;
  actionTitle?: string;
}

