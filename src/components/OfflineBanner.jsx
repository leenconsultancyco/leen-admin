import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useI18n } from '../i18n';

export default function OfflineBanner() {
  const { isOnline, status } = useOnlineStatus();
  const { t } = useI18n();

  if (isOnline || status === 'checking') return null;

  return (
    <div className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-2.5 text-sm text-danger-700 flex items-center gap-2">
      <span>🔴</span>
      <span>{t('connection.offline')} — {t('connection.offlineNote')}</span>
    </div>
  );
}
