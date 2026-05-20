import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function col(wch) { return { wch }; }

function freeze(ws) {
  ws['!views'] = [{ state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2' }];
}

function makeSheet(headers, rows, colWidths) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = colWidths;
  freeze(ws);
  return ws;
}

function save(wb, filename) {
  XLSX.writeFile(wb, filename);
}

function n(v) { return Number(v || 0); }

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function exportSessionsExcel(sessions, month, year) {
  const headers = [
    'Booking ID', 'Date', 'Time', 'Client', 'Phone', 'Therapist',
    'Type', 'Mode', 'Fee', 'Therapist Share', 'Center Share', 'Status', 'Payment',
  ];
  const rows = sessions.map((r) => [
    r.Booking_ID, r.Session_Date, r.Session_Time, r.Client_Name, r.Client_Phone,
    r.Therapist_Name, r.Session_Type, r.Session_Mode,
    n(r.Fee), n(r.Revenue_Therapist), n(r.Revenue_Center),
    r.Status, r.Payment_Status,
  ]);

  const ws = makeSheet(headers, rows, [
    col(14), col(12), col(8), col(20), col(15), col(20),
    col(12), col(11), col(10), col(14), col(12), col(12), col(10),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sessions');
  save(wb, `Leen-Sessions-${month}-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export function exportExpensesExcel(expenses, month, year) {
  const headers = ['Date', 'Category', 'Item', 'Expected EGP', 'Actual EGP', 'Variance', 'Paid By', 'Notes'];
  const rows = expenses.map((r) => [
    r.Date, r.Category, r.Item,
    n(r.Expected_EGP), n(r.Actual_EGP),
    n(r.Actual_EGP) - n(r.Expected_EGP),
    r.Paid_By, r.Notes,
  ]);

  const totalExpected = rows.reduce((s, r) => s + r[3], 0);
  const totalActual   = rows.reduce((s, r) => s + r[4], 0);
  const totalVariance = totalActual - totalExpected;

  rows.push(['', '', 'TOTAL', totalExpected, totalActual, totalVariance, '', '']);

  const ws = makeSheet(headers, rows, [
    col(12), col(16), col(26), col(14), col(12), col(10), col(14), col(24),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  save(wb, `Leen-Expenses-${month}-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Transactions / Cash Flow
// ---------------------------------------------------------------------------

export function exportTransactionsExcel(transactions, month, year) {
  const headers = ['Date', 'Description', 'Category', 'Sub-Category', 'Cash In', 'Cash Out', 'Balance', 'Method', 'Notes'];
  const rows = transactions.map((r) => [
    r.Date, r.Description, r.Category, r.Sub_Category,
    r.Cash_In  ? n(r.Cash_In)  : null,
    r.Cash_Out ? n(r.Cash_Out) : null,
    n(r.Balance), r.Method, r.Notes,
  ]);

  const totalIn  = rows.reduce((s, r) => s + (r[4] || 0), 0);
  const totalOut = rows.reduce((s, r) => s + (r[5] || 0), 0);
  rows.push(['', 'TOTAL', '', '', totalIn, totalOut, totalIn - totalOut, '', '']);

  const ws = makeSheet(headers, rows, [
    col(12), col(28), col(16), col(16), col(12), col(12), col(14), col(14), col(24),
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  save(wb, `Leen-Transactions-${month}-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Payouts (one sheet per therapist + summary sheet)
// ---------------------------------------------------------------------------

export function exportPayoutsExcel(payouts, month, year) {
  const wb = XLSX.utils.book_new();

  // Per-therapist detail sheets
  payouts.forEach((p) => {
    const sessions = p.sessions ?? [];
    const headers  = ['Date', 'Client', 'Type', 'Fee', 'Therapist Share'];
    const rows     = sessions.map((s) => [
      s.Session_Date, s.Client_Name, s.Session_Type, n(s.Fee), n(s.Revenue_Therapist),
    ]);

    const totalFee   = rows.reduce((s, r) => s + r[3], 0);
    const totalShare = rows.reduce((s, r) => s + r[4], 0);
    rows.push(['', '', 'TOTAL', totalFee, totalShare]);

    const ws = makeSheet(headers, rows, [col(12), col(20), col(14), col(12), col(16)]);
    const sheetName = (p.therapistName || 'Therapist').slice(0, 31); // Excel sheet name limit
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  // Summary sheet
  const summaryHeaders = ['Therapist', 'Total Earned', 'Total Paid', 'Pending'];
  const summaryRows    = payouts.map((p) => [
    p.therapistName, n(p.totalEarned), n(p.totalPaid), n(p.pending),
  ]);
  summaryRows.push([
    'TOTAL',
    summaryRows.reduce((s, r) => s + r[1], 0),
    summaryRows.reduce((s, r) => s + r[2], 0),
    summaryRows.reduce((s, r) => s + r[3], 0),
  ]);

  const summaryWs = makeSheet(summaryHeaders, summaryRows, [col(24), col(14), col(12), col(12)]);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  save(wb, `Leen-Payouts-${month}-${year}.xlsx`);
}

// ---------------------------------------------------------------------------
// Legacy aliases — keep old import names working in Sessions/CashFlow/Expenses/Payouts pages
// ---------------------------------------------------------------------------
export { exportSessionsExcel      as buildSessionsExcel };
export { exportTransactionsExcel  as buildTransactionsExcel };
export { exportExpensesExcel      as buildExpensesExcel };
export { exportPayoutsExcel       as buildPayoutsExcel };
