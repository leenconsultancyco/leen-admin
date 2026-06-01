import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Card, Spinner } from '@heroui/react';
import { getDashboardData, getSessions, getExpenses, getPayouts, getTransactions } from '../api';
import { exportSessionsExcel, exportExpensesExcel, exportPayoutsExcel, exportTransactionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import RevenueChart from '../components/RevenueChart';
import IncomeStatement from '../components/IncomeStatement';
import PageFilterBar, { FilterSelect } from '../components/PageFilterBar';

const NOW         = new Date();
const MONTH_ABBR  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS       = [NOW.getFullYear() - 1, NOW.getFullYear()];
const MONTHS      = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Reports() {
  const { t } = useI18n();
  const [month, setMonth]       = useState(String(NOW.getMonth() + 1));
  const [year, setYear]         = useState(String(NOW.getFullYear()));
  const [dash, setDash]         = useState(null);
  const [sessions, setSessions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ytd, setYtd]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState({});
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardData(Number(month), Number(year)),
      getSessions({ month: Number(month), year: Number(year) }),
      getExpenses(Number(month), Number(year)),
    ]).then(([d, s, e]) => {
      setDash(d.success ? d.data : null);
      setSessions(s.success && Array.isArray(s.data) ? s.data : []);
      setExpenses(e.success && Array.isArray(e.data) ? e.data : []);
      setLoading(false);
    });
  }, [month, year]);

  useEffect(() => {
    const yr = Number(year);
    const lastMonth = yr === NOW.getFullYear() ? NOW.getMonth() + 1 : 12;
    Promise.all(
      Array.from({ length: lastMonth }, (_, i) =>
        getDashboardData(i + 1, yr).then((r) => ({
          month:    MONTH_ABBR[i],
          revenue:  Number(r.data?.totalRevenue  || 0),
          expenses: Number(r.data?.totalExpenses || 0),
        }))
      )
    ).then(setYtd);
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runExport(key) {
    setExporting((e) => ({ ...e, [key]: true }));
    const [s, exp, p, tx] = await Promise.all([
      getSessions({ month: Number(month), year: Number(year) }),
      getExpenses(Number(month), Number(year)),
      getPayouts(Number(month), Number(year)),
      getTransactions(Number(month), Number(year)),
    ]);
    if (key === 'sessions')     exportSessionsExcel(Array.isArray(s.data) ? s.data : [], month, year);
    if (key === 'expenses')     exportExpensesExcel(Array.isArray(exp.data) ? exp.data : [], month, year);
    if (key === 'payouts')      exportPayoutsExcel(Array.isArray(p.data) ? p.data : [], month, year);
    const txRows = tx.data?.rows ?? tx.data;
    if (key === 'transactions') exportTransactionsExcel(Array.isArray(txRows) ? txRows : [], month, year);
    setExporting((e) => ({ ...e, [key]: false }));
  }

  const EXPORTS = [
    { key: 'sessions',     label: t('reports.exportSessions') },
    { key: 'expenses',     label: t('reports.exportExpenses') },
    { key: 'payouts',      label: t('reports.exportPayouts')  },
    { key: 'transactions', label: t('cashflow.export')        },
  ];

  return (
    <div className="flex flex-col gap-5">
      {actionsTarget && createPortal(
        <div className="flex items-center gap-1.5 flex-wrap">
          {EXPORTS.map(({ key, label }) => (
            <Button key={key} size="sm" variant="flat" isDisabled={!!exporting[key]}
              startContent={exporting[key] ? <Spinner size="sm" /> : undefined}
              onPress={() => runExport(key)}>
              {exporting[key] ? t('reports.generating') : `↓ ${label}`}
            </Button>
          ))}
        </div>,
        actionsTarget
      )}

      <PageFilterBar>
        <FilterSelect value={month} onChange={setMonth}
          options={MONTHS.map((m) => ({ id: String(m), label: MONTH_ABBR[m - 1] }))} />
        <FilterSelect value={year} onChange={setYear}
          options={YEARS.map((y) => ({ id: String(y), label: y }))} />
      </PageFilterBar>

      <IncomeStatement dashData={dash} sessions={sessions} expenses={expenses} loading={loading} />

      <Card className="leen-card">
        <Card.Content className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('reports.ytdChart')} {year}</p>
          <RevenueChart data={ytd} loading={loading} />
        </Card.Content>
      </Card>
    </div>
  );
}
