import { useState } from 'react';
import { Card, Button, Separator, Spinner } from '@heroui/react';
import { updatePassword, updateSettings } from '../api';
import { hashPassword, getAdminUsername } from '../auth';
import { useI18n } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import ThemeSelector from '../components/ThemeSelector';
import BackupButton from '../components/BackupButton';

const BACKUP_KEY = 'leen_last_backup';
const URL_KEY    = 'leen_script_url';

const F = {
  display: 'block', width: '100%', borderWidth: '2px', borderStyle: 'solid',
  borderColor: '#9ca3af', borderRadius: '8px', padding: '10px 16px',
  backgroundColor: '#ffffff', color: '#111827', fontSize: '15px',
  marginBottom: '4px', boxSizing: 'border-box', outline: 'none',
};
const LBL = { display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' };

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function Section({ title, children }) {
  return (
    <Card className="leen-card">
      <Card.Content className="flex flex-col gap-4 p-5">
        <p className="text-base font-semibold text-default-800">{title}</p>
        <Separator />
        {children}
      </Card.Content>
    </Card>
  );
}

function Msg({ msg }) {
  if (!msg) return null;
  return (
    <p style={{ fontSize: '13px', color: msg.ok ? '#16a34a' : '#dc2626', margin: '4px 0' }}>
      {msg.ok ? '✓ ' : '✗ '}{msg.text}
    </p>
  );
}

export default function Settings() {
  const { t, lang } = useI18n();

  // ── Backend URL ──────────────────────────────────────────────
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem(URL_KEY) || '');
  const [editingUrl, setEditingUrl] = useState(!localStorage.getItem(URL_KEY));

  function saveUrl() {
    if (!scriptUrl.trim()) return;
    localStorage.setItem(URL_KEY, scriptUrl.trim());
    setEditingUrl(false);
    window.location.reload();
  }

  // ── Username ──────────────────────────────────────────────────
  const [newUsername, setNewUsername] = useState('');
  const [unSaving, setUnSaving]       = useState(false);
  const [unMsg, setUnMsg]             = useState(null);

  async function handleUsernameSave() {
    if (!newUsername.trim()) return;
    setUnSaving(true);
    const result = await updateSettings({ ADMIN_USERNAME: newUsername.trim() });
    setUnSaving(false);
    if (result.success) {
      setUnMsg({ text: t('settings.usernameChanged'), ok: true });
      setNewUsername('');
    } else {
      setUnMsg({ text: result.error || t('general.error'), ok: false });
    }
  }

  // ── Password ──────────────────────────────────────────────────
  const [pw, setPw]           = useState({ next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]     = useState(null);

  async function handlePasswordSave() {
    if (pw.next !== pw.confirm) { setPwMsg({ text: t('settings.passwordMismatch'), ok: false }); return; }
    if (!pw.next) return;
    setPwSaving(true);
    const newHash = await hashPassword(pw.next);
    const result  = await updatePassword(newHash);
    setPwSaving(false);
    if (result.success) {
      setPwMsg({ text: t('settings.passwordChanged'), ok: true });
      setPw({ next: '', confirm: '' });
    } else {
      setPwMsg({ text: result.error || t('general.error'), ok: false });
    }
  }

  // ── Backup ────────────────────────────────────────────────────
  const [lastBackup, setLastBackup] = useState(localStorage.getItem(BACKUP_KEY) || '');
  function handleBackupDone(date) { localStorage.setItem(BACKUP_KEY, date); setLastBackup(date); }
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

      {/* ── Backend URL ── */}
      <Section title={t('settings.backendUrl')}>
        {editingUrl ? (
          <div className="flex flex-col gap-2">
            <label style={LBL}>Apps Script URL</label>
            <input type="url" value={scriptUrl} onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..." style={F} />
            <Button color="primary" size="sm" onPress={saveUrl} isDisabled={!scriptUrl.trim()}>
              {lang === 'ar' ? 'حفظ والاتصال' : 'Save & Reconnect'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', color: '#16a34a' }}>✓ {lang === 'ar' ? 'تم الاتصال' : 'Backend connected'}</span>
            <Button size="sm" variant="light" onPress={() => setEditingUrl(true)}>{t('general.edit')}</Button>
          </div>
        )}
      </Section>

      {/* ── Change Username ── */}
      <Section title={t('settings.changeUsername')}>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          {lang === 'ar' ? 'المستخدم الحالي: ' : 'Current username: '}
          <strong>{getAdminUsername() || '—'}</strong>
        </p>
        <div>
          <label style={LBL}>{t('settings.newUsername')}</label>
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
            placeholder="new_username" style={F} />
        </div>
        <Msg msg={unMsg} />
        <Button color="primary" size="sm"
          isDisabled={unSaving || !newUsername.trim()}
          startContent={unSaving ? <Spinner size="sm" color="white" /> : undefined}
          onPress={handleUsernameSave}>
          {t('general.save')}
        </Button>
      </Section>

      {/* ── Change Password ── */}
      <Section title={t('settings.changePassword')}>
        <div>
          <label style={LBL}>{t('settings.newPassword')}</label>
          <input type="password" value={pw.next}
            onChange={(e) => setPw(p => ({ ...p, next: e.target.value }))} style={F} />
        </div>
        <div>
          <label style={LBL}>{t('settings.confirmPassword')}</label>
          <input type="password" value={pw.confirm}
            onChange={(e) => setPw(p => ({ ...p, confirm: e.target.value }))} style={F} />
          {pw.confirm && pw.next !== pw.confirm && (
            <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>{t('settings.passwordMismatch')}</p>
          )}
        </div>
        <Msg msg={pwMsg} />
        <Button color="primary" size="sm"
          isDisabled={pwSaving || !pw.next || pw.next !== pw.confirm}
          startContent={pwSaving ? <Spinner size="sm" color="white" /> : undefined}
          onPress={handlePasswordSave}>
          {t('general.save')}
        </Button>
      </Section>

      {/* ── Backup ── */}
      <Section title={t('settings.backup')}>
        <div style={{ fontSize: '13px', color: '#4b5563' }}>
          <span>{t('settings.lastBackup')}: </span>
          <span style={{ fontWeight: 600, color: stale || neverBacked ? '#dc2626' : '#16a34a' }}>
            {neverBacked ? t('settings.neverBacked') : lastBackup}
          </span>
        </div>
        {(stale || neverBacked) && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#713f12' }}>
            ⚠️ {t('dashboard.backupWarning')}
          </div>
        )}
        <BackupButton onBackupDone={handleBackupDone} />
        <p style={{ fontSize: '12px', color: '#a1a1aa' }}>
          {lang === 'ar' ? 'تشمل النسخة: المعاملات، المصروفات، الحجوزات، المستحقات.' : 'Includes: transactions, expenses, bookings, and payouts.'}
        </p>
      </Section>
    </div>
  );
}
