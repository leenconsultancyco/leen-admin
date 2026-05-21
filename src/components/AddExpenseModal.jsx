import { useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { addExpense } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Cleaning', 'Coffee & Break', 'Facilities', 'Marketing', 'Salary', 'Initial Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);
const BLANK      = { date: TODAY, category: 'Cleaning', item: '', expected: '', actual: '', paidBy: 'Cash', notes: '' };

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

export default function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.item) { setError(t('general.required')); return; }
    if (!form.actual && form.actual !== 0) { setError(t('general.required')); return; }
    setError('');
    setSaving(true);
    const result = await addExpense({
      date: form.date, category: form.category, item: form.item,
      expectedEGP: Number(form.expected || 0), actualEGP: Number(form.actual),
      paidBy: form.paidBy, notes: form.notes,
    });
    setSaving(false);
    if (result.success) { setForm(BLANK); onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('expenses.addExpense')}</Modal.Header>
          <Modal.Body className="flex flex-col gap-1">

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('sessions.date')}</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('expenses.category')}</label>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} style={F}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={LBL}>{t('expenses.item')} *</label>
              <input value={form.item} onChange={(e) => set('item', e.target.value)} required style={F} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('expenses.expected')} (EGP)</label>
                <input type="number" min="0" value={form.expected}
                  onChange={(e) => set('expected', e.target.value)} style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('expenses.actual')} (EGP) *</label>
                <input type="number" min="0" value={form.actual}
                  onChange={(e) => set('actual', e.target.value)} required style={F} />
              </div>
            </div>

            <div>
              <label style={LBL}>{t('expenses.paidBy')}</label>
              <select value={form.paidBy} onChange={(e) => set('paidBy', e.target.value)} style={F}>
                {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label style={LBL}>Notes</label>
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                rows={2} placeholder="Notes" style={{ ...F, resize: 'vertical' }} />
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
