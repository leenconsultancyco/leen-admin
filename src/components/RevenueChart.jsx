import { Skeleton } from '@heroui/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, defs, linearGradient, stop,
} from 'recharts';
import { useI18n } from '../i18n';

function formatEGP(value) {
  return `${Number(value).toLocaleString('en-EG')} EGP`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-default-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-default-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatEGP(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart({ data = [], loading = false }) {
  const { t } = useI18n();

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--color-primary, #0E9B73)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-primary, #0E9B73)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#f31260" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#f31260" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 12, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) =>
            value === 'revenue' ? t('reports.revenue') : t('reports.expenses2')
          }
          wrapperStyle={{ fontSize: 13 }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary, #0E9B73)"
          strokeWidth={2.5}
          fill="url(#gradRevenue)"
          dot={{ r: 3, fill: 'var(--color-primary, #0E9B73)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#f31260"
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="url(#gradExpenses)"
          dot={{ r: 3, fill: '#f31260', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
