import { useMonitoringSocket } from '../hooks/useMonitoringSocket';
import { InstanceCard } from './InstanceCard';
import { FailedMessagesPanel } from './FailedMessagesPanel';
import { StatsBar } from './StatsBar';
import type { ConnectionStatus } from '../types/monitoring';

const CONSUMER_PORTS = [8080, 8081, 8082];
const INSTANCE_NAMES = ['app1', 'app2', 'app3'];

export function Dashboard() {
  const { instances, failedMessages, connectionStatuses, resetStats } = useMonitoringSocket();

  const activeConnections = Object.values(connectionStatuses).filter(
    (s) => s === 'CONNECTED'
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-200 selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        
        {/* Header */}
        <header className="mb-8 border-b border-white/5 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Kafka Operations
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Real-time message processing monitoring across consumer instances
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-white/10 rounded-md">
                <span className={`w-2 h-2 rounded-full ${activeConnections === 3 ? 'bg-emerald-500' : activeConnections > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                <span className="text-xs text-slate-400 font-medium">
                  {activeConnections}/3 Nodes
                </span>
              </div>

              <button
                onClick={resetStats}
                className="flex items-center gap-2 bg-[#111111] hover:bg-white/5 border border-white/10 rounded-md px-4 py-1.5 transition-colors text-sm text-slate-300 hover:text-white cursor-pointer"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                Reset
              </button>
            </div>
          </div>
        </header>

        {/* Global Stats */}
        <section className="mb-8">
          <StatsBar instances={instances} />
        </section>

        {/* Instance Cards Grid */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Consumers</h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {INSTANCE_NAMES.map((name, index) => {
              const port = CONSUMER_PORTS[index];
              const instanceData = instances[name] ?? {
                instanceId: name,
                stats: { total: 0, success: 0, retry: 0, failed: 0 },
                messages: [],
              };
              const connStatus: ConnectionStatus = connectionStatuses[port] ?? 'DISCONNECTED';

              return (
                <InstanceCard
                  key={name}
                  data={instanceData}
                  connectionStatus={connStatus}
                />
              );
            })}
          </div>
        </section>

        {/* Failed Messages Panel */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dead Letter Queue</h2>
          </div>
          <FailedMessagesPanel messages={failedMessages} />
        </section>

      </div>
    </div>
  );
}
