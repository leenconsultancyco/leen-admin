import { useState } from 'react';
import { Button, Input, Label, ListBox, Modal, Select, Spinner, TextArea } from '@heroui/react';
import { addTransaction } from '../api';
import { useI18n } from '../i18n';

const CATEGORIES = ['Revenue', 'Salary', 'Rent', 'Marketing', 'Admin', 'Initial_Cost', 'Other'];
const METHODS    = ['Cash', 'Bank transfer'];
const TODAY      = new Date().toISOString().slice(0, 10);
const BLANK = { date: TODAY, description: '', category: 'Revenue', subCategory: '', cashIn: '', cashOut: '', method: 'Cash', notes: '' };

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
    const result = await addTransaction({ date: form.date, description: form.description,
      category: form.category, subCategory: form.subCategory,
      cashIn: cashIn || null, cashOut: cashOut || null, method: form.method, notes: form.notes });
    setSaving(false);
    if (result.success) { setForm(BLANK); onSuccess(); onClose(); }
    else setError(result.error || t('general.error'));
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{t('cashflow.addTransaction')}</Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="flex-1" />
              <Select selectedKey={form.method} onSelectionChange={(k) => set('method', k)} className="flex-1">
                <Label>{t('cashflow.method')}</Label>
                <ListBox>{METHODS.map((m) => <ListBox.Item id={m} key={m}>{m}</ListBox.Item>)}</ListBox>
              </Select>
            </div>
            <Input label={t('cashflow.description')} value={form.description}
              onValueChange={(v) => set('description', v)} isRequired />
            <div className="flex gap-2">
              <Select selectedKey={form.category} onSelectionChange={(k) => set('category', k)} className="flex-1">
                <Label>{t('cashflow.category')}</Label>
                <ListBox>{CATEGORIES.map((c) => <ListBox.Item id={c} key={c}>{c}</ListBox.Item>)}</ListBox>
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
            <TextArea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder={t('sessions.payment')} />
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
