import { useState, useEffect, useMemo } from 'react';
import { Button, Chip } from '@heroui/react';
import { getSessions, getTherapistsFull, deleteBooking, deleteTransactionByBookingId } from '../api';
import { toast } from '../components/Toast';
import { buildSessionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import SessionActionsMenu from '../components/SessionActionsMenu';
import SessionEditModal from '../components/SessionEditModal';
import ConfirmModal from '../components/ConfirmModal';
import OfflineBanner from '../components/OfflineBanner';

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

// Thin native-select wrapper used for the filter row — avoids ListBox verbosity for simple dropdowns
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
  const [month, setMonth]           = useState(String(NOW.getMonth() + 1));
  const [year, setYear]             = useState(String(NOW.getFullYear()));
  const [therapistId, setTherapistId] = useState('');
  const [status, setStatus]         = useState('');
  const [payment, setPayment]       = useState('');
  const [sessions, setSessions]       = useState([]);
  const [therapists, setTherapists]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [editingSession, setEditing]  = useState(null);
  const [deletingSession, setDeleting]= useState(null);
  const [deleting, setDelBusy]        = useState(false);

  const years  = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

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

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      <div className="flex flex-wrap gap-2 items-end">
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
        <Button size="sm" variant="flat" onPress={() => buildSessionsExcel(filtered, month, year)}>
          {t('sessions.export')}
        </Button>
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('sessions.addSession') || 'Add Session'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {[
          [t('sessions.allSessions'),    totals.sessions],
          [t('sessions.fee'),            fmt(totals.revenue)],
          [t('sessions.therapistShare'), fmt(totals.therapist)],
          [t('sessions.centerShare'),    fmt(totals.center)],
        ].map(([label, val]) => (
          <div key={label} className="bg-default-50 rounded-xl px-3 py-2">
            <p className="text-default-400 text-xs">{label}</p>
            <p className="font-semibold text-default-800" dir="ltr">{val}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />

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
