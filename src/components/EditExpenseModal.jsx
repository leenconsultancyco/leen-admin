import { useState, useEffect, useMemo } from 'react';
import { Button, Modal, Spinner } from '@heroui/react';
import { editExpense, getExpenseCategories } from '../api';
import { useI18n } from '../i18n';

const METHODS = ['Cash', 'Bank transfer'];

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

export default function EditExpenseModal({ expense, isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [catRows, setCatRows]     = useState([]);
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCatLoading(true);
    getExpenseCategories().then((r) => {
      if (r.success && Array.isArray(r.data)) setCatRows(r.data);
      setCatLoading(false);
    });
  }, [isOpen]);

  useEffect(() => {
    if (expense) {
      setForm({
        date:        (expense.Date || '').substring(0, 10),
        category:    expense.Category    || '',
        subCategory: expense.Sub_Category || '',
        item:        expense.Item         || '',
        amount:      String(expense.Actual_EGP || ''),
        paidBy:      expense.Paid_By      || 'Cash',
        notes:       expense.Notes        || '',
      });
      setError('');
    }
  }, [expense, isOpen]);

  const categories = useMemo(() => [...new Set(catRows.map((r) => r.Category).filter(Boolean))], [catRows]);

  const subCategories = useMemo(() =>
    catRows.filter((r) => r.Category === form.category).map((r) => r.Subcategory).filter(Boolean),
  [catRows, form.category]);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  function handleCategoryChange(cat) {
    setForm((f) => ({ ...f, category: cat, subCategory: '' }));
  }

  async function handleSave() {
    if (!form.item)   { setError(t('general.required')); return; }
    if (!form.amount) { setError(t('general.required')); return; }
    setError('');
    setSaving(true);
    const result = await editExpense({
      expenseId:   expense.Expense_ID,
      date:        form.date,
      category:    form.category,
      subCategory: form.subCategory,
      item:        form.item,
      actualEGP:   Number(form.amount),
      expectedEGP: Number(form.amount),
      paidBy:      form.paidBy,
      notes:       form.notes,
    });
    setSaving(false);
    if (result.success) { onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  if (!expense) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>Edit Expense — {expense.Expense_ID}</Modal.Header>
          <Modal.Body className="flex flex-col gap-1">

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('sessions.date')}</label>
                <input type="date" value={form.date}
                  onChange={(e) => set('date', e.target.value)} style={F} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>{t('expenses.category')}</label>
                {catLoading ? (
                  <div style={{ ...F, display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af' }}>
                    <Spinner size="sm" /> Loading…
                  </div>
                ) : (
                  <select value={form.category}
                    onChange={(e) => handleCategoryChange(e.target.value)} style={F}>
                    <option value="">— Select —</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
              </div>
            </div>

            {subCategories.length > 0 && (
              <div>
                <label style={LBL}>{t('expenses.subCategory')}</label>
                <select value={form.subCategory}
                  onChange={(e) => set('subCategory', e.target.value)} style={F}>
                  <option value="">— Select —</option>
                  {subCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

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
                rows={2} style={{ ...F, resize: 'vertical' }} />
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: '4px 0' }}>{error}</p>
            )}
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
