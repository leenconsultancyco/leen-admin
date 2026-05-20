import { Card, Skeleton, Separator } from '@heroui/react';
import { useI18n } from '../i18n';

const fmt = (n) => `${Number(n || 0).toLocaleString('en-EG')} EGP`;

function Row({ label, value, bold, color, indent }) {
  return (
    <div className={`flex justify-between items-center py-1 ${indent ? 'ps-4' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-default-800' : 'text-default-500'}`}>{label}</span>
      <span dir="ltr" className={`text-sm font-medium ${color || 'text-default-700'}`}>{value}</span>
    </div>
  );
}

export default function IncomeStatement({ dashData, sessions, expenses, loading }) {
  const { t } = useI18n();

  if (loading) return <Skeleton className="h-64 rounded-xl" />;

  const d = dashData || {};
  const totalRevenue  = Number(d.totalRevenue  || 0);
  const totalExpenses = Number(d.totalExpenses || 0);
  const netIncome     = totalRevenue - totalExpenses;

  const byTherapist = {};
  (sessions || []).forEach((s) => {
    const name = s.Therapist_Name || '—';
    if (!byTherapist[name]) byTherapist[name] = { sessions: 0, revenue: 0 };
    byTherapist[name].sessions++;
    byTherapist[name].revenue += Number(s.Revenue_Center || 0);
  });

  const byCategory = {};
  (expenses || []).forEach((e) => {
    const cat = e.Category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.Actual_EGP || 0);
  });

  return (
    <Card>
      <Card.Content className="p-5 gap-1">
        <p className="text-base font-semibold text-default-800 mb-2">{t('reports.incomeStatement')}</p>

        <Row label={t('reports.revenue')} value={fmt(totalRevenue)} bold />
        {Object.entries(byTherapist).map(([name, data]) => (
          <Row key={name} indent label={`${name} (${data.sessions})`} value={fmt(data.revenue)} />
        ))}

        <Separator className="my-2" />

        <Row label={t('reports.expenses2')} value={fmt(totalExpenses)} bold />
        {Object.entries(byCategory).map(([cat, total]) => (
          <Row key={cat} indent label={cat} value={fmt(total)} />
        ))}

        <Separator className="my-2" />

        <Row
          label={t('reports.netIncome')}
          value={fmt(Math.abs(netIncome))}
          bold
          color={netIncome >= 0 ? 'text-success' : 'text-danger'}
        />
      </Card.Content>
    </Card>
  );
}
