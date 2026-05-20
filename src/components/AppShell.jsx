import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { getDashboardData } from '../api';
import { getIsOnline } from '../hooks/useOnlineStatus';

async function fetchPendingCount() {
  if (!getIsOnline()) return null;
  const now = new Date();
  const result = await getDashboardData(now.getMonth() + 1, now.getFullYear());
  return result.success ? (result.data?.pendingCount ?? 0) : null;
}

export default function AppShell({ children, title = '', pendingCount: initialCount = 0 }) {
  const [pendingCount, setPendingCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const count = await fetchPendingCount();
      if (!cancelled && count !== null) setPendingCount(count);
    }

    poll();
    const interval = setInterval(poll, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-default-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <TopBar title={title} pendingCount={pendingCount} />

      {/* Main content */}
      <main
        className={[
          // Desktop: offset by sidebar width
          'md:ms-[220px]',
          // Mobile: offset by top bar + bottom nav
          'pt-14 pb-20 md:pt-0 md:pb-0',
          'p-4 md:p-6',
        ].join(' ')}
      >
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
