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

function makeEnvelope(data) {
  return { success: true, data, error: null };
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
    const raw = await get('getDashboardData', { month, year });
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load dashboard data');
  }
}

// ---------------------------------------------------------------------------
// GET — Sessions
// ---------------------------------------------------------------------------

export async function getSessions(filters = {}) {
  const { month, year, therapistId, status } = filters;
  const params = { month, year };
  if (therapistId) params.therapistId = therapistId;
  if (status) params.status = status;

  try {
    const raw = await get('getSessions', params);
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load sessions');
  }
}

// ---------------------------------------------------------------------------
// GET — Transactions
// ---------------------------------------------------------------------------

export async function getTransactions(month, year) {
  try {
    const raw = await get('getTransactions', { month, year });
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load transactions');
  }
}

// ---------------------------------------------------------------------------
// GET — Expenses
// ---------------------------------------------------------------------------

export async function getExpenses(month, year) {
  try {
    const raw = await get('getExpenses', { month, year });
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load expenses');
  }
}

// ---------------------------------------------------------------------------
// GET — Payouts
// ---------------------------------------------------------------------------

export async function getPayouts(month, year) {
  try {
    const raw = await get('getPayouts', { month, year });
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load payouts');
  }
}

// ---------------------------------------------------------------------------
// GET — Clients
// ---------------------------------------------------------------------------

export async function getClients() {
  try {
    const raw = await get('getClients');
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load clients');
  }
}

// ---------------------------------------------------------------------------
// GET — Therapists (full admin view, includes inactive)
// ---------------------------------------------------------------------------

export async function getTherapistsFull() {
  try {
    const raw = await get('getTherapistsFull');
    return makeEnvelope(raw);
  } catch {
    return errorEnvelope('Failed to load therapists');
  }
}

// ---------------------------------------------------------------------------
// GET — Backup
// ---------------------------------------------------------------------------

export async function backup() {
  try {
    const raw = await get('backup');
    return makeEnvelope(raw);
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

// ---------------------------------------------------------------------------
// POST — Financial writes
// ---------------------------------------------------------------------------

export async function addTransaction(transactionData) {
  return post('addTransaction', transactionData);
}

export async function addExpense(expenseData) {
  return post('addExpense', expenseData);
}

// ---------------------------------------------------------------------------
// POST — Therapist management
// ---------------------------------------------------------------------------

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
