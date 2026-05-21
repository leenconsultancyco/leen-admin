import { Skeleton } from '@heroui/react';
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const COLOR_BAR  = 'var(--color-primary, #0E9B73)';

function fmt(v) { return `${Number(v).toLocaleString('en-EG')} EGP`; }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e4e4e7',
      borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <p style={{ fontWeight: 600, color: '#3f3f46', marginBottom: '2px' }}>{label}</p>
      <p style={{ color: COLOR_BAR }}>{fmt(payload[0]?.value)}</p>
    </div>
  );
}

export default function ExpenseChart({ data = [], loading = false }) {
  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data.length) return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa', fontSize: 13 }}>
      No data
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="35%">
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          tick={{ fontSize: 11, fill: '#71717a' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={60}>
          {data.map((_, i) => <Cell key={i} fill={COLOR_BAR} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
