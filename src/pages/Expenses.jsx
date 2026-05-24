import { useState, useEffect, useMemo } from 'react';
import { Button, Card } from '@heroui/react';
import { getExpenses, deleteExpense } from '../api';
import { buildExpensesExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import ExpenseChart from '../components/ExpenseChart';
import AddExpenseModal from '../components/AddExpenseModal';
import EditExpenseModal from '../components/EditExpenseModal';
import ConfirmModal from '../components/ConfirmModal';
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

export default function Expenses() {
  const { t } = useI18n();
  const [month, setMonth]           = useState(String(NOW.getMonth() + 1));
  const [year, setYear]             = useState(String(NOW.getFullYear()));
  const [rows, setRows]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [addOpen, setAddOpen]           = useState(false);
  const [duplicatingRow, setDuplicatingRow] = useState(null);
  const [editingRow, setEditingRow]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    getExpenses(Number(month), Number(year)).then((r) => {
      setRows(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalSpent = useMemo(() =>
    (Array.isArray(rows) ? rows : []).reduce((s, r) => s + Number(r.Actual_EGP || 0), 0),
  [rows]);

  const chartData = useMemo(() => {
    const map = {};
    (Array.isArray(rows) ? rows : []).forEach((r) => {
      const cat = r.Category || 'Other';
      if (!map[cat]) map[cat] = { category: cat, actual: 0 };
      map[cat].actual += Number(r.Actual_EGP || 0);
    });
    return Object.values(map);
  }, [rows]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteExpense(deleteTarget.Expense_ID);
    setDeleteTarget(null);
    load();
  }

  const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

  const columns = [
    { key: 'Date', label: t('sessions.date'), sortable: true,
      render: (r) => <span>{String(r.Date || '').substring(0, 10)}</span> },
    { key: 'Category',    label: t('expenses.category'),    sortable: true },
    { key: 'Sub_Category',label: t('expenses.subCategory'), sortable: true },
    { key: 'Item',        label: t('expenses.item') },
    { key: 'Actual_EGP', label: t('expenses.amount'),
      render: (r) => <span dir="ltr">{fmt(r.Actual_EGP)}</span> },
    { key: 'Paid_By',    label: t('expenses.paidBy') },
    { key: 'Notes',      label: 'Notes' },
    {
      key: '_actions', label: '',
      render: (r) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setEditingRow(r); }}
            style={{ fontSize: '12px', color: '#0E9B73', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
          >
            ✏️ {t('general.edit')}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDuplicatingRow(r); setAddOpen(true); }}
            style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', whiteSpace: 'nowrap' }}
          >
            📋 {t('expenses.newFromThis') || 'New'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
            style={{ fontSize: '12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
          >
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      <div className="flex flex-wrap gap-2 items-end">
        <FilterSelect value={month} onChange={setMonth} label={t('sessions.date')}
          options={MONTHS.map((m) => ({ id: String(m), label: m }))} />
        <FilterSelect value={year} onChange={setYear} label=""
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
        <Button size="sm" color="primary" onPress={() => { setDuplicatingRow(null); setAddOpen(true); }}>+ {t('expenses.addExpense')}</Button>
        <Button size="sm" variant="flat" onPress={() => buildExpensesExcel(rows, month, year)}>{t('expenses.export')}</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-default-50 rounded-xl px-3 py-2">
          <p className="text-default-400 text-xs">{t('expenses.actual')}</p>
          <p dir="ltr" className="font-semibold text-default-800">{fmt(totalSpent)}</p>
        </div>
        <div className="bg-default-50 rounded-xl px-3 py-2">
          <p className="text-default-400 text-xs">{t('expenses.expenseLog')}</p>
          <p dir="ltr" className="font-semibold text-default-800">{rows.length} items</p>
        </div>
      </div>

      <Card className="leen-card">
        <Card.Content className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('expenses.chart')}</p>
          <ExpenseChart data={chartData} loading={loading} />
        </Card.Content>
      </Card>

      <DataTable columns={columns} data={rows} loading={loading} emptyMessage={t('general.noResults')} />

      <AddExpenseModal
        isOpen={addOpen}
        initialData={duplicatingRow}
        onClose={() => { setAddOpen(false); setDuplicatingRow(null); }}
        onSuccess={() => { setAddOpen(false); setDuplicatingRow(null); load(); }}
      />

      <EditExpenseModal
        expense={editingRow}
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        onSuccess={() => { setEditingRow(null); load(); }}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={deleteTarget ? `Delete "${deleteTarget.Item}" (${fmt(deleteTarget.Actual_EGP)})?` : ''}
        confirmColor="danger"
      />
    </div>
  );
}
