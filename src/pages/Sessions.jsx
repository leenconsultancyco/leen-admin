import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Chip } from '@heroui/react';
import KpiCard from '../components/KpiCard';
import { getSessions, getTherapistsFull, getClients, deleteBooking, deleteTransactionByBookingId } from '../api';
import { toast } from '../components/Toast';
import { buildSessionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import SessionActionsMenu from '../components/SessionActionsMenu';
import SessionEditModal from '../components/SessionEditModal';
import ConfirmModal from '../components/ConfirmModal';
import OfflineBanner from '../components/OfflineBanner';
import SessionCalendarView from '../components/SessionCalendarView';
import { FilterSelect, SearchInput } from '../components/PageFilterBar';

const STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const PAYMENTS = ['Unpaid', 'Paid'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const NOW = new Date();

function to12h(t) {
  if (!t || String(t).includes('1899')) return '—';
  const [h, m] = String(t).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function statusColor(s) {
  return { Confirmed: 'success', Pending: 'warning', Cancelled: 'danger', Completed: 'primary', 'No-show': 'default' }[s] || 'default';
}

export default function Sessions() {
  const { t } = useI18n();
  const [month, setMonth]             = useState(String(NOW.getMonth() + 1));
  const [year, setYear]               = useState(String(NOW.getFullYear()));
  const [therapistId, setTherapistId] = useState('');
  const [status, setStatus]           = useState('');
  const [payment, setPayment]         = useState('');
  const [search, setSearch]           = useState('');
  const [sessions, setSessions]       = useState([]);
  const [therapists, setTherapists]   = useState([]);
  const [clients, setClients]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [editingSession, setEditing]  = useState(null);
  const [deletingSession, setDeleting]= useState(null);
  const [deleting, setDelBusy]        = useState(false);
  const [view, setView]               = useState('table');
  const [actionsTarget, setActionsTarget] = useState(null);

  const years = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    setActionsTarget(document.getElementById('page-title-actions'));
  }, []);

  useEffect(() => {
    getTherapistsFull().then((r) => {
      setTherapists(r.success && Array.isArray(r.data) ? r.data : []);
    });
    getClients().then((r) => {
      setClients(r.success && Array.isArray(r.data) ? r.data : []);
    });
  }, []);

  const load = () => {
    setLoading(true);
    getSessions({ month: Number(month), year: Number(year), therapistId: therapistId || undefined, status: status || undefined })
      .then((r) => { setSessions(r.success && Array.isArray(r.data) ? r.data : []); setLoading(false); });
  };

  useEffect(load, [month, year, therapistId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let rows = Array.isArray(sessions) ? sessions : [];
    if (payment) rows = rows.filter((s) => s.Payment_Status === payment);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((s) =>
        (s.Client_Name || '').toLowerCase().includes(q) ||
        (s.Therapist_Name || '').toLowerCase().includes(q) ||
        (s.Booking_ID || '').toLowerCase().includes(q)
      );
    }
    return rows;
  }, [sessions, payment, search]);

  const totals = useMemo(() => filtered.reduce((acc, s) => ({
    sessions: acc.sessions + 1,
    revenue:  acc.revenue   + Number(s.Fee || 0),
    therapist:acc.therapist + Number(s.Revenue_Therapist || 0),
    center:   acc.center    + Number(s.Revenue_Center || 0),
  }), { sessions: 0, revenue: 0, therapist: 0, center: 0 }), [filtered]);

  const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

  const kpiMetrics = [
    {
      label: t('sessions.allSessions'),
      value: totals.sessions,
      iconBg: '#E3F2FD',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A6ED8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      label: t('sessions.fee'),
      value: fmt(totals.revenue),
      iconBg: '#E6F6F0',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A6E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
        </svg>
      ),
    },
    {
      label: t('sessions.therapistShare'),
      value: fmt(totals.therapist),
      iconBg: '#F3E5F5',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6A1B9A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: t('sessions.centerShare'),
      value: fmt(totals.center),
      iconBg: '#E8F7F2',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E9B73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
  ];

  async function handleDelete() {
    if (!deletingSession) return;
    setDelBusy(true);
    await deleteBooking(deletingSession.Booking_ID);
    if (deletingSession.Payment_Status === 'Paid') {
      await deleteTransactionByBookingId(deletingSession.Booking_ID);
    }
    toast('Session deleted');
    setDelBusy(false);
    setDeleting(null);
    load();
  }

  function handleCalendarBookingSuccess() {
    toast(t('sessions.bookingSuccess'));
    load();
    setTimeout(() => setView('table'), 1500);
  }

  const columns = [
    { key: 'Client_Name',       label: t('sessions.client'),        sortable: true },
    { key: 'Therapist_Name',    label: t('sessions.therapist'),     sortable: true },
    { key: 'Session_Date',      label: t('sessions.date'),          sortable: true },
    { key: 'Session_Time',      label: t('sessions.time'),          render: (r) => <span>{to12h(r.Session_Time)}</span> },
    { key: 'Session_Type',      label: t('sessions.type') },
    { key: 'Session_Mode',      label: t('sessions.mode') },
    { key: 'Fee',               label: t('sessions.fee'),           render: (r) => <span dir="ltr">{fmt(r.Fee)}</span> },
    { key: 'Revenue_Therapist', label: t('sessions.therapistShare'), render: (r) => <span dir="ltr">{fmt(r.Revenue_Therapist)}</span> },
    { key: 'Revenue_Center',    label: t('sessions.centerShare'),   render: (r) => <span dir="ltr">{fmt(r.Revenue_Center)}</span> },
    { key: 'Status',            label: t('sessions.status'),        render: (r) => <Chip size="sm" color={statusColor(r.Status)} variant="flat">{r.Status}</Chip> },
    { key: 'Payment_Status',    label: t('sessions.payment'),       render: (r) => {
      if (r.Status === 'Cancelled' && r.Payment_Status === 'Paid') {
        return (
          <div className="flex flex-col gap-0.5">
            <Chip size="sm" color="success" variant="flat">Paid</Chip>
            <span className="text-xs font-semibold" style={{ color: '#d97706' }}>⚠ Refund?</span>
          </div>
        );
      }
      return <Chip size="sm" color={r.Payment_Status === 'Paid' ? 'success' : 'warning'} variant="flat">{r.Payment_Status}</Chip>;
    }},
    {
      key: '_actions',
      label: t('sessions.actions'),
      render: (r) => (
        <SessionActionsMenu
          booking={r}
          onDone={load}
          onEdit={() => setEditing(r)}
          onDelete={() => setDeleting(r)}
        />
      ),
    },
  ];

  // Portaled into AppShell title ribbon — Export + Add Session only
  const titleActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="flat" onPress={() => buildSessionsExcel(filtered, month, year)}>
        ↓ {t('sessions.export')}
      </Button>
      <Button size="sm" color="primary" onPress={() => setAdding(true)}>
        + {t('sessions.addSession') || 'Add Session'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(titleActions, actionsTarget)}

      <OfflineBanner />

      {/* Filter card */}
      <div className="leen-card rounded-2xl bg-white shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <svg className="text-default-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>

          <FilterSelect value={therapistId} onChange={setTherapistId}
            options={[{ id: '', label: t('sessions.allTherapists') }, ...therapists.map((th) => ({ id: th.Therapist_ID, label: th.Name_EN }))]} />
          <FilterSelect value={status} onChange={setStatus}
            options={[{ id: '', label: t('sessions.allStatuses') }, ...STATUSES.map((s) => ({ id: s, label: s }))]} />
          <FilterSelect value={payment} onChange={setPayment}
            options={[{ id: '', label: t('sessions.allPayments') }, ...PAYMENTS.map((p) => ({ id: p, label: p }))]} />
          <div className="flex gap-1">
            <FilterSelect value={month} onChange={setMonth}
              options={months.map((m) => ({ id: String(m), label: MONTH_NAMES[m - 1] }))} />
            <FilterSelect value={year} onChange={setYear}
              options={years.map((y) => ({ id: String(y), label: y }))} />
          </div>

          <div className="ms-auto flex items-center gap-2 flex-wrap">
            <SearchInput value={search} onChange={setSearch} />

            {/* Table / Calendar toggle — solid blue when active */}
            <div className="flex gap-1.5">
              <button
                onClick={() => setView('table')}
                style={view === 'table'
                  ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                  : { backgroundColor: '#ffffff', borderColor: '#e4e4e7', color: '#71717a' }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:border-blue-500"
              >
                ≡ {t('sessions.tableView')}
              </button>
              <button
                onClick={() => setView('calendar')}
                style={view === 'calendar'
                  ? { backgroundColor: '#2563eb', borderColor: '#2563eb', color: '#ffffff' }
                  : { backgroundColor: '#ffffff', borderColor: '#e4e4e7', color: '#71717a' }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:border-blue-500"
              >
                ⊞ {t('sessions.calendarView')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <KpiCard metrics={kpiMetrics} />

      {view === 'table' ? (
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />
      ) : (
        <div className="leen-card rounded-2xl bg-gray-50 shadow-sm overflow-hidden p-4">
          <SessionCalendarView
            key={`cal-${month}-${year}-${therapistId}`}
            sessions={sessions}
            therapistId={therapistId}
            therapists={therapists}
            clients={clients}
            month={Number(month)}
            year={Number(year)}
            onBookingSuccess={handleCalendarBookingSuccess}
          />
        </div>
      )}

      <SessionEditModal
        isNew={true}
        booking={null}
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSuccess={() => { setAdding(false); load(); }}
        therapists={therapists}
        sessions={sessions}
        clients={clients}
      />

      {editingSession && (
        <SessionEditModal
          isNew={false}
          booking={editingSession}
          isOpen={!!editingSession}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); }}
          therapists={therapists}
          sessions={sessions}
          clients={clients}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingSession}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Session"
        message={deletingSession ? `Delete session for ${deletingSession.Client_Name} on ${deletingSession.Session_Date}? This cannot be undone.` : ''}
        confirmColor="danger"
      />
    </div>
  );
}
