import { useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { addClient } from '../api';
import { useI18n } from '../i18n';

const TODAY = new Date().toISOString().slice(0, 10);
const BLANK = { name: '', phone: '', email: '', status: 'Active', notes: '' };

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

export default function AddClientModal({ isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function handleClose() { setForm(BLANK); setError(''); onClose(); }

  async function handleSave() {
    if (!form.name)  { setError(t('general.required') + ' — Name');  return; }
    if (!form.phone) { setError(t('general.required') + ' — Phone'); return; }
    setError('');
    setSaving(true);
    const result = await addClient({
      name:   form.name,
      phone:  form.phone,
      email:  form.email,
      status: form.status,
      notes:  form.notes,
      addedAt: TODAY,
    });
    setSaving(false);
    if (result.success) { setForm(BLANK); onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('clients.addClient') || 'Add Client'}</Modal.Header>
          <Modal.Body className="flex flex-col gap-1">

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('clients.name')} *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)}
                  required placeholder="Full name" style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('clients.phone')} *</label>
                <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                  required placeholder="+20 10 XXXX XXXX" style={F} />
              </div>
            </div>

            <div>
              <label style={LBL}>{t('clients.email')}</label>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                placeholder="optional" style={F} />
            </div>

            <div>
              <label style={LBL}>{t('clients.status')}</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} style={F}>
                <option value="Active">{t('clients.active')}</option>
                <option value="Inactive">{t('clients.inactive')}</option>
              </select>
            </div>

            <div>
              <label style={LBL}>{t('clients.notes')}</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                rows={2} placeholder="Admin notes (not visible to client)"
                style={{ ...F, resize: 'vertical' }} />
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: '4px 0' }}>{error}</p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={handleClose}>{t('general.cancel')}</Button>
            <Button color="primary" isDisabled={saving || !form.name || !form.phone}
              startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleSave}>
              {t('general.save')}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
