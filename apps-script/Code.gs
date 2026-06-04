// ============================================================
// Leen Psychotherapy Center — Google Apps Script Backend
// Paste into: Google Sheet → Extensions → Apps Script
// Deploy as: Web app (Execute as Me, Anyone can access)
// Timezone: Set Project Settings → Time zone → Africa/Cairo
// ============================================================

const ALLOWED_ORIGIN = 'https://leenconsultancyco.github.io';
const TZ = 'Africa/Cairo';

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function getSheet(name) { return ss().getSheetByName(name); }

function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      if (val instanceof Date) {
        val = val.getFullYear() === 1899
          ? Utilities.formatDate(val, TZ, 'HH:mm')
          : Utilities.formatDate(val, TZ, 'yyyy-MM-dd');
      }
      obj[h] = val;
    });
    return obj;
  });
}

function cors(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok(data)  { return cors({ success: true,  data,  error: null }); }
function err(msg)  { return cors({ success: false, data: null, error: msg }); }

function checkOrigin(originStr) {
  return (originStr || '').startsWith(ALLOWED_ORIGIN);
}

function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function now_()   { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH:mm:ss'); }

function toDateStr(val) {
  if (!val) return '';
  try { return Utilities.formatDate(new Date(val), TZ, 'yyyy-MM-dd'); } catch { return String(val); }
}

function monthYear(dateVal) {
  const d = new Date(dateVal);
  return { m: d.getMonth() + 1, y: d.getFullYear() };
}

// ---------------------------------------------------------------------------
// ID generation — format: PREFIX-YYYY-NNN
// ---------------------------------------------------------------------------

function nextId(sheetName, prefix, yearPart) {
  const sheet = getSheet(sheetName);
  if (!sheet) return prefix + '-' + yearPart + '-001';
  const col = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues()
    .flat().filter(v => String(v).startsWith(prefix + '-' + yearPart));
  const nums = col.map(v => parseInt(String(v).split('-').pop()) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + '-' + yearPart + '-' + String(next).padStart(3, '0');
}

function nextClientId() {
  const sheet = getSheet('Clients');
  if (!sheet || sheet.getLastRow() < 2) return 'C-001';
  const col = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
    .filter(v => String(v).startsWith('C-')).map(v => parseInt(String(v).slice(2)) || 0);
  return 'C-' + String((col.length ? Math.max(...col) : 0) + 1).padStart(3, '0');
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

function findByIdempotencyKey(sheetName, key) {
  if (!key) return null;
  const sheet = getSheet(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const data = sheet.getDataRange().getValues();
  const col  = data[0].indexOf('Idempotency_Key');
  if (col === -1) return null;
  return data.slice(1).find(row => row[col] === key) || null;
}

// ---------------------------------------------------------------------------
// doGet
// ---------------------------------------------------------------------------

function doGet(e) {
  if (!checkOrigin(e.parameter && e.parameter.origin)) return err('Unauthorized');
  const p = e.parameter || {};
  const action = p.action;
  const month = parseInt(p.month) || 0;
  const year  = parseInt(p.year)  || 0;

  try {
    switch (action) {
      case 'ping':                 return cors({ pong: true });
      case 'getTherapists':        return ok(getTherapists_());
      case 'getAvailableSlots':    return ok(getAvailableSlots_(p.therapistId, p.date));
      case 'getDashboardData':     return ok(getDashboardData_(month, year));
      case 'getSessions':          return ok(getSessions_(month, year, p.therapistId, p.status));
      case 'getTransactions':      return ok(getTransactions_(month, year));
      case 'getExpenses':          return ok(getExpenses_(month, year));
      case 'getPayouts':           return ok(getPayouts_(month, year));
      case 'getClients':           return ok(sheetToObjects(getSheet('Clients')));
      case 'getTherapistsFull':    return ok(sheetToObjects(getSheet('Therapists')));
      case 'getSettings':          return ok(getSettings_());
      case 'getExpenseCategories': return ok(getExpenseCategories_());
      case 'backup':               return ok(backup_());
      default: return err('Unknown action: ' + action);
    }
  } catch (e) { return err(e.message); }
}

// ---------------------------------------------------------------------------
// doPost
// ---------------------------------------------------------------------------

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch { return err('Invalid JSON'); }
  if (!checkOrigin(body.origin)) return err('Unauthorized');

  try {
    switch (body.action) {
      case 'submitBooking':                return ok(submitBooking_(body));
      case 'confirmBooking':               return ok(confirmBooking_(body.bookingId));
      case 'cancelBooking':                return ok(cancelBooking_(body.bookingId, body.reason));
      case 'addTransaction':               return ok(addTransaction_(body));
      case 'addExpense':                   return ok(addExpense_(body));
      case 'editExpense':                  return ok(editExpense_(body));
      case 'deleteExpense':                return ok(deleteExpense_(body));
      case 'markPaid':                     return ok(markPaid_(body.bookingId, body.paymentMethod));
      case 'addClient':                    return ok(addClient_(body));
      case 'updateClient':                 return ok(updateClient_(body));
      case 'addTherapist':                 return ok(addTherapist_(body));
      case 'updateTherapist':              return ok(updateTherapist_(body));
      case 'blockDate':                    return ok(blockDate_(body));
      case 'editBooking':                  return ok(editBooking_(body));
      case 'deleteBooking':                return ok(deleteBooking_(body.bookingId));
      case 'deleteTransactionByBookingId': return ok(deleteTransactionByBookingId_(body.bookingId));
      case 'addBookingAdmin':              return ok(addBookingAdmin_(body));
      case 'markPayoutPaid':               return ok(markPayoutPaid_(body));
      case 'updatePassword':               return ok(updatePassword_(body.newHash));
      case 'updateSettings':               return ok(updateSettings_(body.settings));
      case 'verifyLogin':                  return ok(verifyLogin_(body.username, body.passwordHash));
      case 'saveExpenseCategories':        return ok(saveExpenseCategories_(body));
      default: return err('Unknown action: ' + body.action);
    }
  } catch (e) { return err(e.message); }
}

// ---------------------------------------------------------------------------
// GET — Therapists (active only, for booking app)
// ---------------------------------------------------------------------------

function getTherapists_() {
  return sheetToObjects(getSheet('Therapists')).filter(t => t.Active);
}

// ---------------------------------------------------------------------------
// GET — Available Slots
// ---------------------------------------------------------------------------

function getAvailableSlots_(therapistId, dateStr) {
  const therapist = sheetToObjects(getSheet('Therapists')).find(t => t.Therapist_ID === therapistId);
  if (!therapist) throw new Error('Therapist not found');

  const date    = new Date(dateStr);
  const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()];
  const days    = String(therapist.Working_Days || '').split(',').map(d => d.trim());
  if (!days.includes(dayName)) return [];

  const duration = Number(therapist.Session_Duration_Min) || 50;
  const [startH, startM] = String(therapist.Start_Time || '09:00').split(':').map(Number);
  const [endH,   endM]   = String(therapist.End_Time   || '17:00').split(':').map(Number);

  const slots = [];
  let cur = startH * 60 + startM;
  const end = endH * 60 + endM;
  while (cur + duration <= end) {
    slots.push(String(Math.floor(cur / 60)).padStart(2,'0') + ':' + String(cur % 60).padStart(2,'0'));
    cur += duration;
  }

  const exceptions = sheetToObjects(getSheet('Availability'))
    .filter(ex => ex.Therapist_ID === therapistId && toDateStr(ex.Date) === dateStr && ex.Type === 'Blocked');

  return slots.filter(slot => !exceptions.some(ex => {
    if (!ex.Time_Start) return true;
    const slotMin    = parseInt(slot.split(':')[0]) * 60 + parseInt(slot.split(':')[1]);
    const blockStart = parseInt(ex.Time_Start.split(':')[0]) * 60 + parseInt(ex.Time_Start.split(':')[1]);
    const blockEnd   = parseInt(ex.Time_End.split(':')[0])   * 60 + parseInt(ex.Time_End.split(':')[1]);
    return slotMin >= blockStart && slotMin < blockEnd;
  }));
}

// ---------------------------------------------------------------------------
// GET — Dashboard
// ---------------------------------------------------------------------------

function getDashboardData_(month, year) {
  const allBookings = sheetToObjects(getSheet('Bookings'));
  const todayStr    = today_();
  const allExpenses = sheetToObjects(getSheet('Expenses'));
  const settings    = getSettings_();

  const monthBookings = allBookings.filter(b => {
    const my = monthYear(b.Session_Date);
    return my.m === month && my.y === year && b.Status !== 'Cancelled';
  });

  const todayBookings = allBookings.filter(b => toDateStr(b.Session_Date) === todayStr && b.Status !== 'Cancelled');

  const sessionCount  = monthBookings.length;
  const totalRevenue  = monthBookings.reduce((s, b) => s + Number(b.Revenue_Center || 0), 0);
  const pendingCount  = allBookings.filter(b => b.Status === 'Pending').length;
  const todaySessions = todayBookings.length;
  const todayRevenue  = todayBookings.reduce((s, b) => s + Number(b.Revenue_Center || 0), 0);
  const totalExpenses = allExpenses
    .filter(e => { const my = monthYear(e.Date); return my.m === month && my.y === year; })
    .reduce((s, e) => s + Number(e.Actual_EGP || 0), 0);
  const overallRevenue  = allBookings.filter(b => b.Status !== 'Cancelled')
    .reduce((s, b) => s + Number(b.Revenue_Center || 0), 0);
  const overallExpenses = allExpenses.reduce((s, e) => s + Number(e.Actual_EGP || 0), 0);
  const overallProfit   = overallRevenue - overallExpenses;

  const recentBookings = allBookings.filter(b => b.Status === 'Pending')
    .sort((a, b_) => new Date(b_.Submitted_At) - new Date(a.Submitted_At)).slice(0, 5);

  const recentActivity = [...allBookings]
    .sort((a, b_) => new Date(b_.Submitted_At) - new Date(a.Submitted_At)).slice(0, 5)
    .map(b => ({
      icon: b.Status === 'Confirmed' ? '✅' : b.Status === 'Pending' ? '🕐' : '📋',
      description: b.Client_Name + ' — ' + b.Session_Type,
      timeAgo: toDateStr(b.Submitted_At),
    }));

  const monthlyChart = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i, y = year;
    if (m <= 0) { m += 12; y--; }
    const label = Utilities.formatDate(new Date(y, m - 1, 1), TZ, 'MMM');
    const rev = allBookings
      .filter(b => { const my = monthYear(b.Session_Date); return my.m === m && my.y === y && b.Status !== 'Cancelled'; })
      .reduce((s, b) => s + Number(b.Revenue_Center || 0), 0);
    const exp = allExpenses
      .filter(e => { const my = monthYear(e.Date); return my.m === m && my.y === y; })
      .reduce((s, e) => s + Number(e.Actual_EGP || 0), 0);
    monthlyChart.push({ month: label, revenue: rev, expenses: exp });
  }

  return {
    sessionCount, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses,
    pendingCount, todaySessions, todayRevenue,
    overallRevenue, overallExpenses, overallProfit,
    recentBookings, recentActivity, monthlyChart,
    lastBackupDate: settings.LAST_BACKUP_DATE || '',
  };
}

// ---------------------------------------------------------------------------
// GET — Sessions
// ---------------------------------------------------------------------------

function getSessions_(month, year, therapistId, status) {
  return sheetToObjects(getSheet('Bookings')).filter(b => {
    const my = monthYear(b.Session_Date);
    if (my.m !== month || my.y !== year) return false;
    if (therapistId && b.Therapist_ID !== therapistId) return false;
    if (status     && b.Status        !== status)      return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// GET — Transactions (running balance computed here, never stored)
// ---------------------------------------------------------------------------

function getTransactions_(month, year) {
  const rows = sheetToObjects(getSheet('Transactions'))
    .filter(r => { const my = monthYear(r.Date); return my.m === month && my.y === year; })
    .sort((a, b) => new Date(a.Date) - new Date(b.Date));

  let balance = 0;
  rows.forEach(r => {
    balance += Number(r.Cash_In || 0) - Number(r.Cash_Out || 0);
    r.Balance = balance;
  });

  return { rows, balance };
}

// ---------------------------------------------------------------------------
// GET — Expenses
// ---------------------------------------------------------------------------

function getExpenses_(month, year) {
  const monthStr = year + '-' + String(month).padStart(2, '0');
  return sheetToObjects(getSheet('Expenses')).filter(e =>
    String(e.Month || '').startsWith(monthStr) ||
    (() => { const my = monthYear(e.Date); return my.m === month && my.y === year; })()
  );
}

// ---------------------------------------------------------------------------
// GET — Payouts
// ---------------------------------------------------------------------------

function getPayouts_(month, year) {
  const bookings      = getSessions_(month, year, null, null).filter(b => b.Status !== 'Cancelled');
  const therapists    = sheetToObjects(getSheet('Therapists')).filter(t => t.Active);
  const payoutHistory = sheetToObjects(getSheet('Payout_History'));

  return therapists.map(th => {
    const sessions    = bookings.filter(b => b.Therapist_ID === th.Therapist_ID);
    const totalEarned = sessions.reduce((s, b) => s + Number(b.Revenue_Therapist || 0), 0);
    const totalPaid   = payoutHistory
      .filter(p => p.Therapist_ID === th.Therapist_ID && Number(p.Month) === month && Number(p.Year) === year)
      .reduce((s, p) => s + Number(p.Amount || 0), 0);
    return {
      therapistId:     th.Therapist_ID,
      therapistName:   th.Name_EN,
      revenueSharePct: Number(th.Revenue_Share_Pct || 70),
      totalEarned,
      totalPaid,
      pending: Math.max(0, totalEarned - totalPaid),
      sessions,
    };
  }).filter(p => p.sessions.length > 0 || p.totalPaid > 0);
}

// ---------------------------------------------------------------------------
// GET — Expense Categories (from Expense_Categories tab)
// ---------------------------------------------------------------------------

function getExpenseCategories_() {
  const sheet = getSheet('Expense_Categories');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

// ---------------------------------------------------------------------------
// GET — Settings (excludes password hash)
// ---------------------------------------------------------------------------

function getSettings_() {
  const sheet = getSheet('Settings');
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const result = {};
  data.forEach(row => {
    if (row[0] && row[0] !== 'ADMIN_PASSWORD_HASH') result[row[0]] = row[1];
  });
  return result;
}

function getSettingValue_(key) {
  const data = getSheet('Settings').getDataRange().getValues();
  const row  = data.find(r => r[0] === key);
  return row ? row[1] : '';
}

// ---------------------------------------------------------------------------
// GET — Backup
// ---------------------------------------------------------------------------

function backup_() {
  return {
    exportedAt:   now_(),
    transactions: sheetToObjects(getSheet('Transactions')),
    expenses:     sheetToObjects(getSheet('Expenses')),
    bookings:     sheetToObjects(getSheet('Bookings')).filter(b => b.Status === 'Completed'),
    payouts:      sheetToObjects(getSheet('Payout_History') || null) || [],
  };
}

// ---------------------------------------------------------------------------
// POST — Submit Booking
// ---------------------------------------------------------------------------

function submitBooking_(body) {
  if (findByIdempotencyKey('Bookings', body.idempotencyKey)) return { bookingId: 'DUPLICATE' };

  const therapist = sheetToObjects(getSheet('Therapists')).find(t => t.Therapist_ID === body.therapistId && t.Active);
  if (!therapist) throw new Error('Therapist not available');

  const feeKey = 'Fee_' + (body.sessionType || 'Individual');
  const fee    = Number(therapist[feeKey] || therapist.Fee_Individual || 0);
  const share  = Number(therapist.Revenue_Share_Pct || 70) / 100;
  const revTh  = Math.round(fee * share);
  const revCt  = fee - revTh;

  const year      = new Date().getFullYear();
  const bookingId = nextId('Bookings', 'B', year);

  const clients = sheetToObjects(getSheet('Clients'));
  let client    = clients.find(c => c.Phone === body.clientPhone);
  if (!client) {
    const clientId = nextClientId();
    getSheet('Clients').appendRow([
      clientId, body.clientName, body.clientPhone, body.clientEmail || '',
      body.sessionDate, body.therapistId, 0, 'Active', '', now_()
    ]);
    client = { Client_ID: clientId };
  }

  getSheet('Bookings').appendRow([
    bookingId, now_(), body.sessionDate, body.sessionTime,
    therapist.Therapist_ID, therapist.Name_EN,
    client.Client_ID, body.clientName, body.clientPhone, body.clientEmail || '',
    body.sessionType || 'Individual', body.sessionMode || 'In-person',
    fee, revTh, revCt, 'Pending', 'Unpaid', '', '', false, '', body.idempotencyKey, body.notes || ''
  ]);

  emailAdmin_(bookingId, body, therapist);
  return { bookingId };
}

// ---------------------------------------------------------------------------
// POST — Confirm / Cancel Booking
// ---------------------------------------------------------------------------

function confirmBooking_(bookingId) {
  updateBookingColumn_(bookingId, 'Status',       'Confirmed');
  updateBookingColumn_(bookingId, 'Confirmed_At', now_());
  const booking = sheetToObjects(getSheet('Bookings')).find(b => b.Booking_ID === bookingId);
  if (booking && booking.Client_Email) emailClient_('confirmed', booking);
  return { bookingId };
}

function cancelBooking_(bookingId, reason) {
  updateBookingColumn_(bookingId, 'Status', 'Cancelled');
  updateBookingColumn_(bookingId, 'Notes',  reason || '');
  return { bookingId };
}

function updateBookingColumn_(bookingId, colName, value) {
  const sheet   = getSheet('Bookings');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Booking_ID');
  const valCol  = headers.indexOf(colName);
  if (valCol === -1) return;
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === bookingId) {
      sheet.getRange(i + 1, valCol + 1).setValue(value);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// POST — Mark Paid
// ---------------------------------------------------------------------------

function markPaid_(bookingId, method) {
  updateBookingColumn_(bookingId, 'Payment_Status', 'Paid');
  updateBookingColumn_(bookingId, 'Payment_Method', method || 'Cash');
  return { bookingId };
}

// ---------------------------------------------------------------------------
// POST — Add Transaction
// ---------------------------------------------------------------------------

function addTransaction_(body) {
  if (findByIdempotencyKey('Transactions', body.idempotencyKey)) return { skipped: true };
  const year = new Date(body.date || today_()).getFullYear();
  const id   = nextId('Transactions', 'TXN', year);
  getSheet('Transactions').appendRow([
    id, body.date, body.description, body.category, body.subCategory || '',
    body.cashIn || '', body.cashOut || '', '',
    body.method || 'Cash', body.bookingId || '', body.idempotencyKey, body.notes || '', now_()
  ]);
  return { transactionId: id };
}

// ---------------------------------------------------------------------------
// POST — Add Expense
// ---------------------------------------------------------------------------

function addExpense_(body) {
  if (findByIdempotencyKey('Expenses', body.idempotencyKey)) return { skipped: true };
  const date  = body.date || today_();
  const d     = new Date(date);
  const month = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const id    = nextId('Expenses', 'EXP', year);
  const actual   = Number(body.actualEGP   || 0);
  const expected = Number(body.expectedEGP || 0);
  getSheet('Expenses').appendRow([
    id, date, month, body.category, body.subCategory || '', body.item,
    expected, actual, actual - expected,
    body.paidBy || 'Cash', body.idempotencyKey, body.notes || ''
  ]);
  return { expenseId: id };
}

// ---------------------------------------------------------------------------
// POST — Edit Expense
// ---------------------------------------------------------------------------

function editExpense_(body) {
  const sheet   = getSheet('Expenses');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Expense_ID');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.expenseId) {
      const date     = body.date || toDateStr(data[i][headers.indexOf('Date')]);
      const d        = new Date(date);
      const month    = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const actual   = Number(body.actualEGP   || 0);
      const expected = Number(body.expectedEGP || actual);
      const updates  = {
        Date: date, Month: month,
        Category: body.category, Sub_Category: body.subCategory || '', Item: body.item,
        Expected_EGP: expected, Actual_EGP: actual,
        Variance: actual - expected,
        Paid_By: body.paidBy, Notes: body.notes || '',
      };
      Object.entries(updates).forEach(([col, val]) => {
        const j = headers.indexOf(col);
        if (j >= 0) sheet.getRange(i + 1, j + 1).setValue(val);
      });
      return { expenseId: body.expenseId };
    }
  }
  throw new Error('Expense not found');
}

// ---------------------------------------------------------------------------
// POST — Delete Expense
// ---------------------------------------------------------------------------

function deleteExpense_(body) {
  const sheet   = getSheet('Expenses');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Expense_ID');
  const iKeyCol = headers.indexOf('Idempotency_Key');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.expenseId) {
      const expenseIKey = iKeyCol >= 0 ? data[i][iKeyCol] : null;
      sheet.deleteRow(i + 1);
      if (expenseIKey) {
        const txnSheet   = getSheet('Transactions');
        const txnData    = txnSheet.getDataRange().getValues();
        const txnHeaders = txnData[0];
        const txnIKeyCol = txnHeaders.indexOf('Idempotency_Key');
        const linkedKey  = 'txn-exp-' + expenseIKey;
        for (let j = txnData.length - 1; j >= 1; j--) {
          if (txnData[j][txnIKeyCol] === linkedKey) {
            txnSheet.deleteRow(j + 1);
            break;
          }
        }
      }
      return { deleted: true };
    }
  }
  throw new Error('Expense not found');
}

// ---------------------------------------------------------------------------
// POST — Save Expense Categories (replaces all rows in Expense_Categories tab)
// ---------------------------------------------------------------------------

function saveExpenseCategories_(body) {
  const sheet = getSheet('Expense_Categories');
  if (!sheet) throw new Error('Expense_Categories sheet not found');
  const rows = body.rows || [];
  if (sheet.getLastRow() > 1) sheet.deleteRows(2, sheet.getLastRow() - 1);
  rows.forEach(r => sheet.appendRow([r.Category || '', r.Subcategory || '']));
  return { saved: rows.length };
}

// ---------------------------------------------------------------------------
// POST — Add Client (manual entry)
// ---------------------------------------------------------------------------

function addClient_(body) {
  const sheet   = getSheet('Clients');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existing = sheet.getLastRow() < 2 ? [] :
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
      .filter(v => String(v).startsWith('C-'))
      .map(v => parseInt(String(v).slice(2)) || 0);
  const id = 'C-' + String((existing.length ? Math.max(...existing) : 0) + 1).padStart(3, '0');
  const row = headers.map(h => {
    if (h === 'Client_ID')      return id;
    if (h === 'Name')           return body.name || '';
    if (h === 'Phone')          return body.phone || '';
    if (h === 'Email')          return body.email || '';
    if (h === 'Status')         return body.status || 'Active';
    if (h === 'Notes')          return body.notes || '';
    if (h === 'Total_Sessions') return 0;
    if (h === 'Added_At')       return now_();
    return '';
  });
  sheet.appendRow(row);
  return { clientId: id };
}

// ---------------------------------------------------------------------------
// POST — Update Client
// ---------------------------------------------------------------------------

function updateClient_(body) {
  if (!body.Client_ID) throw new Error('Client_ID required');

  var sheet   = getSheet('Clients');
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol   = headers.indexOf('Client_ID');

  var nameIdx   = headers.indexOf('Name');
  var phoneIdx  = headers.indexOf('Phone');
  var emailIdx  = headers.indexOf('Email');
  var statusIdx = headers.indexOf('Status');
  var notesIdx  = headers.indexOf('Notes');

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) !== String(body.Client_ID)) continue;

    var row = data[i].slice();
    if (nameIdx   >= 0 && body.Name   !== undefined) row[nameIdx]   = body.Name   || '';
    if (phoneIdx  >= 0 && body.Phone  !== undefined) row[phoneIdx]  = body.Phone  || '';
    if (emailIdx  >= 0 && body.Email  !== undefined) row[emailIdx]  = body.Email  || '';
    if (statusIdx >= 0 && body.Status !== undefined) row[statusIdx] = body.Status || '';
    if (notesIdx  >= 0 && body.Notes  !== undefined) row[notesIdx]  = body.Notes  || '';

    sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
    return { clientId: body.Client_ID };
  }
  throw new Error('Client not found: ' + body.Client_ID);
}

