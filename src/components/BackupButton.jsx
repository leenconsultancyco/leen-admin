import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { backup, updateSettings } from '../api';
import { downloadJSON } from '../utils';
import { useI18n } from '../i18n';

export default function BackupButton({ onBackupDone }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice]   = useState(null); // { text, ok }

  function showNotice(text, ok) {
    setNotice({ text, ok });
    setTimeout(() => setNotice(null), 5000);
  }

  async function handleBackup() {
    setLoading(true);
    const result = await backup();
    setLoading(false);

    if (!result.success) {
      showNotice(result.error || t('general.error'), false);
      return;
    }

    const today    = new Date().toISOString().slice(0, 10);
    const filename = `leen-backup-${today}.json`;
    const payload  = {
      exportedAt:   new Date().toISOString(),
      center:       'Leen Psychotherapy Center',
      transactions: result.data?.transactions ?? [],
      expenses:     result.data?.expenses     ?? [],
      bookings:     result.data?.bookings     ?? [],
      payouts:      result.data?.payouts      ?? [],
    };

    downloadJSON(payload, filename);
    await updateSettings({ LAST_BACKUP_DATE: today });
    showNotice(`${t('settings.backupDownloaded')}: ${filename}`, true);
    onBackupDone?.(today);
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        color="primary"
        variant="flat"
        isDisabled={loading}
        startContent={loading ? <Spinner size="sm" /> : '💾'}
        onPress={handleBackup}
      >
        {loading ? t('general.loading') : t('settings.backupNow')}
      </Button>
      {notice && (
        <p className={`text-xs ${notice.ok ? 'text-success' : 'text-danger'}`}>
          {notice.text}
        </p>
      )}
    </div>
  );
}
