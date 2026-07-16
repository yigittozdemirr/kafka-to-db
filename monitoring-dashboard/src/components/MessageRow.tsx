import { memo } from 'react';
import type { MonitoringEvent } from '../types/monitoring';

interface MessageRowProps {
  event: MonitoringEvent;
}

const statusConfig = {
  SUCCESS: {
    dot: 'bg-emerald-500',
    text: 'text-slate-300',
  },
  RETRY: {
    dot: 'bg-amber-500',
    text: 'text-slate-300',
  },
  FAILED: {
    dot: 'bg-red-500',
    text: 'text-slate-300',
  },
};

export const MessageRow = memo(function MessageRow({ event }: MessageRowProps) {
  const config = statusConfig[event.status];
  const time = new Date(event.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });

  return (
    <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-white/5 rounded-md transition-colors animate-fade-in group">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span className="text-[11px] text-slate-500 font-mono shrink-0 w-[85px]">{time}</span>
      <span className={`text-[11px] font-mono truncate flex-1 ${config.text}`} title={event.messageId}>
        {event.messageId}
      </span>
      <span className="text-[10px] font-medium text-slate-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {event.status}
      </span>
    </div>
  );
});