// ---------------------------------------------------------------------------
// POST — Add Therapist
// ---------------------------------------------------------------------------

function addTherapist_(body) {
  const sheet   = getSheet('Therapists');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const existing = sheet.getLastRow() < 2 ? [] :
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat()
      .filter(v => String(v).startsWith('T-'))
      .map(v => parseInt(String(v).slice(2)) || 0);
  const id = 'T-' + String((existing.length ? Math.max(...existing) : 0) + 1).padStart(3, '0');
  const row = headers.map(h => {
    if (h === 'Therapist_ID') return id;
    if (h === 'Joined_Date')  return today_();
    if (h === 'Active')       return body.Active !== false;
    return body[h] !== undefined ? body[h] : '';
  });
  sheet.appendRow(row);
  return { therapistId: id };
}

// ---------------------------------------------------------------------------
// POST — Update Therapist
// ---------------------------------------------------------------------------

function updateTherapist_(body) {
  const sheet   = getSheet('Therapists');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Therapist_ID');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.Therapist_ID) {
      headers.forEach((h, j) => {
        if (h !== 'Therapist_ID' && body[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(body[h]);
        }
      });
      break;
    }
  }
  return { therapistId: body.Therapist_ID };
}

// ---------------------------------------------------------------------------
// POST — Edit Booking (admin)
// ---------------------------------------------------------------------------

