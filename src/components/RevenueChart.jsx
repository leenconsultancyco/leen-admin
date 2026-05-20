import { Skeleton } from '@heroui/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
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
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
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
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) =>
            value === 'revenue' ? t('reports.revenue') : t('reports.expenses2')
          }
          wrapperStyle={{ fontSize: 13 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-primary, #0E9B73)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'var(--color-primary, #0E9B73)' }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#f31260"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#f31260' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
