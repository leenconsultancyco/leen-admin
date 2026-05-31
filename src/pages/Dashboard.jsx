import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Skeleton, Chip } from '@heroui/react';
import { CalendarDays, Banknote, TrendingUp, Bell, Receipt, Wallet,
         CheckCircle, ArrowLeftRight, CreditCard, Tag, UserRound, Clock, ShieldAlert } from 'lucide-react';
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

const ACTIVITY_ICON = {
  '✅': { Icon: CheckCircle,    color: 'text-success'  },
  '💳': { Icon: CreditCard,     color: 'text-primary'  },
  '↕':  { Icon: ArrowLeftRight, color: 'text-primary'  },
  '💸': { Icon: Tag,            color: 'text-warning'  },
  '👤': { Icon: UserRound,      color: 'text-default-400' },
  '🕐': { Icon: Clock,          color: 'text-default-400' },
};

function ActivityIcon({ emoji }) {
  const entry = ACTIVITY_ICON[emoji] ?? { Icon: Clock, color: 'text-default-400' };
  const { Icon, color } = entry;
  return (
    <span className={`shrink-0 ${color}`}>
      <Icon size={16} strokeWidth={1.8} />
    </span>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const now = new Date();
  const monthLabel = now.toLocaleString('en-US', { month: 'long' });

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
    <div className="flex flex-col gap-5">
      <OfflineBanner />

      {/* ── Top 4 stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              icon={CalendarDays}
              label={t('dashboard.todaySessions')}
              sublabel={t('general.today')}
              value={d.todaySessions ?? 0}
              color="default"
            />
            <StatCard
              icon={Banknote}
              label={t('dashboard.todayRevenue')}
              sublabel={t('general.today')}
              value={`${Number(d.todayRevenue ?? 0).toLocaleString('en-EG')} EGP`}
              color="success"
            />
            <StatCard
              icon={TrendingUp}
              label={`${t('dashboard.revenue')} · ${monthLabel}`}
              value={`${Number(d.totalRevenue ?? 0).toLocaleString('en-EG')} EGP`}
              color="primary"
            />
            <StatCard
              icon={Bell}
              label={t('dashboard.pendingBookings')}
              sublabel={t('dashboard.awaitingAction')}
              value={d.pendingCount ?? 0}
              color={(d.pendingCount ?? 0) > 0 ? 'warning' : 'default'}
            />
          </>
        )}
      </div>

      {/* ── Summary row: expenses + profit ── */}
      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <StatCard
              icon={Receipt}
              label={t('dashboard.overallExpenses')}
              value={`${Number(d.overallExpenses ?? 0).toLocaleString('en-EG')} EGP`}
              color="danger"
            />
            <StatCard
              icon={Wallet}
              label={t('dashboard.overallProfit')}
              value={`${Number(d.overallProfit ?? 0).toLocaleString('en-EG')} EGP`}
              color={(d.overallProfit ?? 0) >= 0 ? 'success' : 'danger'}
            />
          </>
        )}
      </div>

      {/* ── Pending confirmations ── */}
      {pending.length > 0 && (
        <Card className="leen-card">
          <Card.Content className="p-4 md:p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-default-800">
                  {t('dashboard.pendingConfirmations')}
                </h2>
                <Chip color="warning" size="sm" className="text-xs font-bold">
                  {pending.length}
                </Chip>
              </div>
              <Link
                to="/sessions"
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                {t('dashboard.viewAllSessions')} →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {pending.map((b) => (
                <PendingBookingCard key={b.Booking_ID} booking={b} onDone={removePending} />
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* ── Chart + Recent activity side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="leen-card">
          <Card.Content className="p-4 md:p-5 flex flex-col gap-3">
            <h2 className="text-base font-semibold text-default-800">{t('dashboard.revenueVsExpenses')}</h2>
            <RevenueChart data={Array.isArray(d.monthlyChart) ? d.monthlyChart : []} loading={loading} />
          </Card.Content>
        </Card>

        <Card className="leen-card">
          <Card.Content className="p-4 md:p-5 flex flex-col gap-3">
            <h2 className="text-base font-semibold text-default-800">{t('dashboard.recentActivity')}</h2>
            {loading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
              </div>
            ) : (d.recentActivity?.length ?? 0) === 0 ? (
              <p className="text-sm text-default-400">{t('dashboard.noActivity')}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-default-100">
                {d.recentActivity.slice(0, 6).map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="w-7 h-7 rounded-full bg-default-100 flex items-center justify-center shrink-0">
                      <ActivityIcon emoji={item.icon ?? '🕐'} />
                    </span>
                    <span className="flex-1 text-default-700 leading-snug">{item.description}</span>
                    <span className="text-default-400 shrink-0 text-xs whitespace-nowrap">{item.timeAgo}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* ── Backup warning — bottom sticky card ── */}
      {!loading && stale && (
        <div className="flex items-center gap-3 bg-warning-50 border border-warning-200 rounded-xl px-4 py-3">
          <ShieldAlert size={20} className="text-warning-600 shrink-0" strokeWidth={1.8} />
          <p className="flex-1 text-sm text-warning-700">
            {t('dashboard.backupWarning')}
          </p>
          <Link
            to="/settings"
            className="shrink-0 text-sm font-medium bg-white border border-warning-200 text-warning-700 px-4 py-1.5 rounded-lg hover:bg-warning-50 transition-colors"
          >
            {t('dashboard.openSettings')}
          </Link>
        </div>
      )}
    </div>
  );
}
