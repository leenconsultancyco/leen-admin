import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Chip, Card } from '@heroui/react';
import { getSessions, getTherapistsFull, deleteBooking, deleteTransactionByBookingId } from '../api';
import { toast } from '../components/Toast';
import { buildSessionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import SessionActionsMenu from '../components/SessionActionsMenu';
import SessionEditModal from '../components/SessionEditModal';
import ConfirmModal from '../components/ConfirmModal';
import OfflineBanner from '../components/OfflineBanner';
import SessionCalendarView from '../components/SessionCalendarView';

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

function FilterSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none border border-default-200 rounded-lg ps-3 pe-7 py-2 text-sm bg-white text-default-700 cursor-pointer focus:outline-none focus:border-primary min-w-[120px]"
      >
        {options.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select>
      <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-default-400 text-xs">▾</span>
    </div>
  );
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
      <div className="rounded-2xl border border-default-200 bg-white shadow-sm px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Filter funnel icon */}
          <svg className="text-default-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>

          <FilterSelect value={therapistId} onChange={setTherapistId}
            options={[{ id: '', label: t('sessions.allTherapists') || 'All therapists' }, ...therapists.map((th) => ({ id: th.Therapist_ID, label: th.Name_EN }))]} />

          <FilterSelect value={status} onChange={setStatus}
            options={[{ id: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ id: s, label: s }))]} />

          <FilterSelect value={payment} onChange={setPayment}
            options={[{ id: '', label: 'All payments' }, ...PAYMENTS.map((p) => ({ id: p, label: p }))]} />

          {/* Month + Year combined visually */}
          <div className="flex gap-1">
            <FilterSelect value={month} onChange={setMonth}
              options={months.map((m) => ({ id: String(m), label: MONTH_NAMES[m - 1] }))} />
            <FilterSelect value={year} onChange={setYear}
              options={years.map((y) => ({ id: String(y), label: y }))} />
          </div>

          {/* Search + view toggle pushed to the right */}
          <div className="ms-auto flex items-center gap-2 flex-wrap">
            <div className="relative">
              <svg className="absolute start-2.5 top-1/2 -translate-y-1/2 text-default-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="border border-default-200 rounded-lg ps-8 pe-3 py-2 text-sm bg-white text-default-700 focus:outline-none focus:border-primary w-44"
              />
            </div>

            {/* Segmented table / calendar toggle */}
            <div className="flex bg-default-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'table' ? 'bg-white text-primary shadow-sm' : 'text-default-500 hover:text-default-700'
                }`}
              >
                ≡ {t('sessions.tableView')}
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  view === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-default-500 hover:text-default-700'
                }`}
              >
                ⊞ {t('sessions.calendarView')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Totals — single centered card */}
      <div className="flex justify-center">
        <Card className="w-full max-w-2xl">
          <Card.Content>
            <div className="flex flex-wrap justify-around gap-x-8 gap-y-3 text-center py-1">
              {[
                [t('sessions.allSessions'),    totals.sessions],
                [t('sessions.fee'),            fmt(totals.revenue)],
                [t('sessions.therapistShare'), fmt(totals.therapist)],
                [t('sessions.centerShare'),    fmt(totals.center)],
              ].map(([label, val]) => (
                <div key={label} className="flex flex-col gap-0.5 min-w-[100px]">
                  <span className="text-xs text-default-400">{label}</span>
                  <span className="text-base font-semibold text-default-800" dir="ltr">{val}</span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      </div>

      {view === 'table' ? (
        <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />
      ) : (
        <SessionCalendarView
          key={`cal-${month}-${year}-${therapistId}`}
          sessions={sessions}
          therapistId={therapistId}
          therapists={therapists}
          month={Number(month)}
          year={Number(year)}
          onBookingSuccess={handleCalendarBookingSuccess}
        />
      )}

      <SessionEditModal
        isNew={true}
        booking={null}
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSuccess={() => { setAdding(false); load(); }}
        therapists={therapists}
        sessions={sessions}
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
