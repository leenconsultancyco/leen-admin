import { APPS_SCRIPT_URL, ORIGIN } from './config';
import { getIsOnline } from './hooks/useOnlineStatus';
import { enqueueRequest } from './offlineQueue';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function get(action, params = {}) {
  const query = new URLSearchParams({ action, origin: ORIGIN, ...params });
  const res = await fetch(`${APPS_SCRIPT_URL}?${query}`);
  return res.json();
}

function errorEnvelope(message) {
  return { success: false, data: null, error: message, cached: true };
}

// rawPost — used by syncQueue only. Throws on failure so syncQueue can track retries.
export async function rawPost(action, data) {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action, origin: ORIGIN, ...data }),
  });
  return res.json();
}

async function post(action, rawData) {
  const data = {
    ...rawData,
    idempotencyKey: rawData.idempotencyKey || crypto.randomUUID(),
  };

  if (!getIsOnline()) {
    enqueueRequest(action, data);
    return { success: true, queued: true, data: null, error: null };
  }

  try {
    return await rawPost(action, data);
  } catch {
    enqueueRequest(action, data);
    return { success: true, queued: true, data: null, error: null };
  }
}

// ---------------------------------------------------------------------------
// GET — Dashboard
// ---------------------------------------------------------------------------

export async function getDashboardData(month, year) {
  try {
    return await get('getDashboardData', { month, year });
  } catch {
    return errorEnvelope('Failed to load dashboard data');
  }
}

// ---------------------------------------------------------------------------
// GET — Sessions
// ---------------------------------------------------------------------------

export async function getAvailableSlots(therapistId, date) {
  try {
    return await get('getAvailableSlots', { therapistId, date });
  } catch {
    return errorEnvelope('Failed to load available slots');
  }
}

export async function getSessions(filters = {}) {
  const { month, year, therapistId, status } = filters;
  const params = { month, year };
  if (therapistId) params.therapistId = therapistId;
  if (status) params.status = status;

  try {
    return await get('getSessions', params);
  } catch {
    return errorEnvelope('Failed to load sessions');
  }
}

// ---------------------------------------------------------------------------
// GET — Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(month, year) {
  try {
    return await get('getTransactions', { month, year });
  } catch {
    return errorEnvelope('Failed to load transactions');
  }
}

// ---------------------------------------------------------------------------
// GET — Expenses
// ---------------------------------------------------------------------------

export async function getExpenses(month, year) {
  try {
    return await get('getExpenses', { month, year });
  } catch {
    return errorEnvelope('Failed to load expenses');
  }
}

export async function getExpenseCategories() {
  try {
    return await get('getExpenseCategories');
  } catch {
    return errorEnvelope('Failed to load expense categories');
  }
}

// ---------------------------------------------------------------------------
// GET — Payouts
// ---------------------------------------------------------------------------

export async function getPayouts(month, year) {
  try {
    return await get('getPayouts', { month, year });
  } catch {
    return errorEnvelope('Failed to load payouts');
  }
}

// ---------------------------------------------------------------------------
// GET — Clients
// ---------------------------------------------------------------------------

export async function getClients() {
  try {
    return await get('getClients');
  } catch {
    return errorEnvelope('Failed to load clients');
  }
}

export async function addClient(clientData) {
  return post('addClient', clientData);
}

// ---------------------------------------------------------------------------
// GET — Therapists (full admin view, includes inactive)
// ---------------------------------------------------------------------------

export async function getTherapistsFull() {
  try {
    return await get('getTherapistsFull');
  } catch {
    return errorEnvelope('Failed to load therapists');
  }
}

// ---------------------------------------------------------------------------
// GET — Backup
// ---------------------------------------------------------------------------

export async function backup() {
  try {
    return await get('backup');
  } catch {
    return errorEnvelope('Failed to generate backup');
  }
}

// ---------------------------------------------------------------------------
// POST — Booking actions
// ---------------------------------------------------------------------------

export async function confirmBooking(bookingId) {
  return post('confirmBooking', { bookingId });
}

export async function cancelBooking(bookingId, reason = '') {
  return post('cancelBooking', { bookingId, reason });
}

export async function markPaid(bookingId, paymentMethod) {
  return post('markPaid', { bookingId, paymentMethod });
}

export async function editBooking(bookingData) {
  return post('editBooking', bookingData);
}

export async function deleteBooking(bookingId) {
  return post('deleteBooking', { bookingId });
}

export async function deleteTransactionByBookingId(bookingId) {
  return post('deleteTransactionByBookingId', { bookingId });
}

export async function addBookingAdmin(bookingData) {
  return post('addBookingAdmin', bookingData);
}

// ---------------------------------------------------------------------------
// POST — Financial writes
// ---------------------------------------------------------------------------

export async function addTransaction(transactionData) {
  return post('addTransaction', transactionData);
}

export async function addExpense(expenseData) {
  return post('addExpense', expenseData);
}

export async function editExpense(expenseData) {
  return post('editExpense', expenseData);
}

export async function deleteExpense(expenseId) {
  return post('deleteExpense', { expenseId });
}

// ---------------------------------------------------------------------------
// POST — Therapist management
// ---------------------------------------------------------------------------

export async function addTherapist(therapistData) {
  return post('addTherapist', therapistData);
}

export async function updateTherapist(therapistData) {
  return post('updateTherapist', therapistData);
}

export async function blockDate(therapistId, date, timeStart, timeEnd, reason) {
  return post('blockDate', { therapistId, date, timeStart, timeEnd, reason });
}

// ---------------------------------------------------------------------------
// POST — Payouts
// ---------------------------------------------------------------------------

export async function markPayoutPaid(therapistId, month, year, amount) {
  return post('markPayoutPaid', { therapistId, month, year, amount });
}

// ---------------------------------------------------------------------------
// POST — Settings
// ---------------------------------------------------------------------------

export async function updatePassword(newHash) {
  return post('updatePassword', { newHash });
}

export async function updateSettings(settings) {
  return post('updateSettings', { settings });
}
