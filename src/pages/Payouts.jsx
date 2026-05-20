import { useState, useEffect, useMemo } from 'react';
import { Button, Skeleton } from '@heroui/react';
import { getPayouts } from '../api';
import { buildPayoutsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import PayoutCard from '../components/PayoutCard';
import OfflineBanner from '../components/OfflineBanner';

const NOW    = new Date();
const YEARS  = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-xs text-default-500">{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="border border-default-200 rounded-lg px-2 py-1.5 text-sm bg-white text-default-700 focus:outline-none">
        {options.map(({ id, label: lbl }) => <option key={id} value={id}>{lbl}</option>)}
      </select>
    </div>
  );
}

export default function Payouts() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(String(NOW.getMonth() + 1));
  const [year, setYear]       = useState(String(NOW.getFullYear()));
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getPayouts(Number(month), Number(year)).then((r) => {
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
      <div className="flex flex-wrap gap-2 items-end">
        <FilterSelect value={month} onChange={setMonth} label={t('payouts.month')}
          options={MONTHS.map((m) => ({ id: String(m), label: m }))} />
        <FilterSelect value={year} onChange={setYear} label=""
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
        <Button size="sm" variant="flat" onPress={() => buildPayoutsExcel(payouts, month, year)}>
          {t('payouts.export')}
        </Button>
      </div>

      {!loading && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-default-600">{t('reports.revenue')} ({t('nav.sessions')})</span>
          <span dir="ltr" className="font-bold text-primary">{fmt(totalCenterRevenue)}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : payouts.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payouts.map((p) => (
            <PayoutCard key={p.therapistId} payout={p} month={month} year={year} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}
