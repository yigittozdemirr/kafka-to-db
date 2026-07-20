import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { MonitoringEvent, InstanceData, ConnectionStatus } from '../types/monitoring';

const CONSUMER_PORTS = [8080, 8081, 8082];
const MAX_MESSAGES_PER_INSTANCE = 1000;
const MAX_FAILED_MESSAGES = 200;
const TOPIC = '/topic/monitoring';

interface MonitoringState {
  instances: Record<string, InstanceData>;
  failedMessages: MonitoringEvent[];
  connectionStatuses: Record<string, ConnectionStatus>;
}

export function useMonitoringSocket() {
  const [state, setState] = useState<MonitoringState>({
    instances: {},
    failedMessages: [],
    connectionStatuses: {},
  });

  // Accumulator buffers — mutations happen outside React state
  const pendingEventsRef = useRef<MonitoringEvent[]>([]);
  const rafIdRef = useRef<number | null>(null);
  const clientsRef = useRef<Client[]>([]);

  // Flush accumulated events into React state in a single rAF batch
  const flushEvents = useCallback(() => {
    rafIdRef.current = null;

    const events = pendingEventsRef.current;
    if (events.length === 0) return;
    pendingEventsRef.current = [];

    setState((prev) => {
      const nextInstances = { ...prev.instances };
      let nextFailed = prev.failedMessages;
      let failedChanged = false;

      for (const event of events) {
        const id = event.instanceId;

        // Get or initialize instance data
        const existing = nextInstances[id] ?? {
          instanceId: id,
          stats: { total: 0, success: 0, retry: 0, failed: 0 },
          messages: [],
        };

        // Update stats
        const stats = { ...existing.stats, total: existing.stats.total + 1 };
        if (event.status === 'SUCCESS') stats.success += 1;
        else if (event.status === 'RETRY') stats.retry += 1;
        else if (event.status === 'FAILED') stats.failed += 1;

        // Append message, cap at MAX
        const messages =
          existing.messages.length >= MAX_MESSAGES_PER_INSTANCE
            ? [...existing.messages.slice(-(MAX_MESSAGES_PER_INSTANCE - 1)), event]
            : [...existing.messages, event];

        nextInstances[id] = { instanceId: id, stats, messages };

        // Collect failed messages
        if (event.status === 'FAILED') {
          if (!failedChanged) {
            nextFailed = [...prev.failedMessages];
            failedChanged = true;
          }
          nextFailed.push(event);
        }
      }

      // Trim failed messages
      if (failedChanged && nextFailed.length > MAX_FAILED_MESSAGES) {
        nextFailed = nextFailed.slice(-MAX_FAILED_MESSAGES);
      }

      return {
        ...prev,
        instances: nextInstances,
        failedMessages: failedChanged ? nextFailed : prev.failedMessages,
      };
    });
  }, []);

  // Schedule a rAF flush (coalesces multiple incoming messages)
  const scheduleFlush = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(flushEvents);
    }
  }, [flushEvents]);

  // Set up STOMP/SockJS connections
  useEffect(() => {
    const clients: Client[] = [];

    for (const port of CONSUMER_PORTS) {
      const url = `http://localhost:${port}/ws`;

      setState((prev) => ({
        ...prev,
        connectionStatuses: { ...prev.connectionStatuses, [port]: 'CONNECTING' },
      }));

      const client = new Client({
        webSocketFactory: () => new SockJS(url) as WebSocket,
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        onConnect: () => {
          setState((prev) => ({
            ...prev,
            connectionStatuses: { ...prev.connectionStatuses, [port]: 'CONNECTED' },
          }));

          client.subscribe(TOPIC, (message) => {
            try {
              const event: MonitoringEvent = JSON.parse(message.body);
              pendingEventsRef.current.push(event);
              scheduleFlush();
            } catch (err) {
              console.error(`Failed to parse message from port ${port}:`, err);
            }
          });
        },

        onDisconnect: () => {
          setState((prev) => ({
            ...prev,
            connectionStatuses: { ...prev.connectionStatuses, [port]: 'DISCONNECTED' },
          }));
        },

        onStompError: (frame) => {
          console.error(`STOMP error on port ${port}:`, frame.headers['message']);
          setState((prev) => ({
            ...prev,
            connectionStatuses: { ...prev.connectionStatuses, [port]: 'ERROR' },
          }));
        },

        onWebSocketError: () => {
          setState((prev) => ({
            ...prev,
            connectionStatuses: { ...prev.connectionStatuses, [port]: 'ERROR' },
          }));
        },
      });

      client.activate();
      clients.push(client);
    }

    clientsRef.current = clients;

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      clients.forEach((c) => {
        c.deactivate();
      });
    };
  }, [scheduleFlush]);

  const resetStats = useCallback(() => {
    setState({
      instances: {},
      failedMessages: [],
      connectionStatuses: state.connectionStatuses,
    });
  }, [state.connectionStatuses]);

  return { ...state, resetStats };
}
