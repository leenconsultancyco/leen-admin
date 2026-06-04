import { useState, useEffect } from 'react';
import { Button, Chip, Separator, Modal, Spinner } from '@heroui/react';
import { useI18n } from '../i18n';
import { updateClient } from '../api';
import DataTable from './DataTable';

const SESSION_COLS = [
  { key: 'Session_Date',   label: 'Date',      sortable: true },
  { key: 'Therapist_Name', label: 'Therapist' },
  { key: 'Session_Type',   label: 'Type' },
  { key: 'Session_Mode',   label: 'Mode' },
  { key: 'Fee',            label: 'Fee',  render: (r) => <span dir="ltr">{Number(r.Fee || 0).toLocaleString('en-EG')} EGP</span> },
  { key: 'Status',         label: 'Status', render: (r) => <Chip size="sm" variant="flat">{r.Status}</Chip> },
];

const INP = {
  display: 'block', width: '100%',
  border: '1.5px solid #d1d5db', borderRadius: 8,
  padding: '7px 12px', fontSize: 14,
  backgroundColor: '#fff', color: '#111827',
  outline: 'none', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 3 };

function EditField({ label, children }) {
  return (
    <div>
      <label style={LBL}>{label}</label>
      {children}
    </div>
  );
}

export default function ClientDetailModal({ client, isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    setForm({
      name:   client.Name   || '',
      phone:  client.Phone  || '',
      email:  client.Email  || '',
      status: client.Status || 'Active',
      notes:  client.Notes  || '',
    });
    setError('');
  }, [client, isOpen]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    const res = await updateClient({
      Client_ID: client.Client_ID,
      Name:      form.name.trim(),
      Phone:     form.phone.trim(),
      Email:     form.email.trim(),
      Status:    form.status,
      Notes:     form.notes,
    });
    setSaving(false);
    if (res.success) { onSuccess?.(); onClose(); }
    else setError(res.error || 'Failed to save. Please try again.');
  }

  const isDirty =
    form.name   !== (client.Name   || '') ||
    form.phone  !== (client.Phone  || '') ||
    form.email  !== (client.Email  || '') ||
    form.status !== (client.Status || 'Active') ||
    form.notes  !== (client.Notes  || '');

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <div className="flex items-center gap-3">
              <span>{client.Name}</span>
              <Chip size="sm" color={client.Status === 'Active' ? 'success' : 'default'} variant="flat">
                {client.Status === 'Active' ? t('clients.active') : t('clients.inactive')}
              </Chip>
            </div>
          </Modal.Header>

          <Modal.Body className="flex flex-col gap-4 pb-4">
            {/* Editable info fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              <EditField label={t('clients.name') + ' *'}>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} style={INP} />
              </EditField>
              <EditField label={t('clients.phone')}>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)} style={INP} />
              </EditField>
              <EditField label={t('clients.email')}>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} style={INP} />
              </EditField>
              <EditField label={t('clients.status')}>
                <select value={form.status} onChange={(e) => set('status', e.target.value)} style={INP}>
                  <option value="Active">{t('clients.active')}</option>
                  <option value="Inactive">{t('clients.inactive')}</option>
                </select>
              </EditField>
            </div>

            {/* Read-only info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
              {[
                [t('clients.firstSession'),  String(client.First_Session_Date || '—').substring(0, 10)],
                [t('clients.totalSessions'), client.Total_Sessions ?? 0],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 2px' }}>{label}</p>
                  <p style={{ fontSize: 14, color: '#374151', fontWeight: 500, margin: 0 }}>{val}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-default-700 mb-2">{t('clients.sessionHistory')}</p>
              <DataTable columns={SESSION_COLS} data={client.sessions ?? []} loading={false} emptyMessage={t('general.noResults')} />
            </div>

            <Separator />

            <EditField label={t('clients.notes')}>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                style={{ ...INP, resize: 'vertical' }}
              />
            </EditField>
          </Modal.Body>

          <Modal.Footer>
            {error && <p style={{ color: '#ef4444', fontSize: 13, flex: 1, margin: 0 }}>{error}</p>}
            <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
            <Button
              color="primary"
              isDisabled={saving || !isDirty}
              startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleSave}
            >
              {saving ? 'Saving…' : t('general.save')}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