function editBooking_(body) {
  const sheet   = getSheet('Bookings');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Booking_ID');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === body.Booking_ID) {
      const oldTherapistId = data[i][headers.indexOf('Therapist_ID')];
      const newTherapistId = body.Therapist_ID || oldTherapistId;
      const oldSessionType = data[i][headers.indexOf('Session_Type')];
      const newSessionType = body.Session_Type || oldSessionType;

      if (newTherapistId !== oldTherapistId || newSessionType !== oldSessionType) {
        const th = sheetToObjects(getSheet('Therapists')).find(t => t.Therapist_ID === newTherapistId);
        if (th) {
          const fee   = Number(th['Fee_' + newSessionType] || th.Fee_Individual || 0);
          const share = Number(th.Revenue_Share_Pct || 70) / 100;
          const revTh = Math.round(fee * share);
          const revCt = fee - revTh;
          const feeMap = { Therapist_ID: th.Therapist_ID, Therapist_Name: th.Name_EN,
                           Fee: fee, Revenue_Therapist: revTh, Revenue_Center: revCt };
          Object.entries(feeMap).forEach(([col, val]) => {
            const j = headers.indexOf(col);
            if (j >= 0) sheet.getRange(i + 1, j + 1).setValue(val);
          });
        }
      }

      ['Client_Name','Client_Phone','Client_Email',
       'Session_Date','Session_Time','Session_Type','Session_Mode','Video_Link',
       'Status','Payment_Status','Payment_Method','Notes'].forEach(col => {
        if (body[col] !== undefined) {
          const j = headers.indexOf(col);
          if (j >= 0) sheet.getRange(i + 1, j + 1).setValue(body[col]);
        }
      });

      return { bookingId: body.Booking_ID };
    }
  }
  throw new Error('Booking not found');
}

