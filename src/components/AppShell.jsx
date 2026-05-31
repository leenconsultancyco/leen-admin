import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import ToastContainer from './Toast';
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
    <div className="min-h-screen bg-transparent relative">
      {/* Background image — 85% transparent */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `url(${import.meta.env.BASE_URL}BCKGRND.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top bar */}
      <TopBar title={title} pendingCount={pendingCount} />

      {/* Main content */}
      <main className="md:ms-[220px] pt-14 pb-20 md:pt-0 md:pb-0 px-4 md:px-8 py-4 md:py-7">
        {/* Page title ribbon */}
        {title && (
          <div
            className="-mx-4 md:-mx-8 -mt-4 md:mt-0 mb-5 md:mb-7 border-b"
            style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
          >
            <h1
              className="px-4 md:px-8 py-4 md:py-6 text-xl md:text-2xl font-bold"
              style={{ color: 'var(--header-text)' }}
            >
              {title}
            </h1>
          </div>
        )}
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      <ToastContainer />
    </div>
  );
}
