import { useState, useEffect, useMemo } from 'react';
import { Button, Select, SelectItem, Skeleton } from '@heroui/react';
import { getPayouts } from '../api';
import { buildPayoutsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import PayoutCard from '../components/PayoutCard';
import OfflineBanner from '../components/OfflineBanner';

const NOW    = new Date();
const YEARS  = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Payouts() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(NOW.getMonth() + 1);
  const [year, setYear]       = useState(NOW.getFullYear());
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPayouts(month, year).then((r) => {
      setPayouts(r.success ? (r.data ?? []) : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCenterRevenue = useMemo(() =>
    payouts.reduce((acc, p) =>
      acc + (p.sessions ?? []).reduce((s, session) => s + Number(session.Revenue_Center || 0), 0),
    0),
  [payouts]);

  const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-end">
        <Select size="sm" label={t('payouts.month')} className="w-28"
          selectedKeys={[String(month)]} onSelectionChange={(k) => setMonth(Number([...k][0]))}>
          {MONTHS.map((m) => <SelectItem key={String(m)}>{m}</SelectItem>)}
        </Select>
        <Select size="sm" label="" className="w-24"
          selectedKeys={[String(year)]} onSelectionChange={(k) => setYear(Number([...k][0]))}>
          {YEARS.map((y) => <SelectItem key={String(y)}>{y}</SelectItem>)}
        </Select>
        <Button size="sm" variant="flat" onPress={() => buildPayoutsExcel(payouts, month, year)}>
          {t('payouts.export')}
        </Button>
      </div>

      {/* Center revenue summary */}
      {!loading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-default-600">{t('reports.revenue')} ({t('nav.sessions')})</span>
          <span dir="ltr" className="font-bold text-primary">{fmt(totalCenterRevenue)}</span>
        </div>
      )}

      {/* Payout cards */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : payouts.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payouts.map((p) => (
            <PayoutCard
              key={p.therapistId}
              payout={p}
              month={month}
              year={year}
              onDone={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
