import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Skeleton } from '@heroui/react';
import { getDashboardData } from '../api';
import { useI18n } from '../i18n';
import StatCard from '../components/StatCard';
import RevenueChart from '../components/RevenueChart';
import PendingBookingCard from '../components/PendingBookingCard';
import OfflineBanner from '../components/OfflineBanner';

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

export default function Dashboard() {
  const { t } = useI18n();
  const now = new Date();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    getDashboardData(now.getMonth() + 1, now.getFullYear()).then((res) => {
      if (res.success) {
        setData(res.data);
        setPending(res.data?.recentBookings?.filter((b) => b.Status === 'Pending') ?? []);
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function removePending(id) {
    setPending((prev) => prev.filter((b) => b.Booking_ID !== id));
  }

  const d = data || {};
  const stale = daysSince(d.lastBackupDate) > 7;

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />

      {!loading && stale && (
        <div className="bg-warning-50 border border-warning-200 rounded-xl px-4 py-3 text-sm text-warning-700 flex items-center justify-between gap-3">
          <span>⚠️ {t('dashboard.backupWarning')}</span>
          <Link to="/settings" className="underline shrink-0">{t('nav.settings')}</Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard icon="📅" label={t('dashboard.todaySessions')}   value={d.todaySessions  ?? 0} color="default" />
            <StatCard icon="💵" label={t('dashboard.todayRevenue')}    value={`${Number(d.todayRevenue ?? 0).toLocaleString('en-EG')} EGP`} color="success" />
            <StatCard icon="📈" label={t('dashboard.monthlyRevenue')}  value={`${Number(d.totalRevenue ?? 0).toLocaleString('en-EG')} EGP`} color="primary" />
            <StatCard icon="🔔" label={t('dashboard.pendingBookings')} value={d.pendingCount ?? 0} color={(d.pendingCount ?? 0) > 0 ? 'warning' : 'default'} />
            <StatCard icon="💸" label={t('dashboard.monthlyExpenses')} value={`${Number(d.totalExpenses ?? 0).toLocaleString('en-EG')} EGP`} color="danger" />
            <StatCard icon="💰" label={t('dashboard.monthlyProfit')}   value={`${Number((d.totalRevenue ?? 0) - (d.totalExpenses ?? 0)).toLocaleString('en-EG')} EGP`} color={(d.totalRevenue ?? 0) >= (d.totalExpenses ?? 0) ? 'success' : 'danger'} />
          </>
        )}
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-default-700 mb-3">
            {t('dashboard.pendingBookings')} ({pending.length})
          </h2>
          <div className="flex flex-col gap-3">
            {pending.map((b) => (
              <PendingBookingCard key={b.Booking_ID} booking={b} onDone={removePending} />
            ))}
          </div>
        </section>
      )}

      <Card className="leen-card">
        <Card.Content className="p-4 gap-3">
          <h2 className="text-base font-semibold text-default-700">{t('dashboard.monthlyRevenue')}</h2>
          <RevenueChart data={Array.isArray(d.monthlyChart) ? d.monthlyChart : []} loading={loading} />
        </Card.Content>
      </Card>

      <Card className="leen-card">
        <Card.Content className="p-4 gap-3">
          <h2 className="text-base font-semibold text-default-700">{t('dashboard.recentActivity')}</h2>
          {loading ? (
            <Skeleton className="h-32 rounded-lg" />
          ) : (d.recentActivity?.length ?? 0) === 0 ? (
            <p className="text-sm text-default-400">{t('dashboard.noActivity')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-default-100">
              {d.recentActivity.slice(0, 5).map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-2 text-sm">
                  <span className="text-xl shrink-0">{item.icon ?? '📌'}</span>
                  <span className="flex-1 text-default-700">{item.description}</span>
                  <span className="text-default-400 shrink-0 text-xs">{item.timeAgo}</span>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
