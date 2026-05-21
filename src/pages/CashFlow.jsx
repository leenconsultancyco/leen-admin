import { useState, useEffect, useMemo } from 'react';
import { Button } from '@heroui/react';
import { getTransactions } from '../api';
import { buildTransactionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import AddTransactionModal from '../components/AddTransactionModal';
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

function fmt(n, cls = '') {
  if (!n && n !== 0) return <span className="text-default-300">—</span>;
  return <span dir="ltr" className={cls}>{Number(n).toLocaleString('en-EG')} EGP</span>;
}

export default function CashFlow() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(String(NOW.getMonth() + 1));
  const [year, setYear]       = useState(String(NOW.getFullYear()));
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getTransactions(Number(month), Number(year)).then((r) => {
      const raw = r.data?.rows ?? r.data;
      setRows(r.success && Array.isArray(raw) ? raw : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => (Array.isArray(rows) ? rows : []).reduce((acc, r) => ({
    in:  acc.in  + Number(r.Cash_In  || 0),
    out: acc.out + Number(r.Cash_Out || 0),
  }), { in: 0, out: 0 }), [rows]);

  const net = totals.in - totals.out;

  const columns = [
    { key: 'Date',        label: t('cashflow.date'),        sortable: true },
    { key: 'Description', label: t('cashflow.description'), sortable: true },
    { key: 'Category',    label: t('cashflow.category') },
    { key: 'Cash_In',     label: t('cashflow.cashIn'),  render: (r) => fmt(r.Cash_In,  'text-success font-medium') },
    { key: 'Cash_Out',    label: t('cashflow.cashOut'), render: (r) => fmt(r.Cash_Out, 'text-danger  font-medium') },
    { key: 'Balance',     label: t('cashflow.balance'), render: (r) => fmt(r.Balance, 'font-semibold') },
    { key: 'Method',      label: t('cashflow.method') },
    { key: 'Notes',       label: 'Notes' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      <div className="flex flex-wrap gap-2 items-end">
        <FilterSelect value={month} onChange={setMonth} label={t('sessions.date')}
          options={MONTHS.map((m) => ({ id: String(m), label: m }))} />
        <FilterSelect value={year} onChange={setYear} label=""
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
        <Button size="sm" color="primary" onPress={() => setAddOpen(true)}>+ {t('cashflow.addTransaction')}</Button>
        <Button size="sm" variant="flat" onPress={() => buildTransactionsExcel(rows, month, year)}>{t('cashflow.export')}</Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        {[
          { label: t('cashflow.totalIn'),  val: totals.in,  cls: 'text-success' },
          { label: t('cashflow.totalOut'), val: totals.out, cls: 'text-danger'  },
          { label: t('cashflow.net'),      val: net,        cls: net >= 0 ? 'text-primary' : 'text-danger' },
        ].map(({ label, val, cls }) => (
          <div key={label} className="bg-default-50 rounded-xl px-3 py-2">
            <p className="text-default-400 text-xs">{label}</p>
            <p dir="ltr" className={`font-semibold ${cls}`}>{Number(val).toLocaleString('en-EG')} EGP</p>
          </div>
        ))}
      </div>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage={t('general.noResults')} />
      <AddTransactionModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={load} />
    </div>
  );
}
