import { useState, useEffect, useCallback } from 'react';
import { APPS_SCRIPT_URL, ORIGIN } from '../config';

// Module-level variable so getIsOnline() works synchronously without a hook.
// Updated whenever the hook changes isOnline state.
let _isOnline = false;

export function getIsOnline() {
  return _isOnline;
}

async function ping() {
  if (!APPS_SCRIPT_URL) return false;
  try {
    const url =
      APPS_SCRIPT_URL +
      '?action=ping&origin=' +
      encodeURIComponent(ORIGIN) +
      '&t=' +
      Date.now();
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    return json.pong === true;
  } catch {
    return false;
  }
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(false);
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const setOnlineState = useCallback((online) => {
    _isOnline = online;
    setIsOnline(online);
    setStatus(online ? 'online' : 'offline');
    setLastChecked(new Date());
  }, []);

  const checkConnection = useCallback(async () => {
    const result = await ping();
    setOnlineState(result);
  }, [setOnlineState]);

  useEffect(() => {
    // Initial check
    setStatus('checking');
    checkConnection();

    // Re-ping immediately when browser reports online (may be wrong — confirm with ping)
    function handleOnline() {
      setStatus('checking');
      checkConnection();
    }

    // Trust offline events immediately — no point pinging with no network
    function handleOffline() {
      _isOnline = false;
      setIsOnline(false);
      setStatus('offline');
      setLastChecked(new Date());
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keep-alive ping every 60 seconds (low Apps Script quota cost)
    const interval = setInterval(checkConnection, 60_000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkConnection]);

  return { isOnline, status, lastChecked };
}
