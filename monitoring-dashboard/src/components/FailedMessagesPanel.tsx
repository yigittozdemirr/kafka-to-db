import { useEffect, useRef } from 'react';
import type { MonitoringEvent } from '../types/monitoring';

interface FailedMessagesPanelProps {
  messages: MonitoringEvent[];
}

export function FailedMessagesPanel({ messages }: FailedMessagesPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrollRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && isAutoScrollRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    isAutoScrollRef.current = isAtBottom;
  };

  return (
    <div className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="text-sm font-medium text-white">System Logs</h3>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md">
          {messages.length.toLocaleString('tr-TR')} errors
        </span>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto max-h-[300px] scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-xs text-slate-500">
            No failed messages
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#111111] border-b border-white/5 z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Message ID</th>
                <th className="px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider">Instance</th>
                <th className="px-4 py-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider w-full">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {messages.map((msg, i) => (
                <tr key={`${msg.messageId}-${i}`} className="hover:bg-white/5 transition-colors animate-fade-in group">
                  <td className="px-4 py-2 text-[11px] text-slate-500 font-mono whitespace-nowrap">
                    {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-300 font-mono">{msg.messageId}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-400">{msg.instanceId}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-500 font-mono truncate max-w-[400px]" title={msg.payload}>
                    {msg.payload}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
