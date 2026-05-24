import { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Tabs } from '@heroui/react';
import { addBookingAdmin, editBooking } from '../api';

const TYPES      = ['Individual', 'Couples', 'Family', 'Group', 'Workshop'];
const MODES      = ['In-person', 'Online'];
const STATUSES   = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
const PAYMENTS   = ['Unpaid', 'Paid', 'Waived'];
const PAY_METHODS = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL   = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };
const PANEL = { minHeight: '340px', maxHeight: '340px', overflowY: 'auto', paddingTop: '12px' };

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={LBL}>{label}</label>}
      {children}
    </div>
  );
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
    Session_Date:   booking.Session_Date   || TODAY,
    Session_Time:   booking.Session_Time   || '09:00',
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

export default function SessionEditModal({ booking, isNew, isOpen, onClose, onSuccess, therapists }) {
  const [form, setForm]         = useState(() => initForm(booking, isNew));
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => { setForm(initForm(booking, isNew)); setSaveError(''); }, [booking, isNew, isOpen]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.Client_Name || !form.Therapist_ID || !form.Session_Date) return;
    setSaving(true);
    setSaveError('');
    const res = isNew ? await addBookingAdmin(form) : await editBooking(form);
    setSaving(false);
    if (res.success) { onSuccess(); onClose(); }
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
                      <input type="date" value={form.Session_Date} onChange={(e) => set('Session_Date', e.target.value)} style={F} />
                    </Field>
                    <Field label="Time">
                      <input type="time" value={form.Session_Time} onChange={(e) => set('Session_Time', e.target.value)} style={F} />
                    </Field>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={LBL}>Session Type</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TYPES.map((tp) => (
                        <TypePill key={tp} label={tp} checked={form.Session_Type === tp} onChange={() => set('Session_Type', tp)} />
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
                      <input value={form.Video_Link} onChange={(e) => set('Video_Link', e.target.value)} style={F} placeholder="https://..." />
                    </Field>
                  )}
                </div>
              </Tabs.Panel>

              {/* ── Client tab ── */}
              <Tabs.Panel id="client">
                <div style={PANEL}>
                  <Field label="Client Name *">
                    <input value={form.Client_Name} onChange={(e) => set('Client_Name', e.target.value)} style={F} />
                  </Field>
                  <Field label="Phone">
                    <input value={form.Client_Phone} onChange={(e) => set('Client_Phone', e.target.value)} style={F} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={form.Client_Email} onChange={(e) => set('Client_Email', e.target.value)} style={F} />
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
              {isNew ? 'Add Session' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
