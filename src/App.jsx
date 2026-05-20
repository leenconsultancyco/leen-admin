import { Navigate } from 'react-router-dom';
import { useI18n } from './i18n';
import AuthGuard from './components/AuthGuard';
import AppShell from './components/AppShell';

// Pages — lazy imports would be ideal at scale; direct imports are fine for now
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Sessions      from './pages/Sessions';
import CashFlow      from './pages/CashFlow';
import Expenses      from './pages/Expenses';
import Payouts       from './pages/Payouts';
import TherapistMgmt from './pages/TherapistMgmt';
import Clients       from './pages/Clients';
import Reports       from './pages/Reports';
import Settings      from './pages/Settings';

// Maps a short key to the i18n path used for the TopBar title
const TITLE_KEYS = {
  dashboard:     'nav.dashboard',
  sessions:      'nav.sessions',
  cashflow:      'nav.cashflow',
  expenses:      'nav.expenses',
  payouts:       'nav.payouts',
  therapistMgmt: 'nav.therapists',
  clients:       'nav.clients',
  reports:       'nav.reports',
  settings:      'nav.settings',
};

function ProtectedPage({ titleKey, children }) {
  const { t } = useI18n();
  return (
    <AuthGuard>
      <AppShell title={t(TITLE_KEYS[titleKey] || titleKey)}>
        {children}
      </AppShell>
    </AuthGuard>
  );
}

export const routes = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: <ProtectedPage titleKey="dashboard"><Dashboard /></ProtectedPage>,
  },
  {
    path: '/sessions',
    element: <ProtectedPage titleKey="sessions"><Sessions /></ProtectedPage>,
  },
  {
    path: '/cashflow',
    element: <ProtectedPage titleKey="cashflow"><CashFlow /></ProtectedPage>,
  },
  {
    path: '/expenses',
    element: <ProtectedPage titleKey="expenses"><Expenses /></ProtectedPage>,
  },
  {
    path: '/payouts',
    element: <ProtectedPage titleKey="payouts"><Payouts /></ProtectedPage>,
  },
  {
    path: '/therapists',
    element: <ProtectedPage titleKey="therapistMgmt"><TherapistMgmt /></ProtectedPage>,
  },
  {
    path: '/clients',
    element: <ProtectedPage titleKey="clients"><Clients /></ProtectedPage>,
  },
  {
    path: '/reports',
    element: <ProtectedPage titleKey="reports"><Reports /></ProtectedPage>,
  },
  {
    path: '/settings',
    element: <ProtectedPage titleKey="settings"><Settings /></ProtectedPage>,
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
];