// ---------------------------------------------------------------------------
// POST — Delete Booking (admin)
// ---------------------------------------------------------------------------

function deleteBooking_(bookingId) {
  const sheet   = getSheet('Bookings');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol   = headers.indexOf('Booking_ID');
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === bookingId) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  throw new Error('Booking not found');
}

// ---------------------------------------------------------------------------
// POST — Delete Transaction by Booking ID
// ---------------------------------------------------------------------------

function deleteTransactionByBookingId_(bookingId) {
  const sheet = getSheet('Transactions');
  if (!sheet || !bookingId) return { deleted: false };
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const bidCol  = headers.indexOf('Booking_ID');
  if (bidCol === -1) return { deleted: false };
  let deleted = false;
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][bidCol] === bookingId) {
      sheet.deleteRow(i + 1);
      deleted = true;
    }
  }
  return { deleted };
}

// ---------------------------------------------------------------------------
// POST — Add Booking (admin)
// ---------------------------------------------------------------------------

function addBookingAdmin_(body) {
  if (findByIdempotencyKey('Bookings', body.idempotencyKey)) return { bookingId: 'DUPLICATE' };

  const therapist = sheetToObjects(getSheet('Therapists')).find(t => t.Therapist_ID === body.Therapist_ID);
  if (!therapist) throw new Error('Therapist not found');

  const feeKey = 'Fee_' + (body.Session_Type || 'Individual');
  const fee    = Number(therapist[feeKey] || therapist.Fee_Individual || 0);
  const share  = Number(therapist.Revenue_Share_Pct || 70) / 100;
  const revTh  = Math.round(fee * share);
  const revCt  = fee - revTh;

  const year      = new Date().getFullYear();
  const bookingId = nextId('Bookings', 'B', year);

  const clients = sheetToObjects(getSheet('Clients'));
  let client    = clients.find(c => c.Phone === (body.Client_Phone || ''));
  if (!client) {
    const clientId = nextClientId();
    getSheet('Clients').appendRow([
      clientId, body.Client_Name, body.Client_Phone || '', body.Client_Email || '',
      body.Session_Date, therapist.Therapist_ID, 0, 'Active', '', now_()
    ]);
    client = { Client_ID: clientId };
  }

  const status      = body.Status || 'Confirmed';
  const confirmedAt = status === 'Confirmed' ? now_() : '';

  getSheet('Bookings').appendRow([
    bookingId, now_(), body.Session_Date, body.Session_Time || '',
    therapist.Therapist_ID, therapist.Name_EN,
    client.Client_ID, body.Client_Name, body.Client_Phone || '', body.Client_Email || '',
    body.Session_Type || 'Individual', body.Session_Mode || 'In-person',
    fee, revTh, revCt,
    status, body.Payment_Status || 'Unpaid', body.Payment_Method || '',
    body.Video_Link || '', false, confirmedAt, body.idempotencyKey, body.Notes || ''
  ]);

  return { bookingId };
}

