import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Skeleton } from '@heroui/react';
import { getPayouts } from '../api';
import { buildPayoutsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import PayoutCard from '../components/PayoutCard';
import OfflineBanner from '../components/OfflineBanner';
import PageFilterBar, { FilterSelect } from '../components/PageFilterBar';
import KpiCard from '../components/KpiCard';

const NOW         = new Date();
const YEARS       = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS      = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

export default function Payouts() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(String(NOW.getMonth() + 1));
  const [year, setYear]       = useState(String(NOW.getFullYear()));
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

  const load = () => {
    setLoading(true);
    getPayouts(Number(month), Number(year)).then((r) => {
      setPayouts(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const safe = Array.isArray(payouts) ? payouts : [];
    return safe.reduce((acc, p) => {
      const sessions = Array.isArray(p.sessions) ? p.sessions : [];
      return {
        centerRevenue:    acc.centerRevenue    + sessions.reduce((s, r) => s + Number(r.Revenue_Center    || 0), 0),
        therapistPayouts: acc.therapistPayouts + sessions.reduce((s, r) => s + Number(r.Revenue_Therapist || 0), 0),
        totalSessions:    acc.totalSessions    + sessions.length,
      };
    }, { centerRevenue: 0, therapistPayouts: 0, totalSessions: 0 });
  }, [payouts]);

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <Button size="sm" variant="flat" onPress={() => buildPayoutsExcel(payouts, month, year)}>
          ↓ {t('payouts.export')}
        </Button>,
        actionsTarget
      )}

      <OfflineBanner />

      <PageFilterBar>
        <FilterSelect value={month} onChange={setMonth}
          options={MONTHS.map((m) => ({ id: String(m), label: MONTH_NAMES[m - 1] }))} />
        <FilterSelect value={year} onChange={setYear}
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
      </PageFilterBar>

      <KpiCard metrics={[
        { label: t('reports.revenue'),    value: fmt(totals.centerRevenue),    cls: 'text-primary'  },
        { label: t('payouts.therapistPayouts') || 'Therapist Payouts', value: fmt(totals.therapistPayouts), cls: 'text-warning' },
        { label: t('sessions.allSessions'),    value: String(totals.totalSessions) },
      ]} />

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
