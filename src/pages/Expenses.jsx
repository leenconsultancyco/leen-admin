import { useState, useEffect, useMemo } from 'react';
import { Button, Card } from '@heroui/react';
import { getExpenses } from '../api';
import { buildExpensesExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import ExpenseChart from '../components/ExpenseChart';
import AddExpenseModal from '../components/AddExpenseModal';
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

function VarianceCell({ row }) {
  const v = Number(row.Variance || (row.Actual_EGP || 0) - (row.Expected_EGP || 0));
  if (v === 0) return <span dir="ltr" className="text-default-400">0</span>;
  return (
    <span dir="ltr" className={v > 0 ? 'text-danger font-medium' : 'text-success font-medium'}>
      {v > 0 ? '▲' : '▼'} {Math.abs(v).toLocaleString('en-EG')} EGP
    </span>
  );
}

export default function Expenses() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(String(NOW.getMonth() + 1));
  const [year, setYear]       = useState(String(NOW.getFullYear()));
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getExpenses(Number(month), Number(year)).then((r) => {
      setRows(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => (Array.isArray(rows) ? rows : []).reduce((acc, r) => ({
    expected: acc.expected + Number(r.Expected_EGP || 0),
    actual:   acc.actual   + Number(r.Actual_EGP   || 0),
  }), { expected: 0, actual: 0 }), [rows]);

  const variance = totals.actual - totals.expected;

  const chartData = useMemo(() => {
    const map = {};
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      const cat = r.Category || 'Other';
      if (!map[cat]) map[cat] = { category: cat, expected: 0, actual: 0 };
      map[cat].expected += Number(r.Expected_EGP || 0);
      map[cat].actual   += Number(r.Actual_EGP   || 0);
    });
    return Object.values(map);
  }, [rows]);

  const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

  const columns = [
    { key: 'Date',         label: t('sessions.date'),     sortable: true },
    { key: 'Category',     label: t('expenses.category'), sortable: true },
    { key: 'Item',         label: t('expenses.item') },
    { key: 'Expected_EGP', label: t('expenses.expected'), render: (r) => <span dir="ltr">{fmt(r.Expected_EGP)}</span> },
    { key: 'Actual_EGP',   label: t('expenses.actual'),   render: (r) => <span dir="ltr">{fmt(r.Actual_EGP)}</span> },
    { key: 'Variance',     label: t('expenses.variance'), render: (r) => <VarianceCell row={r} /> },
    { key: 'Paid_By',      label: t('expenses.paidBy') },
    { key: 'Notes',        label: 'Notes' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      <div className="flex flex-wrap gap-2 items-end">
        <FilterSelect value={month} onChange={setMonth} label={t('sessions.date')}
          options={MONTHS.map((m) => ({ id: String(m), label: m }))} />
        <FilterSelect value={year} onChange={setYear} label=""
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
        <Button size="sm" color="primary" onPress={() => setAddOpen(true)}>+ {t('expenses.addExpense')}</Button>
        <Button size="sm" variant="flat" onPress={() => buildExpensesExcel(rows, month, year)}>{t('expenses.export')}</Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="bg-default-50 rounded-xl px-3 py-2">
          <p className="text-default-400 text-xs">{t('expenses.expected')}</p>
          <p dir="ltr" className="font-semibold text-default-800">{fmt(totals.expected)}</p>
        </div>
        <div className="bg-default-50 rounded-xl px-3 py-2">
          <p className="text-default-400 text-xs">{t('expenses.actual')}</p>
          <p dir="ltr" className="font-semibold text-default-800">{fmt(totals.actual)}</p>
        </div>
        <div className="bg-default-50 rounded-xl px-3 py-2">
          <p className="text-default-400 text-xs">{t('expenses.variance')}</p>
          <p dir="ltr" className={`font-semibold ${variance > 0 ? 'text-danger' : variance < 0 ? 'text-success' : 'text-default-800'}`}>
            {variance > 0 ? '▲' : variance < 0 ? '▼' : ''} {Math.abs(variance).toLocaleString('en-EG')} EGP
          </p>
        </div>
      </div>

      <Card>
        <Card.Content className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('expenses.chart')}</p>
          <ExpenseChart data={chartData} loading={loading} />
        </Card.Content>
      </Card>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage={t('general.noResults')} />
      <AddExpenseModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={load} />
    </div>
  );
}
