import { useState, useEffect, useRef } from 'react';
import { Chip, Spinner } from '@heroui/react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncQueue, getQueueCount } from '../offlineQueue';
import { rawPost } from '../api';
import { useI18n } from '../i18n';

// Compact mode: small dot only (used in TopBar)
function Dot({ color }) {
  const colors = {
    success: 'bg-success',
    danger:  'bg-danger',
    warning: 'bg-warning',
    primary: 'bg-primary',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[color] || 'bg-default'}`} />
  );
}

export default function ConnectionBadge({ compact = false }) {
  const { isOnline, status } = useOnlineStatus();
  const { t } = useI18n();
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState(null); // { text, color }
  const prevOnline = useRef(isOnline);
  const [queueCount, setQueueCount] = useState(getQueueCount());

  // Refresh queue count whenever connection state changes
  useEffect(() => {
    setQueueCount(getQueueCount());
  }, [isOnline, syncing]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!prevOnline.current && isOnline) {
      runSync();
    }
    prevOnline.current = isOnline;
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  async function runSync() {
    if (getQueueCount() === 0) return;
    setSyncing(true);
    const { synced, failed } = await syncQueue(rawPost);
    setSyncing(false);
    setQueueCount(getQueueCount());

    if (synced > 0 && failed === 0) {
      showNotice(t('connection.syncDone').replace('{n}', synced), 'success');
    } else if (failed > 0) {
      showNotice(t('connection.syncFailed'), 'warning');
    }
  }

  function showNotice(text, color) {
    setNotice({ text, color });
    setTimeout(() => setNotice(null), 4000);
  }

  // Determine visual state
  let chipColor, label, showSpinner;

  if (syncing) {
    chipColor = 'primary';
    label = t('connection.syncing');
    showSpinner = true;
  } else if (status === 'checking') {
    chipColor = 'warning';
    label = t('connection.checking');
    showSpinner = true;
  } else if (!isOnline) {
    chipColor = 'danger';
    const countStr = queueCount > 0
      ? ` — ${t('connection.queued').replace('{n}', queueCount)}`
      : '';
    label = t('connection.offline') + countStr;
    showSpinner = false;
  } else {
    chipColor = 'success';
    label = t('connection.online');
    showSpinner = false;
  }

  if (compact) {
    return <Dot color={chipColor} />;
  }

  return (
    <div className="flex flex-col gap-1">
      {notice && (
        <Chip size="sm" color={notice.color} variant="flat" className="text-xs">
          {notice.text}
        </Chip>
      )}
      <Chip
        size="sm"
        color={chipColor}
        variant="flat"
        startContent={showSpinner ? <Spinner size="sm" color="current" /> : undefined}
        className="text-xs"
      >
        {label}
      </Chip>
    </div>
  );
}
