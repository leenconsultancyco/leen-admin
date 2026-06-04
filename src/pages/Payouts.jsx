import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Skeleton } from '@heroui/react';
import { getPayouts } from '../api';
import { buildPayoutsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import PayoutCard from '../components/PayoutCard';
import OfflineBanner from '../components/OfflineBanner';
import PageFilterBar, { FilterSelect } from '../components/PageFilterBar';

const NOW         = new Date();
const YEARS       = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS      = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

export default function Payouts() {
  const { t, lang } = useI18n();
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

  const monthLabel = lang === 'ar'
    ? `${MONTH_NAMES_AR[Number(month) - 1]} ${year}`
    : `${MONTH_NAMES[Number(month) - 1].toUpperCase()} ${year}`;

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

      {/* Center revenue mini-card */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <div className="leen-card" style={{
          background: '#fff',
          border: '1px solid #E6EAF1',
          borderRadius: 16,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#E6F6F0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A6E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: 0 }}>
              {t('payouts.centerRevenue')} · {MONTH_NAMES[Number(month) - 1]}
            </p>
            <p dir="ltr" style={{ fontSize: 20, fontWeight: 800, color: '#0B1320', margin: 0 }}>
              {fmt(totals.centerRevenue)}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[22px]" />)}
        </div>
      ) : payouts.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {payouts.map((p) => (
            <PayoutCard key={p.therapistId} payout={p} month={month} year={year} onDone={load} />
          ))}
        </div>
      )}
    </div>
  );
}
