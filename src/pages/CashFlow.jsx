import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@heroui/react';
import { getTransactions } from '../api';
import { buildTransactionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import AddTransactionModal from '../components/AddTransactionModal';
import OfflineBanner from '../components/OfflineBanner';
import PageFilterBar, { FilterSelect, SearchInput } from '../components/PageFilterBar';
import KpiCard from '../components/KpiCard';

const NOW        = new Date();
const YEARS      = [NOW.getFullYear() - 1, NOW.getFullYear(), NOW.getFullYear() + 1];
const MONTHS     = Array.from({ length: 12 }, (_, i) => i + 1);
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtEGP(n) {
  return `${Number(n).toLocaleString('en-EG')} EGP`;
}

function CellAmt({ n, cls }) {
  if (!n && n !== 0) return <span className="text-default-300">—</span>;
  return <span dir="ltr" className={cls}>{fmtEGP(n)}</span>;
}

export default function CashFlow() {
  const { t } = useI18n();
  const [month, setMonth]     = useState(String(NOW.getMonth() + 1));
  const [year, setYear]       = useState(String(NOW.getFullYear()));
  const [search, setSearch]   = useState('');
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

  const load = () => {
    setLoading(true);
    getTransactions(Number(month), Number(year)).then((r) => {
      const raw = r.data?.rows ?? r.data;
      setRows(r.success && Array.isArray(raw) ? raw : []);
      setLoading(false);
    });
  };

  useEffect(load, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      (r.Description || '').toLowerCase().includes(q) ||
      (r.Category || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totals = useMemo(() => filtered.reduce((acc, r) => ({
    in:  acc.in  + Number(r.Cash_In  || 0),
    out: acc.out + Number(r.Cash_Out || 0),
  }), { in: 0, out: 0 }), [filtered]);

  const net = totals.in - totals.out;

  const columns = [
    { key: 'Date',        label: t('cashflow.date'),        sortable: true },
    { key: 'Description', label: t('cashflow.description'), sortable: true },
    { key: 'Category',    label: t('cashflow.category') },
    { key: 'Cash_In',     label: t('cashflow.cashIn'),  render: (r) => <CellAmt n={r.Cash_In}  cls="text-success font-medium" /> },
    { key: 'Cash_Out',    label: t('cashflow.cashOut'), render: (r) => <CellAmt n={r.Cash_Out} cls="text-danger font-medium" /> },
    { key: 'Balance',     label: t('cashflow.balance'), render: (r) => <CellAmt n={r.Balance}  cls="font-semibold" /> },
    { key: 'Method',      label: t('cashflow.method') },
    { key: 'Notes',       label: 'Notes' },
  ];

  const kpiMetrics = [
    {
      label: t('cashflow.totalIn'),
      value: fmtEGP(totals.in),
      iconBg: '#E6F6F0',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A6E51" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
        </svg>
      ),
    },
    {
      label: t('cashflow.totalOut'),
      value: fmtEGP(totals.out),
      iconBg: '#FFEBEE',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
        </svg>
      ),
    },
    {
      label: t('cashflow.net'),
      value: fmtEGP(net),
      cls: net >= 0 ? 'text-primary' : 'text-danger',
      iconBg: net >= 0 ? '#E3F2FD' : '#FFEBEE',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={net >= 0 ? '#1A6ED8' : '#C62828'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <div className="flex items-center gap-2">
          <Button size="sm" variant="flat" onPress={() => buildTransactionsExcel(rows, month, year)}>
            ↓ {t('cashflow.export')}
          </Button>
          <Button size="sm" color="primary" onPress={() => setAddOpen(true)}>
            + {t('cashflow.addManualEntry')}
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

      <KpiCard metrics={kpiMetrics} />

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage={t('general.noResults')} />

      <AddTransactionModal isOpen={addOpen} onClose={() => setAddOpen(false)} onSuccess={load} />
    </div>
  );
}
