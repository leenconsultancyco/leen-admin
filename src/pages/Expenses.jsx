import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import PageFilterBar, { FilterSelect, SearchInput } from '../components/PageFilterBar';

const NOW          = new Date();
const YEARS        = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS       = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

const fmt = (n) => `${Number(n).toLocaleString('en-EG')} EGP`;

export default function Expenses() {
  const { t, lang } = useI18n();
  const [month, setMonth]               = useState(String(NOW.getMonth() + 1));
  const [year, setYear]                 = useState(String(NOW.getFullYear()));
  const [search, setSearch]             = useState('');
  const [rows, setRows]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [addOpen, setAddOpen]           = useState(false);
  const [duplicatingRow, setDuplicating]= useState(null);
  const [editingRow, setEditingRow]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

  const load = () => {
    setLoading(true);
    getExpenses(Number(month), Number(year)).then((r) => {
      setRows(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      (r.Item || '').toLowerCase().includes(q) ||
      (r.Category || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalSpent = useMemo(() =>
    filtered.reduce((s, r) => s + Number(r.Actual_EGP || 0), 0),
  [filtered]);

  const chartData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
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

  const columns = [
    { key: 'Date',         label: t('sessions.date'),      sortable: true,
      render: (r) => <span>{String(r.Date || '').substring(0, 10)}</span> },
    { key: 'Category',     label: t('expenses.category'),    sortable: true },
    { key: 'Sub_Category', label: t('expenses.subCategory'), sortable: true },
    { key: 'Item',         label: t('expenses.item') },
    { key: 'Actual_EGP',  label: t('expenses.amount'),
      render: (r) => <span dir="ltr">{fmt(r.Actual_EGP)}</span> },
    { key: 'Paid_By',     label: t('expenses.paidBy') },
    { key: 'Notes',       label: 'Notes' },
    {
      key: '_actions', label: '',
      render: (r) => (
        <div className="flex gap-1 flex-nowrap">
          <button onClick={(e) => { e.stopPropagation(); setEditingRow(r); }}
            className="text-xs text-primary bg-transparent border-none cursor-pointer px-1.5 py-0.5">
            ✏️ {t('general.edit')}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDuplicating(r); setAddOpen(true); }}
            className="text-xs text-indigo-500 bg-transparent border-none cursor-pointer px-1.5 py-0.5 whitespace-nowrap">
            📋 {t('expenses.newFromThis') || 'New'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
            className="text-xs text-danger bg-transparent border-none cursor-pointer px-1.5 py-0.5">
            🗑️
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" onPress={() => buildExpensesExcel(rows, month, year)}>
            ↓ {t('expenses.export')}
          </Button>
          <Button size="sm" color="primary" onPress={() => { setDuplicating(null); setAddOpen(true); }}>
            + {t('expenses.addExpense')}
          </Button>
        </div>,
        actionsTarget
      )}

      <OfflineBanner />

      <PageFilterBar right={<SearchInput value={search} onChange={setSearch} />}>
        <FilterSelect value={month} onChange={setMonth}
          options={MONTHS.map((m) => ({ id: String(m), label: MONTH_NAMES[m - 1] }))} />
        <FilterSelect value={year} onChange={setYear}
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
      </PageFilterBar>

      {/* Header row — eyebrow + title left, total expenses mini-card right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#5A6478', textTransform: 'uppercase', letterSpacing: '.04em', margin: 0 }}>
            {lang === 'ar'
              ? `${MONTH_NAMES_AR[Number(month) - 1]} ${year}`
              : `${MONTH_NAMES[Number(month) - 1].toUpperCase()} ${year}`}
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', marginTop: 4, marginBottom: 0 }}>
            {t('nav.expenses')}
          </p>
        </div>

        <div className="leen-card" style={{
          background: '#fff',
          border: '1px solid #E6EAF1',
          borderRadius: 16,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#FFF3E6',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: 0 }}>
              {t('expenses.actual')} · {MONTH_NAMES[Number(month) - 1]}
            </p>
            <p dir="ltr" style={{ fontSize: 20, fontWeight: 800, color: '#0B1320', margin: 0 }}>
              {fmt(totalSpent)}
            </p>
          </div>
        </div>
      </div>

      <Card className="leen-card">
        <Card.Content className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('expenses.chart')}</p>
          <ExpenseChart data={chartData} loading={loading} />
        </Card.Content>
      </Card>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />

      <AddExpenseModal
        isOpen={addOpen}
        initialData={duplicatingRow}
        onClose={() => { setAddOpen(false); setDuplicating(null); }}
        onSuccess={() => { setAddOpen(false); setDuplicating(null); load(); }}
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
