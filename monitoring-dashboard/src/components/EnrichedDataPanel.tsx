import { useState, useMemo } from 'react';
import type { InstanceData, ParsedPayload } from '../types/monitoring';

interface EnrichedDataPanelProps {
  instances: Record<string, InstanceData>;
}

/**
 * Extracts the numeric suffix from a customerName string.
 * E.g. "Customer-42" → 42, "Ahmet" → Infinity (sorted last).
 */
function extractCustomerIndex(customerName: string | undefined): number {
  if (!customerName) return Infinity;
  const dashIndex = customerName.lastIndexOf('-');
  if (dashIndex >= 0 && dashIndex < customerName.length - 1) {
    const num = parseInt(customerName.substring(dashIndex + 1), 10);
    return isNaN(num) ? Infinity : num;
  }
  return Infinity;
}

export function EnrichedDataPanel({ instances }: EnrichedDataPanelProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const enrichedMessages = useMemo(() => {
    const allMessages = Object.values(instances).flatMap((inst) => inst.messages);

    // Parse and filter only successfully enriched messages
    const parsedList: (ParsedPayload & { status: string; timestamp: string })[] = [];
    
    for (const msg of allMessages) {
      if (msg.status === 'SUCCESS') {
        try {
          const parsed = JSON.parse(msg.payload) as ParsedPayload;
          if (
              parsed.address &&
              parsed.address !== 'Unknown Address' &&
              parsed.email &&
              parsed.email !== 'Unknown Email'
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
    
    // Deduplicate by orderId
    const unique = new Map();
    for (const item of parsedList) {
      if (!unique.has(item.orderId)) {
        unique.set(item.orderId, item);
      }
    }

    // Sort by customerIndex ascending
    const result = Array.from(unique.values());
    result.sort((a, b) => {
      const idxA = a.customerIndex ?? extractCustomerIndex(a.customerName);
      const idxB = b.customerIndex ?? extractCustomerIndex(b.customerName);
      return idxA - idxB;
    });

    return result;
  }, [instances]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  if (enrichedMessages.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/5 rounded-lg p-8 text-center text-slate-500">
        No enriched data available yet. Waiting for messages...
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/5 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
        <span className="text-xs text-slate-400 font-medium">
          Showing <span className="text-emerald-400 font-semibold">{enrichedMessages.length}</span> enriched orders — sorted by Customer Index
        </span>
        <span className="text-[10px] text-slate-500 italic">
          💡 Click a row to see Raw Kafka vs Enriched DB Correlation
        </span>
      </div>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="text-xs uppercase sticky top-0 z-20 bg-[#161616]">
            {/* Header Grouping row */}
            <tr className="border-b border-white/5 bg-black/40">
              <th className="px-4 py-2 text-slate-600 font-bold w-[50px] border-r border-white/5"></th>
              <th colSpan={3} className="px-4 py-2 text-center text-blue-400/90 font-bold border-r border-white/5 tracking-wider bg-blue-950/10 text-[10px]">
                📡 Raw Kafka Stream Payload
              </th>
              <th colSpan={2} className="px-4 py-2 text-center text-emerald-400/90 font-bold border-r border-white/5 tracking-wider bg-emerald-950/10 text-[10px]">
                💾 DB CRM Table Join (Enriched)
              </th>
              <th className="px-4 py-2 text-slate-600 font-bold w-[120px]"></th>
            </tr>
            {/* Column Headers */}
            <tr className="border-b border-white/5 text-slate-400 bg-white/5">
              <th className="px-4 py-2.5 font-medium border-r border-white/5">#</th>
              <th className="px-4 py-2.5 font-medium text-blue-200">Order ID</th>
              <th className="px-4 py-2.5 font-medium text-blue-200">Customer</th>
              <th className="px-4 py-2.5 font-medium text-blue-200 text-right border-r border-white/5">Amount</th>
              <th className="px-4 py-2.5 font-medium text-emerald-200">Address</th>
              <th className="px-4 py-2.5 font-medium text-emerald-200 border-r border-white/5">Email</th>
              <th className="px-4 py-2.5 font-medium text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {enrichedMessages.map((msg, index) => {
              const isExpanded = expandedOrderId === msg.orderId;
              return (
                <>
                  <tr 
                    key={msg.orderId} 
                    onClick={() => toggleExpand(msg.orderId)}
                    className={`hover:bg-white/5 transition-colors cursor-pointer ${isExpanded ? 'bg-white/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs border-r border-white/5">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-white/90">{msg.orderId}</td>
                    <td className="px-4 py-3 font-medium text-indigo-300">{msg.customerName}</td>
                    <td className="px-4 py-3 font-mono text-amber-200/90 text-right border-r border-white/5">${msg.amount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-emerald-200/90">{msg.address}</td>
                    <td className="px-4 py-3 text-blue-200/90 border-r border-white/5">{msg.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-right font-mono text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR')}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-black/35 animate-fade-in">
                      <td colSpan={7} className="px-6 py-4 border-b border-white/5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
                          
                          {/* Left: Raw Payload */}
                          <div className="bg-blue-950/20 border border-blue-900/30 rounded p-3">
                            <h4 className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                              Received Kafka Payload (Raw)
                            </h4>
                            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify({
                                orderId: msg.orderId,
                                customerName: msg.customerName,
                                amount: msg.amount
                              }, null, 2)}
                            </pre>
                          </div>

                          {/* Right: Enriched Data */}
                          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded p-3">
                            <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Joined DB Entity (Enriched)
                            </h4>
                            <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify({
                                address: msg.address,
                                email: msg.email,
                                customerIndex: msg.customerIndex
                              }, null, 2)}
                            </pre>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
