import { useState, useEffect, useMemo } from 'react';
import { Button, Select, SelectItem, Chip } from '@heroui/react';
import { getSessions, getTherapistsFull } from '../api';
import { buildSessionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import SessionActions from '../components/SessionActions';
import OfflineBanner from '../components/OfflineBanner';

const STATUSES  = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const PAYMENTS  = ['Unpaid', 'Paid'];
const NOW       = new Date();

function statusColor(s) {
  return { Confirmed: 'success', Pending: 'warning', Cancelled: 'danger', Completed: 'primary', 'No-show': 'default' }[s] || 'default';
}

export default function Sessions() {
  const { t } = useI18n();
  const [month, setMonth]           = useState(NOW.getMonth() + 1);
  const [year, setYear]             = useState(NOW.getFullYear());
  const [therapistId, setTherapistId] = useState('');
  const [status, setStatus]         = useState('');
  const [payment, setPayment]       = useState('');
  const [sessions, setSessions]     = useState([]);
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading]       = useState(true);

  const years = [year - 1, year, year + 1];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    getTherapistsFull().then((r) => { if (r.success) setTherapists(r.data ?? []); });
  }, []);

  const load = () => {
    setLoading(true);
    getSessions({ month, year, therapistId: therapistId || undefined, status: status || undefined })
      .then((r) => { setSessions(r.success ? (r.data ?? []) : []); setLoading(false); });
  };

  useEffect(load, [month, year, therapistId, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = payment ? sessions.filter((s) => s.Payment_Status === payment) : sessions;

  const totals = useMemo(() => filtered.reduce((acc, s) => ({
    sessions: acc.sessions + 1,
    revenue:  acc.revenue  + Number(s.Fee || 0),
    therapist:acc.therapist + Number(s.Revenue_Therapist || 0),
    center:   acc.center   + Number(s.Revenue_Center || 0),
  }), { sessions: 0, revenue: 0, therapist: 0, center: 0 }), [filtered]);

  const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

  const columns = [
    { key: 'Client_Name',    label: t('sessions.client'),         sortable: true },
    { key: 'Therapist_Name', label: t('sessions.therapist'),      sortable: true },
    { key: 'Session_Date',   label: t('sessions.date'),           sortable: true },
    { key: 'Session_Time',   label: t('sessions.time') },
    { key: 'Session_Type',   label: t('sessions.type') },
    { key: 'Session_Mode',   label: t('sessions.mode') },
    { key: 'Fee',            label: t('sessions.fee'),            render: (r) => <span dir="ltr">{fmt(r.Fee)}</span> },
    { key: 'Revenue_Therapist', label: t('sessions.therapistShare'), render: (r) => <span dir="ltr">{fmt(r.Revenue_Therapist)}</span> },
    { key: 'Revenue_Center', label: t('sessions.centerShare'),    render: (r) => <span dir="ltr">{fmt(r.Revenue_Center)}</span> },
    { key: 'Status',         label: t('sessions.status'),         render: (r) => <Chip size="sm" color={statusColor(r.Status)} variant="flat">{r.Status}</Chip> },
    { key: 'Payment_Status', label: t('sessions.payment'),        render: (r) => <Chip size="sm" color={r.Payment_Status === 'Paid' ? 'success' : 'warning'} variant="flat">{r.Payment_Status}</Chip> },
    { key: '_actions',       label: t('sessions.actions'),        render: (r) => <SessionActions booking={r} onDone={load} /> },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <Select size="sm" label={t('sessions.date')} className="w-28"
          selectedKeys={[String(month)]} onSelectionChange={(k) => setMonth(Number([...k][0]))}>
          {months.map((m) => <SelectItem key={String(m)}>{m}</SelectItem>)}
        </Select>
        <Select size="sm" label="" className="w-24"
          selectedKeys={[String(year)]} onSelectionChange={(k) => setYear(Number([...k][0]))}>
          {years.map((y) => <SelectItem key={String(y)}>{y}</SelectItem>)}
        </Select>
        <Select size="sm" label={t('sessions.filterByTherapist')} className="w-44"
          selectedKeys={therapistId ? [therapistId] : []} onSelectionChange={(k) => setTherapistId([...k][0] ?? '')}>
          {[{ Therapist_ID: '', Name_EN: t('sessions.allSessions') }, ...therapists].map((th) =>
            <SelectItem key={th.Therapist_ID}>{th.Name_EN}</SelectItem>)}
        </Select>
        <Select size="sm" label={t('sessions.filterByStatus')} className="w-36"
          selectedKeys={status ? [status] : []} onSelectionChange={(k) => setStatus([...k][0] ?? '')}>
          {[{ key: '', label: t('sessions.allSessions') }, ...STATUSES.map((s) => ({ key: s, label: s }))].map((s) =>
            <SelectItem key={s.key}>{s.label}</SelectItem>)}
        </Select>
        <Select size="sm" label={t('sessions.payment')} className="w-32"
          selectedKeys={payment ? [payment] : []} onSelectionChange={(k) => setPayment([...k][0] ?? '')}>
          {[{ key: '', label: 'All' }, ...PAYMENTS.map((p) => ({ key: p, label: p }))].map((p) =>
            <SelectItem key={p.key}>{p.label}</SelectItem>)}
        </Select>
        <Button size="sm" variant="flat" onPress={() => buildSessionsExcel(filtered, month, year)}>
          {t('sessions.export')}
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {[
          [t('sessions.allSessions'), totals.sessions],
          [t('sessions.fee'),         fmt(totals.revenue)],
          [t('sessions.therapistShare'), fmt(totals.therapist)],
          [t('sessions.centerShare'), fmt(totals.center)],
        ].map(([label, val]) => (
          <div key={label} className="bg-default-50 rounded-xl px-3 py-2">
            <p className="text-default-400 text-xs">{label}</p>
            <p className="font-semibold text-default-800" dir="ltr">{val}</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />
    </div>
  );
}
