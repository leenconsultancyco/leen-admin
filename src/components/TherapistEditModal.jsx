import { useState, useEffect } from 'react';
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Input, Textarea, Select, SelectItem, Switch, Tabs, Tab, Spinner, Divider,
} from '@heroui/react';
import { updateTherapist, blockDate } from '../api';
import { useI18n } from '../i18n';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPES  = ['Individual', 'Couples', 'Family', 'Group', 'Workshop'];
const MODES  = ['In-person', 'Online', 'Both'];
const TODAY  = new Date().toISOString().slice(0, 10);

function initForm(th) {
  return {
    ...th,
    workingDays:  (th.Working_Days  || '').split(',').map((d) => d.trim()).filter(Boolean),
    sessionTypes: (th.Session_Types || '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

function CheckPill({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange}
      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${checked ? 'bg-primary text-primary-foreground border-primary' : 'border-default-300 text-default-600 hover:border-primary'}`}>
      {label}
    </button>
  );
}

export default function TherapistEditModal({ therapist, isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]         = useState(() => initForm(therapist));
  const [saving, setSaving]     = useState(false);
  const [block, setBlock]       = useState({ date: TODAY, timeStart: '', timeEnd: '', reason: '' });
  const [blockSaving, setBlockSaving] = useState(false);

  // Reset form whenever the modal opens for a different therapist
  useEffect(() => { setForm(initForm(therapist)); }, [therapist, isOpen]);

  function set(key, val)  { setForm((f) => ({ ...f, [key]: val })); }
  function setB(key, val) { setBlock((b) => ({ ...b, [key]: val })); }

  function toggleArr(key, val) {
    setForm((f) => {
      const arr = f[key] || [];
      return { ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  async function handleSave() {
    setSaving(true);
    await updateTherapist({
      ...form,
      Working_Days:  form.workingDays.join(','),
      Session_Types: form.sessionTypes.join(','),
    });
    setSaving(false);
    onSuccess();
    onClose();
  }

  async function handleBlock() {
    if (!block.date) return;
    setBlockSaving(true);
    await blockDate(therapist.Therapist_ID, block.date, block.timeStart, block.timeEnd, block.reason);
    setBlockSaving(false);
    setBlock({ date: TODAY, timeStart: '', timeEnd: '', reason: '' });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        {() => (<>
        <ModalHeader>{t('therapistMgmt.editTherapist')}: {therapist.Name_EN}</ModalHeader>
        <ModalBody>
          <Tabs aria-label="edit-sections" size="sm">
            {/* Tab 1 — Info */}
            <Tab key="info" title={t('therapistMgmt.name')}>
              <div className="flex flex-col gap-3 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input label={`${t('therapistMgmt.name')} EN`} value={form.Name_EN || ''} onValueChange={(v) => set('Name_EN', v)} />
                  <Input label={`${t('therapistMgmt.name')} AR`} value={form.Name_AR || ''} onValueChange={(v) => set('Name_AR', v)} />
                  <Input label={`${t('therapistMgmt.title2')} EN`} value={form.Title_EN || ''} onValueChange={(v) => set('Title_EN', v)} />
                  <Input label={`${t('therapistMgmt.title2')} AR`} value={form.Title_AR || ''} onValueChange={(v) => set('Title_AR', v)} />
                </div>
                <Input label={t('therapistMgmt.photoUrl')} value={form.Photo_URL || ''} onValueChange={(v) => set('Photo_URL', v)} />
                <Textarea label={`${t('therapistMgmt.bio')} EN`} value={form.Bio_EN || ''} onValueChange={(v) => set('Bio_EN', v)} minRows={3} />
                <Textarea label={`${t('therapistMgmt.bio')} AR`} value={form.Bio_AR || ''} onValueChange={(v) => set('Bio_AR', v)} minRows={3} />
                <Input label={t('therapistMgmt.specialties')} value={form.Specialties || ''} onValueChange={(v) => set('Specialties', v)} description="Comma-separated" />
                <Input label="Languages" value={form.Languages || ''} onValueChange={(v) => set('Languages', v)} description="Comma-separated" />
                <Switch isSelected={!!form.Active} onValueChange={(v) => set('Active', v)}>
                  {form.Active ? t('therapistMgmt.active') : t('therapistMgmt.inactive')}
                </Switch>
              </div>
            </Tab>

            {/* Tab 2 — Schedule */}
            <Tab key="schedule" title={t('therapistMgmt.workingDays')}>
              <div className="flex flex-col gap-4 pt-3">
                <div>
                  <p className="text-sm text-default-500 mb-2">{t('sessions.type')}</p>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((tp) => <CheckPill key={tp} label={tp} checked={form.sessionTypes.includes(tp)} onChange={() => toggleArr('sessionTypes', tp)} />)}
                  </div>
                </div>
                <Select label={t('therapistMgmt.modes')} selectedKeys={[form.Modes || 'Both']}
                  onSelectionChange={(k) => set('Modes', [...k][0])}>
                  {MODES.map((m) => <SelectItem key={m}>{m}</SelectItem>)}
                </Select>
                <div>
                  <p className="text-sm text-default-500 mb-2">{t('therapistMgmt.workingDays')}</p>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => <CheckPill key={d} label={d} checked={form.workingDays.includes(d)} onChange={() => toggleArr('workingDays', d)} />)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="time" label={t('therapistMgmt.startTime')} value={form.Start_Time || ''} onValueChange={(v) => set('Start_Time', v)} />
                  <Input type="time" label={t('therapistMgmt.endTime')}   value={form.End_Time   || ''} onValueChange={(v) => set('End_Time', v)} />
                  <Input type="number" label={t('therapistMgmt.duration')} value={String(form.Session_Duration_Min || 50)} onValueChange={(v) => set('Session_Duration_Min', Number(v))} />
                </div>
              </div>
            </Tab>

            {/* Tab 3 — Fees */}
            <Tab key="fees" title={t('therapistMgmt.fees')}>
              <div className="grid grid-cols-2 gap-3 pt-3">
                {['Individual', 'Couples', 'Family', 'Group', 'Workshop'].map((type) => (
                  <Input key={type} type="number" min="0" label={`${type} (EGP)`}
                    value={String(form[`Fee_${type}`] || '')}
                    onValueChange={(v) => set(`Fee_${type}`, Number(v))} />
                ))}
                <Input type="number" min="0" max="100" label={t('therapistMgmt.revenueShare')}
                  value={String(form.Revenue_Share_Pct || '')}
                  onValueChange={(v) => set('Revenue_Share_Pct', Number(v))} />
              </div>
            </Tab>

            {/* Tab 4 — Block Date */}
            <Tab key="block" title={t('therapistMgmt.blockDate')}>
              <div className="flex flex-col gap-3 pt-3">
                <Input type="date" label={t('sessions.date')} value={block.date} onValueChange={(v) => setB('date', v)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" label={t('therapistMgmt.startTime')} value={block.timeStart} onValueChange={(v) => setB('timeStart', v)} />
                  <Input type="time" label={t('therapistMgmt.endTime')}   value={block.timeEnd}   onValueChange={(v) => setB('timeEnd', v)} />
                </div>
                <Input label={t('therapistMgmt.blockReason')} value={block.reason} onValueChange={(v) => setB('reason', v)} />
                <Button color="warning" variant="flat" isDisabled={blockSaving || !block.date}
                  startContent={blockSaving ? <Spinner size="sm" /> : undefined}
                  onPress={handleBlock}>
                  {t('therapistMgmt.blockDate')}
                </Button>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
          <Button color="primary" isDisabled={saving}
            startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
            onPress={handleSave}>
            {t('therapistMgmt.saveChanges')}
          </Button>
        </ModalFooter>
        </>)}
      </ModalContent>
    </Modal>
  );
}
