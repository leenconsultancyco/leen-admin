import { Skeleton } from '@heroui/react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useI18n } from '../i18n';

const COLOR_EXPECTED = 'oklch(0.82 0.10 162)';  // teal light
const COLOR_ACTUAL   = 'var(--color-primary, #0E9B73)'; // teal dark (theme-aware)
const COLOR_OVER     = '#f31260';

function fmt(v) { return `${Number(v).toLocaleString('en-EG')} EGP`; }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-default-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-default-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function ExpenseChart({ data = [], loading = false }) {
  const { t } = useI18n();

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) =>
            value === 'expected' ? t('expenses.expected') : t('expenses.actual')
          }
          wrapperStyle={{ fontSize: 13 }}
        />

        {/* Expected — always teal light */}
        <Bar dataKey="expected" name="expected" fill={COLOR_EXPECTED} radius={[4, 4, 0, 0]} />

        {/* Actual — teal dark unless over-budget (red) */}
        <Bar dataKey="actual" name="actual" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.actual > entry.expected ? COLOR_OVER : COLOR_ACTUAL}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
