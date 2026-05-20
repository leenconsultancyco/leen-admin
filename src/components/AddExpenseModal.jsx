import { useState } from 'react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Spinner,
} from '@heroui/react';
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
    const result = await addExpense({
      date:        form.date,
      category:    form.category,
      item:        form.item,
      expectedEGP: Number(form.expected || 0),
      actualEGP:   Number(form.actual),
      paidBy:      form.paidBy,
      notes:       form.notes,
    });
    setSaving(false);

    if (result.success) {
      setForm(BLANK);
      onSuccess();
      onClose();
    } else {
      setError(result.error || t('general.error'));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{t('expenses.addExpense')}</ModalHeader>
        <ModalBody className="gap-3">
          <div className="flex gap-2">
            <Input type="date" label={t('sessions.date')} value={form.date}
              onValueChange={(v) => set('date', v)} className="flex-1" />
            <Select label={t('expenses.category')} selectedKeys={[form.category]} className="flex-1"
              onSelectionChange={(k) => set('category', [...k][0])}>
              {CATEGORIES.map((c) => <SelectItem key={c}>{c}</SelectItem>)}
            </Select>
          </div>
          <Input label={t('expenses.item')} value={form.item}
            onValueChange={(v) => set('item', v)} isRequired />
          <div className="flex gap-2">
            <Input type="number" min="0" label={t('expenses.expected')} value={form.expected}
              onValueChange={(v) => set('expected', v)} className="flex-1" />
            <Input type="number" min="0" label={t('expenses.actual')} value={form.actual}
              onValueChange={(v) => set('actual', v)} isRequired className="flex-1" />
          </div>
          <Select label={t('expenses.paidBy')} selectedKeys={[form.paidBy]}
            onSelectionChange={(k) => set('paidBy', [...k][0])}>
            {METHODS.map((m) => <SelectItem key={m}>{m}</SelectItem>)}
          </Select>
          <Textarea label="Notes" value={form.notes}
            onValueChange={(v) => set('notes', v)} minRows={2} />
          {error && <p className="text-sm text-danger">{error}</p>}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
          <Button color="primary" isDisabled={saving}
            startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
            onPress={handleSave}>
            {t('general.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