// ---------------------------------------------------------------------------
// POST — Block Date
// ---------------------------------------------------------------------------

function blockDate_(body) {
  const id = 'EX-' + Utilities.getUuid().slice(0, 8);
  getSheet('Availability').appendRow([
    id, body.therapistId, body.date, body.timeStart || '', body.timeEnd || '', 'Blocked', body.reason || ''
  ]);
  return { exceptionId: id };
}

// ---------------------------------------------------------------------------
// POST — Mark Payout Paid
// ---------------------------------------------------------------------------

function markPayoutPaid_(body) {
  let sheet = ss().getSheetByName('Payout_History');
  if (!sheet) {
    sheet = ss().insertSheet('Payout_History');
    sheet.appendRow(['Therapist_ID', 'Therapist_Name', 'Month', 'Year', 'Amount', 'Settled_At']);
  }
  sheet.appendRow([
    body.therapistId, '', body.month, body.year, Number(body.amount || 0), now_()
  ]);
  return { settled: true };
}

// ---------------------------------------------------------------------------
// POST — Update Password
// ---------------------------------------------------------------------------

function updatePassword_(newHash) {
  if (!newHash) throw new Error('Hash required');
  const sheet = getSheet('Settings');
  const data  = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'ADMIN_PASSWORD_HASH') {
      sheet.getRange(i + 1, 2).setValue(newHash);
      return { updated: true };
    }
  }
  sheet.appendRow(['ADMIN_PASSWORD_HASH', newHash]);
  return { updated: true };
}

