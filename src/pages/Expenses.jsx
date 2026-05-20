import { useState, useEffect, useMemo } from 'react';
import { Button, Select, SelectItem, Card, CardBody, Chip } from '@heroui/react';
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

function VarianceCell({ row }) {
  const v = Number(row.Variance || (row.Actual_EGP || 0) - (row.Expected_EGP || 0));
  if (v === 0) return <span dir="ltr" className="text-default-400">0</span>;
  const over = v > 0;
  return (
    <span dir="ltr" className={over ? 'text-danger font-medium' : 'text-success font-medium'}>
      {over ? '▲' : '▼'} {Math.abs(v).toLocaleString('en-EG')} EGP
    </span>
  );
}

export default function Expenses() {
  const { t } = useI18n();
  const [month, setMonth]   = useState(NOW.getMonth() + 1);
  const [year, setYear]     = useState(NOW.getFullYear());
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = () => {
    setLoading(true);
    getExpenses(month, year).then((r) => {
      setRows(r.success ? (r.data ?? []) : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    expected: acc.expected + Number(r.Expected_EGP || 0),
    actual:   acc.actual   + Number(r.Actual_EGP   || 0),
  }), { expected: 0, actual: 0 }), [rows]);

  const variance = totals.actual - totals.expected;

  // Aggregate rows by category for the chart
  const chartData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
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
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-end">
        <Select size="sm" label={t('sessions.date')} className="w-28"
          selectedKeys={[String(month)]} onSelectionChange={(k) => setMonth(Number([...k][0]))}>
          {MONTHS.map((m) => <SelectItem key={String(m)}>{m}</SelectItem>)}
        </Select>
        <Select size="sm" label="" className="w-24"
          selectedKeys={[String(year)]} onSelectionChange={(k) => setYear(Number([...k][0]))}>
          {YEARS.map((y) => <SelectItem key={String(y)}>{y}</SelectItem>)}
        </Select>
        <Button size="sm" color="primary" onPress={() => setAddOpen(true)}>+ {t('expenses.addExpense')}</Button>
        <Button size="sm" variant="flat" onPress={() => buildExpensesExcel(rows, month, year)}>{t('expenses.export')}</Button>
      </div>

      {/* Summary strip */}
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

      {/* Chart */}
      <Card>
        <CardBody className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('expenses.chart')}</p>
          <ExpenseChart data={chartData} loading={loading} />
        </CardBody>
      </Card>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage={t('general.noResults')} />

      <AddExpenseModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={load} />
    </div>
  );
}
