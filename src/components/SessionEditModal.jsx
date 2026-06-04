import { useState, useEffect, useMemo, useRef } from 'react';
import { Button, Modal, Spinner, Tabs } from '@heroui/react';
import { addBookingAdmin, editBooking, getAvailableSlots, addTransaction, deleteTransactionByBookingId } from '../api';
import { toast } from './Toast';

function to12h(t) {
  if (!t) return t;
  const [h, m] = String(t).split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const TYPES       = ['Individual', 'Couples', 'Family', 'Group', 'Workshop'];
const MODES       = ['In-person', 'Online'];
const STATUSES    = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const PAYMENTS    = ['Unpaid', 'Paid', 'Waived'];
const PAY_METHODS = ['Cash', 'Bank transfer'];
const TODAY       = new Date().toISOString().slice(0, 10);

const F   = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL   = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };
const PANEL = { minHeight: '340px', maxHeight: '380px', overflowY: 'auto', paddingTop: '12px' };

function Field({ label, children }) {
  return <div>{label && <label style={LBL}>{label}</label>}{children}</div>;
}

function TypePill({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} style={{
      padding: '4px 14px', borderRadius: '9999px', fontSize: '12px',
      border: `2px solid ${checked ? '#0E9B73' : '#d1d5db'}`,
      backgroundColor: checked ? '#0E9B73' : '#ffffff',
      color: checked ? '#ffffff' : '#4b5563',
      cursor: 'pointer', fontWeight: checked ? '600' : '400', transition: 'all 0.15s',
    }}>
      {label}
    </button>
  );
}

