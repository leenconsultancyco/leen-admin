import { useState } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { addExpense } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Cleaning', 'Coffee & Break', 'Facilities', 'Marketing', 'Salary', 'Initial Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);
const BLANK      = { date: TODAY, category: 'Cleaning', item: '', amount: '', paidBy: 'Cash', notes: '' };

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

export default function AddExpenseModal({ isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]       = useState(BLANK);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [queued, setQueued]   = useState(false);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function handleClose() {
    setForm(BLANK);
    setError('');
    setQueued(false);
    onClose();
  }

  async function handleSave() {
    if (!form.item)   { setError(t('general.required')); return; }
    if (!form.amount) { setError(t('general.required')); return; }
    setError('');
    setQueued(false);
    setSaving(true);
    const result = await addExpense({
      date: form.date,
      category: form.category,
      item: form.item,
      actualEGP:   Number(form.amount),
      expectedEGP: Number(form.amount),
      paidBy: form.paidBy,
      notes: form.notes,
    });
    setSaving(false);

    if (result.queued) {
      // Request queued for offline sync — close but warn the user
      setQueued(true);
      return;
    }
    if (result.success) {
      setForm(BLANK);
      onSuccess();
      onClose();
    } else {
      setError(result.error || t('general.error'));
    }
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('expenses.addExpense')}</Modal.Header>
          <Modal.Body className="flex flex-col gap-1">

            {queued ? (
              <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</p>
                <p style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                  {t('connection.offlineNote') || 'Saved offline'}
                </p>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Your expense will be written to Google Sheets automatically when the connection improves.
                </p>
                <Button
                  style={{ marginTop: '16px' }}
                  variant="flat"
                  onPress={() => { setForm(BLANK); setQueued(false); onSuccess(); onClose(); }}
                >
                  OK
                </Button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={LBL}>{t('sessions.date')}</label>
                    <input type="date" value={form.date}
                      onChange={(e) => set('date', e.target.value)} style={F} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={LBL}>{t('expenses.category')}</label>
                    <select value={form.category}
                      onChange={(e) => set('category', e.target.value)} style={F}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={LBL}>{t('expenses.item')} *</label>
                  <input value={form.item}
                    onChange={(e) => set('item', e.target.value)} required style={F} />
                </div>

                <div>
                  <label style={LBL}>{t('expenses.amount')} *</label>
                  <input type="number" min="0" value={form.amount}
                    onChange={(e) => set('amount', e.target.value)} required style={F} />
                </div>

                <div>
                  <label style={LBL}>{t('expenses.paidBy')}</label>
                  <select value={form.paidBy}
                    onChange={(e) => set('paidBy', e.target.value)} style={F}>
                    {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label style={LBL}>Notes</label>
                  <textarea value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                    rows={2} placeholder="Notes"
                    style={{ ...F, resize: 'vertical' }} />
                </div>

                {error && (
                  <p style={{ color: '#dc2626', fontSize: '13px', margin: '4px 0' }}>{error}</p>
                )}
              </>
            )}
          </Modal.Body>

          {!queued && (
            <Modal.Footer>
              <Button variant="flat" onPress={handleClose}>{t('general.cancel')}</Button>
              <Button color="primary" isDisabled={saving}
                startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
                onPress={handleSave}>
                {t('general.save')}
              </Button>
            </Modal.Footer>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
