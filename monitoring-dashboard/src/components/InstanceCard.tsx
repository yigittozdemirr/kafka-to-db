import { useEffect, useRef } from 'react';
import type { InstanceData, ConnectionStatus } from '../types/monitoring';
import { MessageRow } from './MessageRow';

interface InstanceCardProps {
  data: InstanceData;
  connectionStatus: ConnectionStatus;
}

const connectionStatusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
  CONNECTING: { color: 'bg-amber-500', label: 'Connecting' },
  CONNECTED: { color: 'bg-emerald-500', label: 'Connected' },
  DISCONNECTED: { color: 'bg-slate-500', label: 'Disconnected' },
  ERROR: { color: 'bg-red-500', label: 'Error' },
};

export function InstanceCard({ data, connectionStatus }: InstanceCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAutoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [data.messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isAutoScrollRef.current = isAtBottom;
  };

  const connStatus = connectionStatusConfig[connectionStatus] ?? connectionStatusConfig.DISCONNECTED;
  const successRate =
    data.stats.total > 0 ? ((data.stats.success / data.stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-[#111111] border border-white/5 rounded-lg flex flex-col h-[500px]">
      
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white">
              {data.instanceId}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connStatus.color}`} />
            <span className="text-[11px] text-slate-400">{connStatus.label}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <Stat text="Total" value={data.stats.total} />
          <Stat text="Success" value={data.stats.success} color="text-emerald-400" />
          <Stat text="Retry" value={data.stats.retry} color="text-amber-400" />
          <Stat text="Failed" value={data.stats.failed} color="text-red-400" />
        </div>

        {/* Mini progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 transition-all duration-300"
              style={{ width: `${successRate}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 font-medium w-8 text-right">{successRate}%</span>
        </div>
      </div>

      {/* Message Stream */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin"
      >
        {data.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-500">
            Waiting for messages...
          </div>
        ) : (
          data.messages.map((event, i) => <MessageRow key={`${event.messageId}-${i}`} event={event} />)
        )}
      </div>
    </div>
  );
}

function Stat({ text, value, color = "text-white" }: { text: string; value: number; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{text}</p>
      <p className={`text-sm font-medium tabular-nums ${color}`}>{value.toLocaleString('tr-TR')}</p>
    </div>
  );
}