function SlotPicker({ therapistId, date, sessions, bookingId, value, onChange }) {
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const bookedTimes = useMemo(() => {
    if (!sessions || !therapistId || !date) return new Set();
    return new Set(
      sessions
        .filter((s) =>
          s.Therapist_ID === therapistId &&
          String(s.Session_Date).substring(0, 10) === date &&
          s.Status !== 'Cancelled' &&
          (!bookingId || s.Booking_ID !== bookingId)
        )
        .map((s) => s.Session_Time)
    );
  }, [sessions, therapistId, date, bookingId]);

  useEffect(() => {
    if (!therapistId || !date) { setSlots([]); setError(''); return; }
    let cancelled = false;
    setLoading(true);
    setError('');
    getAvailableSlots(therapistId, date).then((r) => {
      if (cancelled) return;
      setLoading(false);
      if (r.success && Array.isArray(r.data) && r.data.length > 0) {
        setSlots(r.data);
      } else {
        setSlots([]);
        setError('No slots found — enter time manually');
      }
    });
    return () => { cancelled = true; };
  }, [therapistId, date]);

  if (!therapistId || !date) return null;

  return (
    <div style={{ marginBottom: '8px' }}>
      <p style={LBL}>Available Slots</p>
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '12px', padding: '4px 0 8px' }}>
          <Spinner size="sm" /> Loading slots…
        </div>
      ) : error ? (
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>{error}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {slots.map((slot) => {
            const isBooked   = bookedTimes.has(slot);
            const isSelected = value === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => onChange(slot)}
                title={isBooked ? 'Already booked' : to12h(slot)}
                style={{
                  padding: '3px 10px', borderRadius: '6px', fontSize: '12px',
                  border: `1.5px solid ${isSelected ? '#0E9B73' : isBooked ? '#e5e7eb' : '#d1d5db'}`,
                  backgroundColor: isSelected ? '#0E9B73' : isBooked ? '#f9fafb' : '#fff',
                  color: isSelected ? '#fff' : isBooked ? '#c4c4c4' : '#374151',
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  textDecoration: isBooked ? 'line-through' : 'none',
                  transition: 'all 0.12s',
                }}
              >
                {to12h(slot)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Resolves the fee for a therapist + session type from the therapists list.
function resolveFee(therapists, therapistId, sessionType, fallback) {
  const th = (therapists || []).find((t) => t.Therapist_ID === therapistId);
  return th ? Number(th[`Fee_${sessionType}`] || th.Fee_Individual || 0) : Number(fallback || 0);
}

// Called after a successful editBooking to keep Cash Flow in sync.
// Four cases based on before/after Payment_Status and fee-affecting field changes.
async function syncCashFlowTransaction(original, form, therapists) {
  const wasPaid      = original.Payment_Status === 'Paid';
  const isPaid       = form.Payment_Status     === 'Paid';
  const feeChanged   = original.Therapist_ID !== form.Therapist_ID ||
                       original.Session_Type  !== form.Session_Type;
  const bookingId    = form.Booking_ID;
  const th           = (therapists || []).find((t) => t.Therapist_ID === form.Therapist_ID);
  const therapistName = th?.Name_EN || original.Therapist_Name || '';

  function txnPayload(fee) {
    return {
      date:           form.Session_Date,
      description:    `Session — ${form.Client_Name} with ${therapistName}`,
      category:       'Revenue',
      cashIn:         fee,
      method:         form.Payment_Method,
      bookingId,
      idempotencyKey: `txn-paid-${bookingId}`,
    };
  }

  if (wasPaid && !isPaid) {
    // Admin un-marked payment → remove Cash In from Cash Flow
    await deleteTransactionByBookingId(bookingId);
  } else if (wasPaid && isPaid && feeChanged) {
    // Fee likely changed → delete old entry and recreate with recalculated fee.
    // After deletion the idempotency key is gone from the sheet, so the same
    // key can be reused safely for the new row.
    const fee = resolveFee(therapists, form.Therapist_ID, form.Session_Type, original.Fee);
    await deleteTransactionByBookingId(bookingId);
    await addTransaction(txnPayload(fee));
  } else if (!wasPaid && isPaid) {
    // Admin marked as Paid via edit modal (not the "Mark Paid" action button)
    const fee = resolveFee(therapists, form.Therapist_ID, form.Session_Type, original.Fee);
    await addTransaction(txnPayload(fee));
  }
}

function ClientAutocomplete({ value, onChange, onSelect, clients }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const suggestions = useMemo(() => {
    if (!Array.isArray(clients)) return [];
    if (!value.trim()) return clients.slice(0, 20);
    const q = value.toLowerCase();
    return clients.filter((c) =>
      (c.Name || '').toLowerCase().includes(q) ||
      (c.Phone || '').includes(q)
    ).slice(0, 10);
  }, [value, clients]);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasClients = Array.isArray(clients) && clients.length > 0;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        style={F}
        autoComplete="off"
        placeholder="Search by name or phone…"
      />
      {open && hasClients && (
        <div style={{
          position: 'absolute', top: 'calc(100% - 8px)', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '2px solid #9ca3af', borderTop: 'none',
          borderRadius: '0 0 8px 8px', maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,.08)',
        }}>
          {suggestions.length === 0 ? (
            <p style={{ padding: '10px 14px', fontSize: 13, color: '#9ca3af', margin: 0 }}>
              No registered clients match
            </p>
          ) : (
            suggestions.map((c) => (
              <button
                key={c.Client_ID}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(c); setOpen(false); }}
                style={{
                  display: 'flex', flexDirection: 'column', width: '100%', textAlign: 'left',
                  padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.Name}</span>
                {c.Phone && <span style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{c.Phone}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function initForm(booking, isNew) {
  if (isNew) {
    return {
      Therapist_ID: '', Session_Date: TODAY, Session_Time: '09:00',
      Session_Type: 'Individual', Session_Mode: 'In-person', Video_Link: '',
      Client_Name: '', Client_Phone: '', Client_Email: '',
      Status: 'Confirmed', Payment_Status: 'Unpaid', Payment_Method: 'Cash', Notes: '',
    };
  }
  return {
    Booking_ID:     booking.Booking_ID     || '',
    Therapist_ID:   booking.Therapist_ID   || '',
    Session_Date:   String(booking.Session_Date   || TODAY).substring(0, 10),
    Session_Time:   booking.Session_Time   || '',
    Session_Type:   booking.Session_Type   || 'Individual',
    Session_Mode:   booking.Session_Mode   || 'In-person',
    Video_Link:     booking.Video_Link     || '',
    Client_Name:    booking.Client_Name    || '',
    Client_Phone:   booking.Client_Phone   || '',
    Client_Email:   booking.Client_Email   || '',
    Status:         booking.Status         || 'Confirmed',
    Payment_Status: booking.Payment_Status || 'Unpaid',
    Payment_Method: booking.Payment_Method || 'Cash',
    Notes:          booking.Notes          || '',
  };
}

export default function SessionEditModal({ booking, isNew, isOpen, onClose, onSuccess, therapists, sessions, clients }) {
  const [form, setForm]           = useState(() => initForm(booking, isNew));
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { setForm(initForm(booking, isNew)); setSaveError(''); }, [booking, isNew, isOpen]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.Client_Name || !form.Therapist_ID || !form.Session_Date) return;
    setSaving(true);
    setSaveError('');
    const res = isNew ? await addBookingAdmin(form) : await editBooking(form);

    if (res.success && !isNew && booking) {
      await syncCashFlowTransaction(booking, form, therapists);
    }

    setSaving(false);
    if (res.success) { toast(isNew ? 'Session added' : 'Session updated'); onSuccess(); onClose(); }
    else setSaveError(res.error || 'Failed to save. Please try again.');
  }

  const canSave = !!(form.Client_Name && form.Therapist_ID && form.Session_Date);

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            {isNew ? 'Add Session' : `Edit — ${booking?.Client_Name || ''}`}
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultSelectedKey="session">
              <Tabs.ListContainer>
                <Tabs.List>
                  <Tabs.Tab id="session">Session<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="client">Client<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="status">Status<Tabs.Indicator /></Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              {/* ── Session tab ── */}
              <Tabs.Panel id="session">
                <div style={PANEL}>
                  <Field label="Therapist *">
                    <select value={form.Therapist_ID} onChange={(e) => set('Therapist_ID', e.target.value)} style={F}>
                      <option value="">— select therapist —</option>
                      {(therapists || []).map((th) => (
                        <option key={th.Therapist_ID} value={th.Therapist_ID}>{th.Name_EN}</option>
                      ))}
                    </select>
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Field label="Date *">
                      <input type="date" value={form.Session_Date}
                        onChange={(e) => set('Session_Date', e.target.value)} style={F} />
                    </Field>
                    <Field label="Time">
                      <input type="time" value={form.Session_Time}
                        onChange={(e) => set('Session_Time', e.target.value)} style={F}
                        placeholder="or pick a slot below" />
                    </Field>
                  </div>

                  <SlotPicker
                    therapistId={form.Therapist_ID}
                    date={form.Session_Date}
                    sessions={sessions}
                    bookingId={form.Booking_ID}
                    value={form.Session_Time}
                    onChange={(slot) => set('Session_Time', slot)}
                  />

                  <div style={{ marginBottom: '12px' }}>
                    <p style={LBL}>Session Type</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TYPES.map((tp) => (
                        <TypePill key={tp} label={tp} checked={form.Session_Type === tp}
                          onChange={() => set('Session_Type', tp)} />
                      ))}
                    </div>
                  </div>

                  <Field label="Mode">
                    <select value={form.Session_Mode} onChange={(e) => set('Session_Mode', e.target.value)} style={F}>
                      {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  {form.Session_Mode === 'Online' && (
                    <Field label="Video Link">
                      <input value={form.Video_Link} onChange={(e) => set('Video_Link', e.target.value)}
                        style={F} placeholder="https://…" />
                    </Field>
                  )}
                </div>
              </Tabs.Panel>

              {/* ── Client tab ── */}
              <Tabs.Panel id="client">
                <div style={PANEL}>
                  <Field label="Client Name *">
                    <ClientAutocomplete
                      value={form.Client_Name}
                      onChange={(val) => set('Client_Name', val)}
                      onSelect={(c) => setForm((f) => ({ ...f, Client_Name: c.Name, Client_Phone: c.Phone || f.Client_Phone, Client_Email: c.Email || f.Client_Email }))}
                      clients={clients}
                    />
                  </Field>
                  <Field label="Phone">
                    <input value={form.Client_Phone} onChange={(e) => set('Client_Phone', e.target.value)} style={F} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={form.Client_Email}
                      onChange={(e) => set('Client_Email', e.target.value)} style={F} />
                  </Field>
                </div>
              </Tabs.Panel>

              {/* ── Status tab ── */}
              <Tabs.Panel id="status">
                <div style={PANEL}>
                  <Field label="Status">
                    <select value={form.Status} onChange={(e) => set('Status', e.target.value)} style={F}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Payment Status">
                    <select value={form.Payment_Status} onChange={(e) => set('Payment_Status', e.target.value)} style={F}>
                      {PAYMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Payment Method">
                    <select value={form.Payment_Method} onChange={(e) => set('Payment_Method', e.target.value)} style={F}>
                      {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <Field label="Notes">
                    <textarea value={form.Notes} onChange={(e) => set('Notes', e.target.value)}
                      rows={3} style={{ ...F, resize: 'vertical' }} />
                  </Field>
                </div>
              </Tabs.Panel>
            </Tabs>
          </Modal.Body>

          <Modal.Footer>
            {saveError && (
              <p style={{ color: '#ef4444', fontSize: '13px', flex: 1, margin: 0 }}>{saveError}</p>
            )}
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" isDisabled={saving || !canSave}
              startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleSave}>
              {saving ? 'Saving…' : isNew ? 'Add Session' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
