import { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Card, CardBody, Spinner } from '@heroui/react';
import { getDashboardData, getSessions, getExpenses, getPayouts, getTransactions } from '../api';
import { exportSessionsExcel, exportExpensesExcel, exportPayoutsExcel, exportTransactionsExcel } from '../utils/excel';
import { useI18n } from '../i18n';
import RevenueChart from '../components/RevenueChart';
import IncomeStatement from '../components/IncomeStatement';

const NOW         = new Date();
const MONTH_ABBR  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const YEARS       = [NOW.getFullYear() - 1, NOW.getFullYear()];
const MONTHS      = Array.from({ length: 12 }, (_, i) => i + 1);

export default function Reports() {
  const { t } = useI18n();
  const [month, setMonth] = useState(NOW.getMonth() + 1);
  const [year, setYear]   = useState(NOW.getFullYear());

  const [dash, setDash]         = useState(null);
  const [sessions, setSessions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ytd, setYtd]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState({});

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardData(month, year),
      getSessions({ month, year }),
      getExpenses(month, year),
    ]).then(([d, s, e]) => {
      setDash(d.success ? d.data : null);
      setSessions(s.success ? (s.data ?? []) : []);
      setExpenses(e.success ? (e.data ?? []) : []);
      setLoading(false);
    });
  }, [month, year]);

  // YTD: fetch all completed months of the selected year
  useEffect(() => {
    const lastMonth = year === NOW.getFullYear() ? NOW.getMonth() + 1 : 12;
    Promise.all(
      Array.from({ length: lastMonth }, (_, i) =>
        getDashboardData(i + 1, year).then((r) => ({
          month: MONTH_ABBR[i],
          revenue:  Number(r.data?.totalRevenue  || 0),
          expenses: Number(r.data?.totalExpenses || 0),
        }))
      )
    ).then(setYtd);
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runExport(key, fn) {
    setExporting((e) => ({ ...e, [key]: true }));
    const [s, exp, p, tx] = await Promise.all([
      getSessions({ month, year }),
      getExpenses(month, year),
      getPayouts(month, year),
      getTransactions(month, year),
    ]);
    if (key === 'sessions')     exportSessionsExcel(s.data ?? [], month, year);
    if (key === 'expenses')     exportExpensesExcel(exp.data ?? [], month, year);
    if (key === 'payouts')      exportPayoutsExcel(p.data ?? [], month, year);
    if (key === 'transactions') exportTransactionsExcel(tx.data?.rows ?? tx.data ?? [], month, year);
    setExporting((e) => ({ ...e, [key]: false }));
  }

  const EXPORTS = [
    { key: 'sessions',     label: t('reports.exportSessions') },
    { key: 'expenses',     label: t('reports.exportExpenses') },
    { key: 'payouts',      label: t('reports.exportPayouts') },
    { key: 'transactions', label: t('cashflow.export') },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Period selector */}
      <div className="flex gap-2">
        <Select size="sm" label={t('reports.selectMonth')} className="w-28"
          selectedKeys={[String(month)]} onSelectionChange={(k) => setMonth(Number([...k][0]))}>
          {MONTHS.map((m) => <SelectItem key={String(m)}>{m}</SelectItem>)}
        </Select>
        <Select size="sm" label="" className="w-24"
          selectedKeys={[String(year)]} onSelectionChange={(k) => setYear(Number([...k][0]))}>
          {YEARS.map((y) => <SelectItem key={String(y)}>{y}</SelectItem>)}
        </Select>
      </div>

      {/* Income Statement */}
      <IncomeStatement dashData={dash} sessions={sessions} expenses={expenses} loading={loading} />

      {/* YTD chart */}
      <Card>
        <CardBody className="p-4 gap-2">
          <p className="text-sm font-semibold text-default-700">{t('reports.ytdChart')} {year}</p>
          <RevenueChart data={ytd} loading={loading} />
        </CardBody>
      </Card>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant="flat"
            isDisabled={!!exporting[key]}
            startContent={exporting[key] ? <Spinner size="sm" /> : undefined}
            onPress={() => runExport(key, key)}
          >
            {exporting[key] ? t('reports.generating') : label}
          </Button>
        ))}
      </div>
    </div>
  );
}
