import { useState } from 'react';
import { Button, Input, Label, ListBox, Modal, Select, Spinner, TextArea } from '@heroui/react';
import { addExpense } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Cleaning', 'Coffee & Break', 'Facilities', 'Marketing', 'Salary', 'Initial Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);
const BLANK = { date: TODAY, category: 'Cleaning', item: '', expected: '', actual: '', paidBy: 'Cash', notes: '' };

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
    const result = await addExpense({ date: form.date, category: form.category, item: form.item,
      expectedEGP: Number(form.expected || 0), actualEGP: Number(form.actual),
      paidBy: form.paidBy, notes: form.notes });
    setSaving(false);
    if (result.success) { setForm(BLANK); onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('expenses.addExpense')}</Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="flex-1" />
              <Select selectedKey={form.category} onSelectionChange={(k) => set('category', k)} className="flex-1">
                <Label>{t('expenses.category')}</Label>
                <ListBox>{CATEGORIES.map((c) => <ListBox.Item id={c} key={c}>{c}</ListBox.Item>)}</ListBox>
              </Select>
            </div>
            <Input label={t('expenses.item')} value={form.item}
              onValueChange={(v) => set('item', v)} isRequired />
            <div className="flex gap-2">
              <Input type="number" min="0" label={t('expenses.expected')}
                value={form.expected} onValueChange={(v) => set('expected', v)} className="flex-1" />
              <Input type="number" min="0" label={t('expenses.actual')}
                value={form.actual} onValueChange={(v) => set('actual', v)} isRequired className="flex-1" />
            </div>
            <Select selectedKey={form.paidBy} onSelectionChange={(k) => set('paidBy', k)}>
              <Label>{t('expenses.paidBy')}</Label>
              <ListBox>{METHODS.map((m) => <ListBox.Item id={m} key={m}>{m}</ListBox.Item>)}</ListBox>
            </Select>
            <TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Notes" />
            {error && <p className="text-sm text-danger">{error}</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
            <Button color="primary" isDisabled={saving}
              startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleSave}>{t('general.save')}</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
