import { useMemo } from 'react';
import type { InstanceData, ParsedPayload } from '../types/monitoring';

interface EnrichedDataPanelProps {
  instances: Record<string, InstanceData>;
}

export function EnrichedDataPanel({ instances }: EnrichedDataPanelProps) {
  const enrichedMessages = useMemo(() => {
    const allMessages = Object.values(instances).flatMap((inst) => inst.messages);
    
    // Sort by timestamp descending
    allMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Parse and filter only successfully enriched messages
    const parsedList: (ParsedPayload & { status: string; timestamp: string })[] = [];
    
    for (const msg of allMessages) {
      if (msg.status === 'SUCCESS') {
        try {
          const parsed = JSON.parse(msg.payload) as ParsedPayload;
          // We consider it enriched if it has an address and email that aren't the fallback
          if (
              parsed.address && parsed.address !== 'Unknown Address' &&
              parsed.email && parsed.email !== 'Unknown Email'
          ) {
            parsedList.push({
              ...parsed,
              status: msg.status,
              timestamp: msg.timestamp,
            });
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
    // Deduplicate by orderId in case multiple nodes processed it (though they shouldn't)
    const unique = new Map();
    for (const item of parsedList) {
      if (!unique.has(item.orderId)) {
        unique.set(item.orderId, item);
      }
    }

    return Array.from(unique.values()).slice(0, 50); // Show latest 50
  }, [instances]);

  if (enrichedMessages.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/5 rounded-lg p-8 text-center text-slate-500">
        No enriched data available yet. Waiting for messages...
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-500 bg-white/5 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrichedMessages.map((msg) => (
              <tr key={msg.orderId} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-mono text-white/90">{msg.orderId}</td>
                <td className="px-4 py-3 font-medium text-indigo-300">{msg.customerName}</td>
                <td className="px-4 py-3">
                  <span className={msg.address === 'Unknown Address' ? 'text-slate-500 italic' : 'text-emerald-200/90'}>
                    {msg.address}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={msg.email === 'Unknown Email' ? 'text-slate-500 italic' : 'text-blue-200/90'}>
                    {msg.email}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-amber-200/90 text-right">
                  ${msg.amount?.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-slate-500 text-right font-mono text-xs">
                  {new Date(msg.timestamp).toLocaleTimeString('tr-TR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
