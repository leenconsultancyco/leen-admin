import { useState } from 'react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Select, SelectItem, Textarea, Spinner,
} from '@heroui/react';
import { addTransaction } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Revenue', 'Salary', 'Rent', 'Marketing', 'Admin', 'Initial_Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);

const BLANK = { date: TODAY, description: '', category: 'Revenue', subCategory: '',
  cashIn: '', cashOut: '', method: 'Cash', notes: '' };

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
    if ((cashIn > 0) === (cashOut > 0)) {
      setError('Enter either Cash In or Cash Out — not both, not neither.');
      return;
    }

    setError('');
    setSaving(true);
    const result = await addTransaction({
      date:        form.date,
      description: form.description,
      category:    form.category,
      subCategory: form.subCategory,
      cashIn:      cashIn || null,
      cashOut:     cashOut || null,
      method:      form.method,
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
        <ModalHeader>{t('cashflow.addTransaction')}</ModalHeader>
        <ModalBody className="gap-3">
          <div className="flex gap-2">
            <Input type="date" label={t('sessions.date')} value={form.date}
              onValueChange={(v) => set('date', v)} className="flex-1" />
            <Select label={t('cashflow.method')} selectedKeys={[form.method]} className="flex-1"
              onSelectionChange={(k) => set('method', [...k][0])}>
              {METHODS.map((m) => <SelectItem key={m}>{m}</SelectItem>)}
            </Select>
          </div>
          <Input label={t('cashflow.description')} value={form.description}
            onValueChange={(v) => set('description', v)} isRequired />
          <div className="flex gap-2">
            <Select label={t('cashflow.category')} selectedKeys={[form.category]} className="flex-1"
              onSelectionChange={(k) => set('category', [...k][0])}>
              {CATEGORIES.map((c) => <SelectItem key={c}>{c}</SelectItem>)}
            </Select>
            <Input label="Sub-category" value={form.subCategory}
              onValueChange={(v) => set('subCategory', v)} className="flex-1" />
          </div>
          <div className="flex gap-2">
            <Input type="number" min="0" label={`${t('cashflow.cashIn')} (EGP)`}
              value={form.cashIn} onValueChange={(v) => set('cashIn', v)} className="flex-1" />
            <Input type="number" min="0" label={`${t('cashflow.cashOut')} (EGP)`}
              value={form.cashOut} onValueChange={(v) => set('cashOut', v)} className="flex-1" />
          </div>
          <Textarea label={t('sessions.payment')} value={form.notes}
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