// ---------------------------------------------------------------------------
// POST — Update Settings (key-value pairs)
// ---------------------------------------------------------------------------

function updateSettings_(settings) {
  if (!settings) return { updated: false };
  const sheet = getSheet('Settings');
  const data  = sheet.getDataRange().getValues();
  Object.entries(settings).forEach(([key, value]) => {
    let found = false;
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([key, value]);
  });
  return { updated: true };
}

// ---------------------------------------------------------------------------
// POST — Verify Login
// ---------------------------------------------------------------------------

function verifyLogin_(username, passwordHash) {
  const settings    = getSheet('Settings');
  const data        = settings.getDataRange().getValues();
  const usernameRow = data.find(r => r[0] === 'ADMIN_USERNAME');
  const hashRow     = data.find(r => r[0] === 'ADMIN_PASSWORD_HASH');
  if (!usernameRow || !hashRow) return { success: false };
  return { success: usernameRow[1] === username && hashRow[1] === passwordHash };
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------

function emailAdmin_(bookingId, body, therapist) {
  const adminEmail = getSettingValue_('ADMIN_EMAIL');
  if (!adminEmail) return;
  const subject = '📅 New booking: ' + bookingId;
  const body_ = `New booking received:\n\nID: ${bookingId}\nClient: ${body.clientName} (${body.clientPhone})\nTherapist: ${therapist.Name_EN}\nDate: ${body.sessionDate} at ${body.sessionTime}\nType: ${body.sessionType}\nMode: ${body.sessionMode}\n\nLog in to the admin panel to confirm.`;
  MailApp.sendEmail(adminEmail, subject, body_);
}

function emailClient_(type, booking) {
  const subject = type === 'confirmed'
    ? 'تأكيد موعدك — Leen Psychotherapy Center'
    : type === 'reminder'
      ? 'تذكير بموعدك — Leen Psychotherapy Center'
      : 'بخصوص موعدك — Leen Psychotherapy Center';
  const body_ = type === 'confirmed'
    ? `تم تأكيد موعدك!\n\nالمعالج: ${booking.Therapist_Name}\nالتاريخ: ${booking.Session_Date}\nالوقت: ${booking.Session_Time}\n\nYour appointment is confirmed.\nTherapist: ${booking.Therapist_Name}\nDate: ${booking.Session_Date} at ${booking.Session_Time}`
    : type === 'reminder'
      ? `تذكير: لديك موعد غداً\n\nالمعالج: ${booking.Therapist_Name}\nالتاريخ: ${booking.Session_Date}\nالوقت: ${booking.Session_Time}\n\nReminder: You have an appointment tomorrow.\nTherapist: ${booking.Therapist_Name}\nDate: ${booking.Session_Date} at ${booking.Session_Time}`
      : `تم إلغاء موعدك.\n\nYour appointment has been cancelled.`;
  MailApp.sendEmail(booking.Client_Email, subject, body_);
}

// ---------------------------------------------------------------------------
// Daily reminder trigger
// Run createDailyReminderTrigger() ONCE manually from the Apps Script editor.
// ---------------------------------------------------------------------------

function createDailyReminderTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'sendDailyReminders')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('sendDailyReminders')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone(TZ)
    .create();

  Logger.log('Daily reminder trigger created: runs at 9 AM Africa/Cairo every day.');
}

function sendDailyReminders() {
  const reminderHours = Number(getSettingValue_('REMINDER_HOURS_BEFORE') || 24);
  const targetDate    = new Date(Date.now() + reminderHours * 60 * 60 * 1000);
  const targetStr     = Utilities.formatDate(targetDate, TZ, 'yyyy-MM-dd');

  const bookings = sheetToObjects(getSheet('Bookings')).filter(b =>
    toDateStr(b.Session_Date) === targetStr &&
    b.Status === 'Confirmed'  &&
    !b.Reminder_Sent          &&
    b.Client_Email
  );

  bookings.forEach(b => {
    try {
      emailClient_('reminder', b);
      updateBookingColumn_(b.Booking_ID, 'Reminder_Sent', true);
    } catch (e) {
      Logger.log('Reminder failed for ' + b.Booking_ID + ': ' + e.message);
    }
  });

  Logger.log('Reminders sent: ' + bookings.length + ' for date ' + targetStr);
}
