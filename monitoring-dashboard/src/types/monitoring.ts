export interface ParsedPayload {
  orderId: string;
  customerName: string;
  amount: number;
  address?: string;
  email?: string;
}

export interface MonitoringEvent {
  messageId: string;
  payload: string;
  status: 'SUCCESS' | 'RETRY' | 'FAILED';
  instanceId: string;
  timestamp: string;
}

export interface InstanceStats {
  total: number;
  success: number;
  retry: number;
  failed: number;
}

export interface InstanceData {
  instanceId: string;
  stats: InstanceStats;
  messages: MonitoringEvent[];
}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
