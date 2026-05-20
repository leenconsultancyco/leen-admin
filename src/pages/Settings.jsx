import { useState } from 'react';
import { Card, Input, Button, Divider, Spinner } from '@heroui/react';
import { updatePassword } from '../api';
import { hashPassword, getAdminUsername } from '../auth';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import ThemeSelector from '../components/ThemeSelector';
import BackupButton from '../components/BackupButton';

const BACKUP_KEY = 'leen_last_backup';
const URL_KEY    = 'leen_script_url';

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function Section({ title, children }) {
  return (
    <Card>
      <Card.Content className="flex flex-col gap-4 p-5">
        <p className="text-base font-semibold text-default-800">{title}</p>
        <Divider />
        {children}
      </Card.Content>
    </Card>
  );
}

export default function Settings() {
  const { t, lang } = useI18n();

  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem(URL_KEY) || '');
  const [editing, setEditing]     = useState(!localStorage.getItem(URL_KEY));

  function saveUrl() {
    if (!scriptUrl.trim()) return;
    localStorage.setItem(URL_KEY, scriptUrl.trim());
    setEditing(false);
    window.location.reload();
  }

  const [pw, setPw]         = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]   = useState(null);

  async function handlePasswordSave() {
    if (pw.next !== pw.confirm) { setPwMsg({ text: t('settings.passwordMismatch'), ok: false }); return; }
    if (!pw.next) return;
    setPwSaving(true);
    const newHash = await hashPassword(pw.next);
    const result  = await updatePassword(newHash);
    setPwSaving(false);
    if (result.success) {
      setPwMsg({ text: t('settings.passwordChanged'), ok: true });
      setPw({ current: '', next: '', confirm: '' });
    } else {
      setPwMsg({ text: result.error || t('general.error'), ok: false });
    }
  }

  const [lastBackup, setLastBackup] = useState(localStorage.getItem(BACKUP_KEY) || '');

  function handleBackupDone(date) {
    localStorage.setItem(BACKUP_KEY, date);
    setLastBackup(date);
  }

  const stale = daysSince(lastBackup) > 7;
  const neverBacked = !lastBackup;

  return (
    <div className="flex flex-col gap-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-default-500">{t('settings.chooseTheme')}</span>
          <ThemeSelector />
        </div>
        <LanguageToggle />
      </div>

      <Section title={lang === 'ar' ? 'رابط النظام' : 'Backend URL'}>
        {editing ? (
          <div className="flex flex-col gap-2">
            <Input type="password" label="Apps Script URL" value={scriptUrl}
              onValueChange={setScriptUrl} placeholder="https://script.google.com/macros/s/..." />
            <Button color="primary" size="sm" onPress={saveUrl} isDisabled={!scriptUrl.trim()}>
              {lang === 'ar' ? 'حفظ' : 'Save & Reconnect'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm text-success">✓ {lang === 'ar' ? 'تم الاتصال' : 'Backend connected'}</span>
            <Button size="sm" variant="light" onPress={() => setEditing(true)}>{t('general.edit')}</Button>
          </div>
        )}
      </Section>

      <Section title={t('settings.changePassword')}>
        <Input type="password" label={t('settings.currentPassword')} value={pw.current}
          onValueChange={(v) => setPw((p) => ({ ...p, current: v }))} />
        <Input type="password" label={t('settings.newPassword')} value={pw.next}
          onValueChange={(v) => setPw((p) => ({ ...p, next: v }))} />
        <Input type="password" label={t('settings.confirmPassword')} value={pw.confirm}
          onValueChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
          isInvalid={!!pw.confirm && pw.next !== pw.confirm}
          errorMessage={pw.confirm && pw.next !== pw.confirm ? t('settings.passwordMismatch') : ''} />
        {pwMsg && <p className={`text-sm ${pwMsg.ok ? 'text-success' : 'text-danger'}`}>{pwMsg.text}</p>}
        <Button color="primary" size="sm" isDisabled={pwSaving || !pw.next || pw.next !== pw.confirm}
          startContent={pwSaving ? <Spinner size="sm" color="white" /> : undefined}
          onPress={handlePasswordSave}>{t('general.save')}</Button>
      </Section>

      <Section title={t('settings.backup')}>
        <div className="text-sm text-default-600">
          <span>{t('settings.lastBackup')}: </span>
          <span className={stale || neverBacked ? 'text-danger font-medium' : 'text-success font-medium'}>
            {neverBacked ? t('settings.neverBacked') : lastBackup}
          </span>
        </div>
        {(stale || neverBacked) && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg px-3 py-2 text-sm text-warning-700">
            ⚠️ {t('dashboard.backupWarning')}
          </div>
        )}
        <BackupButton onBackupDone={handleBackupDone} />
        <p className="text-xs text-default-400">
          {lang === 'ar' ? 'تشمل النسخة: المعاملات، المصروفات، الحجوزات، المستحقات.' : 'Includes: transactions, expenses, bookings, and payouts.'}
        </p>
      </Section>

      <Section title={t('settings.centerInfo')}>
        <p className="text-sm text-default-600"><span className="text-default-400">Admin: </span>{getAdminUsername()}</p>
        <p className="text-xs text-default-400">
          {lang === 'ar' ? 'لتعديل معلومات المركز، عدّل قاعدة البيانات في Google Sheets مباشرةً.' : 'To change center info, edit the Settings tab in Google Sheets directly.'}
        </p>
      </Section>
    </div>
  );
}
