import type { InstanceData } from '../types/monitoring';

interface StatsBarProps {
  instances: Record<string, InstanceData>;
}

export function StatsBar({ instances }: StatsBarProps) {
  const allInstances = Object.values(instances);

  const totals = allInstances.reduce(
    (acc, inst) => ({
      total: acc.total + inst.stats.total,
      success: acc.success + inst.stats.success,
      retry: acc.retry + inst.stats.retry,
      failed: acc.failed + inst.stats.failed,
    }),
    { total: 0, success: 0, retry: 0, failed: 0 }
  );

  const successRate = totals.total > 0 ? ((totals.success / totals.total) * 100).toFixed(1) : '0.0';
  const throughput = totals.total;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Total Processed"
        value={totals.total.toLocaleString('tr-TR')}
        indicator="bg-blue-500"
      />
      <StatCard
        label="Successful"
        value={totals.success.toLocaleString('tr-TR')}
        indicator="bg-emerald-500"
      />
      <StatCard
        label="Retrying"
        value={totals.retry.toLocaleString('tr-TR')}
        indicator="bg-amber-500"
      />
      <StatCard
        label="Failed (DLQ)"
        value={totals.failed.toLocaleString('tr-TR')}
        indicator="bg-red-500"
      />
      <StatCard
        label="Success Rate"
        value={`${successRate}%`}
        subtitle={`${throughput.toLocaleString('tr-TR')} msgs`}
        indicator="bg-slate-400"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  indicator
}: {
  label: string;
  value: string;
  subtitle?: string;
  indicator: string;
}) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-lg p-5 flex flex-col justify-between">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${indicator}`} />
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-semibold text-white tracking-tight tabular-nums leading-none">
          {value}
        </p>
        {subtitle && <p className="text-[11px] text-slate-500 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}
