import { useState, useEffect } from 'react';
import { Button, Modal, Spinner, Switch, Label, Tabs } from '@heroui/react';
import { addTherapist, updateTherapist, blockDate } from '../api';
import { useI18n } from '../i18n';

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPES = ['Individual', 'Couples', 'Family', 'Group', 'Workshop'];
const MODES = ['In-person', 'Online', 'Both'];
const TODAY = new Date().toISOString().slice(0, 10);

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '16px',
  marginBottom: '8px', boxSizing: 'border-box',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };
// Fixed-height scrollable wrapper for every tab panel — prevents modal resizing between tabs
const PANEL = { minHeight: '360px', maxHeight: '360px', overflowY: 'auto', paddingTop: '12px' };

function Field({ label, children }) {
  return (
    <div>
      {label && <label style={LBL}>{label}</label>}
      {children}
    </div>
  );
}

function CheckPill({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        padding: '4px 14px',
        borderRadius: '9999px',
        fontSize: '12px',
        border: `2px solid ${checked ? '#0E9B73' : '#d1d5db'}`,
        backgroundColor: checked ? '#0E9B73' : '#ffffff',
        color: checked ? '#ffffff' : '#4b5563',
        cursor: 'pointer',
        fontWeight: checked ? '600' : '400',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function initForm(th) {
  return {
    ...th,
    workingDays:  (th.Working_Days  || '').split(',').map((d) => d.trim()).filter(Boolean),
    sessionTypes: (th.Session_Types || '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

export default function TherapistEditModal({ therapist, isNew = false, isOpen, onClose, onSuccess }) {
  const { t } = useI18n();
  const [form, setForm]               = useState(() => initForm(therapist));
  const [saving, setSaving]           = useState(false);
  const [block, setBlock]             = useState({ date: TODAY, timeStart: '', timeEnd: '', reason: '' });
  const [blockSaving, setBlockSaving] = useState(false);

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
    if (!form.Name_EN) return;
    setSaving(true);
    const payload = { ...form, Working_Days: form.workingDays.join(','), Session_Types: form.sessionTypes.join(',') };
    if (isNew) await addTherapist(payload);
    else       await updateTherapist(payload);
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
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            {isNew ? t('therapistMgmt.addTherapist') || 'Add Therapist' : `${t('therapistMgmt.editTherapist')}: ${therapist.Name_EN}`}
          </Modal.Header>
          <Modal.Body>
            <Tabs defaultSelectedKey="info">
              <Tabs.ListContainer>
                <Tabs.List>
                  <Tabs.Tab id="info">{t('therapistMgmt.name')}<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="schedule">{t('therapistMgmt.workingDays')}<Tabs.Indicator /></Tabs.Tab>
                  <Tabs.Tab id="fees">{t('therapistMgmt.fees')}<Tabs.Indicator /></Tabs.Tab>
                  {!isNew && <Tabs.Tab id="block">{t('therapistMgmt.blockDate')}<Tabs.Indicator /></Tabs.Tab>}
                </Tabs.List>
              </Tabs.ListContainer>

              {/* ── Name / Info tab ── */}
              <Tabs.Panel id="info">
                <div style={PANEL}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Field label={`${t('therapistMgmt.name')} EN *`}>
                      <input value={form.Name_EN || ''} onChange={(e) => set('Name_EN', e.target.value)} style={F} />
                    </Field>
                    <Field label={`${t('therapistMgmt.name')} AR`}>
                      <input value={form.Name_AR || ''} onChange={(e) => set('Name_AR', e.target.value)} style={F} />
                    </Field>
                    <Field label={`${t('therapistMgmt.title2')} EN`}>
                      <input value={form.Title_EN || ''} onChange={(e) => set('Title_EN', e.target.value)} style={F} />
                    </Field>
                    <Field label={`${t('therapistMgmt.title2')} AR`}>
                      <input value={form.Title_AR || ''} onChange={(e) => set('Title_AR', e.target.value)} style={F} />
                    </Field>
                  </div>
                  <Field label={t('therapistMgmt.photoUrl')}>
                    <input value={form.Photo_URL || ''} onChange={(e) => set('Photo_URL', e.target.value)} style={F} />
                  </Field>
                  <Field label={`${t('therapistMgmt.bio')} EN`}>
                    <textarea value={form.Bio_EN || ''} onChange={(e) => set('Bio_EN', e.target.value)}
                      rows={2} style={{ ...F, resize: 'vertical' }} />
                  </Field>
                  <Field label={`${t('therapistMgmt.bio')} AR`}>
                    <textarea value={form.Bio_AR || ''} onChange={(e) => set('Bio_AR', e.target.value)}
                      rows={2} style={{ ...F, resize: 'vertical' }} />
                  </Field>
                  <Field label={t('therapistMgmt.specialties')}>
                    <input value={form.Specialties || ''} onChange={(e) => set('Specialties', e.target.value)} style={F} />
                  </Field>
                  <Field label="Languages">
                    <input value={form.Languages || ''} onChange={(e) => set('Languages', e.target.value)} style={F} />
                  </Field>
                  <Switch isSelected={!!form.Active} onValueChange={(v) => set('Active', v)}>
                    <Label>{form.Active ? t('therapistMgmt.active') : t('therapistMgmt.inactive')}</Label>
                  </Switch>
                </div>
              </Tabs.Panel>

              {/* ── Schedule tab ── */}
              <Tabs.Panel id="schedule">
                <div style={PANEL}>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{t('sessions.type')}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {TYPES.map((tp) => (
                        <CheckPill key={tp} label={tp}
                          checked={(form.sessionTypes || []).includes(tp)}
                          onChange={() => toggleArr('sessionTypes', tp)} />
                      ))}
                    </div>
                  </div>
                  <Field label={t('therapistMgmt.modes')}>
                    <select value={form.Modes || 'Both'} onChange={(e) => set('Modes', e.target.value)} style={F}>
                      {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Field>
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{t('therapistMgmt.workingDays')}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {DAYS.map((d) => (
                        <CheckPill key={d} label={d}
                          checked={(form.workingDays || []).includes(d)}
                          onChange={() => toggleArr('workingDays', d)} />
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <Field label={t('therapistMgmt.startTime')}>
                      <input type="time" value={form.Start_Time || ''}
                        onChange={(e) => set('Start_Time', e.target.value)} style={F} />
                    </Field>
                    <Field label={t('therapistMgmt.endTime')}>
                      <input type="time" value={form.End_Time || ''}
                        onChange={(e) => set('End_Time', e.target.value)} style={F} />
                    </Field>
                    <Field label={t('therapistMgmt.duration')}>
                      <input type="number" value={String(form.Session_Duration_Min || 50)}
                        onChange={(e) => set('Session_Duration_Min', Number(e.target.value))} style={F} />
                    </Field>
                  </div>
                </div>
              </Tabs.Panel>

              {/* ── Fees tab ── */}
              <Tabs.Panel id="fees">
                <div style={PANEL}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {['Individual', 'Couples', 'Family', 'Group', 'Workshop'].map((type) => (
                      <Field key={type} label={`${type} (EGP)`}>
                        <input type="number" min="0"
                          value={String(form[`Fee_${type}`] || '')}
                          onChange={(e) => set(`Fee_${type}`, Number(e.target.value))}
                          style={F} />
                      </Field>
                    ))}
                    <Field label={t('therapistMgmt.revenueShare')}>
                      <input type="number" min="0" max="100"
                        value={String(form.Revenue_Share_Pct || '')}
                        onChange={(e) => set('Revenue_Share_Pct', Number(e.target.value))}
                        style={F} />
                    </Field>
                  </div>
                </div>
              </Tabs.Panel>

              {/* ── Block Date tab (edit only) ── */}
              {!isNew && (
                <Tabs.Panel id="block">
                  <div style={PANEL}>
                    <Field label={t('sessions.date')}>
                      <input type="date" value={block.date}
                        onChange={(e) => setB('date', e.target.value)} style={F} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <Field label={t('therapistMgmt.startTime')}>
                        <input type="time" value={block.timeStart}
                          onChange={(e) => setB('timeStart', e.target.value)} style={F} />
                      </Field>
                      <Field label={t('therapistMgmt.endTime')}>
                        <input type="time" value={block.timeEnd}
                          onChange={(e) => setB('timeEnd', e.target.value)} style={F} />
                      </Field>
                    </div>
                    <Field label={t('therapistMgmt.blockReason')}>
                      <input value={block.reason}
                        onChange={(e) => setB('reason', e.target.value)} style={F} />
                    </Field>
                    <Button color="warning" variant="flat" isDisabled={blockSaving || !block.date}
                      startContent={blockSaving ? <Spinner size="sm" /> : undefined}
                      onPress={handleBlock}>
                      {t('therapistMgmt.blockDate')}
                    </Button>
                  </div>
                </Tabs.Panel>
              )}
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
            <Button color="primary" isDisabled={saving || !form.Name_EN}
              startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleSave}>
              {isNew ? (t('general.save') || 'Save') : t('therapistMgmt.saveChanges')}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
