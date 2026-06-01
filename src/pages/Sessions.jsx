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
const NOW      = new Date();

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

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-xs text-default-500">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-default-200 rounded-lg px-2 py-1.5 text-sm bg-white text-default-700 focus:outline-none"
      >
        {options.map(({ id, label: lbl }) => <option key={id} value={id}>{lbl}</option>)}
      </select>
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
  const [sessions, setSessions]       = useState([]);
  const [therapists, setTherapists]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [editingSession, setEditing]  = useState(null);
  const [deletingSession, setDeleting]= useState(null);
  const [deleting, setDelBusy]        = useState(false);
  const [view, setView]               = useState('table');
  const [portalTarget, setPortalTarget] = useState(null);

  const years  = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // Grab the portal slot once AppShell's title ribbon is in the DOM
  useEffect(() => {
    setPortalTarget(document.getElementById('page-title-extras'));
  }, []);

  useEffect(() => {
    getTherapistsFull().then((r) => { setTherapists(r.success && Array.isArray(r.data) ? r.data : []); });
  }, []);

  const load = () => {
    setLoading(true);
    getSessions({ month: Number(month), year: Number(year), therapistId: therapistId || undefined, status: status || undefined })
      .then((r) => { setSessions(r.success && Array.isArray(r.data) ? r.data : []); setLoading(false); });
  };

  useEffect(load, [month, year, therapistId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = (Array.isArray(sessions) ? sessions : []).filter((s) => !payment || s.Payment_Status === payment);

  const totals = useMemo(() => (Array.isArray(filtered) ? filtered : []).reduce((acc, s) => ({
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
    { key: 'Session_Time',      label: t('sessions.time'),
      render: (r) => <span>{to12h(r.Session_Time)}</span> },
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

  // Controls rendered into the AppShell title ribbon via portal
  const filterBar = (
    <div className="px-4 md:px-7 pb-3 border-t border-default-100 flex flex-wrap items-end gap-2">
      <FilterSelect value={month} onChange={setMonth} label={t('sessions.date')}
        options={months.map((m) => ({ id: String(m), label: m }))} />
      <FilterSelect value={year} onChange={setYear} label=""
        options={years.map((y) => ({ id: String(y), label: y }))} />
      <FilterSelect value={therapistId} onChange={setTherapistId} label={t('sessions.filterByTherapist')}
        options={[{ id: '', label: t('sessions.allSessions') }, ...therapists.map((th) => ({ id: th.Therapist_ID, label: th.Name_EN }))]} />
      <FilterSelect value={status} onChange={setStatus} label={t('sessions.filterByStatus')}
        options={[{ id: '', label: t('sessions.allSessions') }, ...STATUSES.map((s) => ({ id: s, label: s }))]} />
      <FilterSelect value={payment} onChange={setPayment} label={t('sessions.payment')}
        options={[{ id: '', label: 'All' }, ...PAYMENTS.map((p) => ({ id: p, label: p }))]} />
      <div className="flex items-end gap-2 ms-auto flex-wrap">
        <Button size="sm" variant="flat" onPress={() => buildSessionsExcel(filtered, month, year)}>
          {t('sessions.export')}
        </Button>
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('sessions.addSession') || 'Add Session'}
        </Button>
        <div className="flex gap-1">
          <button
            onClick={() => setView('table')}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
            style={{
              border: `1.5px solid ${view === 'table' ? '#0E9B73' : '#d1d5db'}`,
              backgroundColor: view === 'table' ? '#0E9B73' : '#fff',
              color: view === 'table' ? '#fff' : '#6b7280',
              fontWeight: view === 'table' ? 600 : 400,
            }}
          >
            ≡ {t('sessions.tableView')}
          </button>
          <button
            onClick={() => setView('calendar')}
            className="px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
            style={{
              border: `1.5px solid ${view === 'calendar' ? '#0E9B73' : '#d1d5db'}`,
              backgroundColor: view === 'calendar' ? '#0E9B73' : '#fff',
              color: view === 'calendar' ? '#fff' : '#6b7280',
              fontWeight: view === 'calendar' ? 600 : 400,
            }}
          >
            ⊞ {t('sessions.calendarView')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {portalTarget && createPortal(filterBar, portalTarget)}

      <OfflineBanner />

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
