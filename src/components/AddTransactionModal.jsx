import { useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { addTransaction } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Revenue', 'Salary', 'Rent', 'Marketing', 'Admin', 'Initial_Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);
const BLANK      = { date: TODAY, description: '', category: 'Revenue', subCategory: '', cashIn: '', cashOut: '', method: 'Cash', notes: '' };

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    const cashIn  = Number(form.cashIn  || 0);
    const cashOut = Number(form.cashOut || 0);
    if (!form.description) { setError(t('general.required')); return; }
    if ((cashIn > 0) === (cashOut > 0)) { setError('Enter Cash In OR Cash Out — not both, not neither.'); return; }
    setError('');
    setSaving(true);
    const result = await addTransaction({
      date: form.date, description: form.description,
      category: form.category, subCategory: form.subCategory,
      cashIn: cashIn || null, cashOut: cashOut || null,
      method: form.method, notes: form.notes,
    });
    setSaving(false);
    if (result.success) { setForm(BLANK); onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('cashflow.addTransaction')}</Modal.Header>
          <Modal.Body className="flex flex-col gap-1">

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('sessions.date')}</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('cashflow.method')}</label>
                <select value={form.method} onChange={(e) => set('method', e.target.value)} style={F}>
                  {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={LBL}>{t('cashflow.description')} *</label>
              <input value={form.description} onChange={(e) => set('description', e.target.value)}
                required style={F} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('cashflow.category')}</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} style={F}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Sub-category</label>
                <input value={form.subCategory} onChange={(e) => set('subCategory', e.target.value)} style={F} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('cashflow.cashIn')} (EGP)</label>
                <input type="number" min="0" value={form.cashIn}
                  onChange={(e) => set('cashIn', e.target.value)} style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('cashflow.cashOut')} (EGP)</label>
                <input type="number" min="0" value={form.cashOut}
                  onChange={(e) => set('cashOut', e.target.value)} style={F} />
              </div>
            </div>

            <div>
              <label style={LBL}>Notes</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                rows={2} style={{ ...F, resize: 'vertical' }} />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
            <Button color="primary" isDisabled={saving}
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
