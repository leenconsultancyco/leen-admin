import { Link, useLocation } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useI18n } from '../i18n';
import { logout, getAdminUsername } from '../auth';
import LanguageToggle from './LanguageToggle';
import ConnectionBadge from './ConnectionBadge';

const NAV_ITEMS = [
  { key: 'dashboard',  path: '/dashboard',  icon: '🏠' },
  { key: 'sessions',   path: '/sessions',   icon: '📅' },
  { key: 'cashflow',   path: '/cashflow',   icon: '💰' },
  { key: 'expenses',   path: '/expenses',   icon: '📋' },
  { key: 'payouts',    path: '/payouts',    icon: '💳' },
  { key: 'therapists', path: '/therapists', icon: '👩‍⚕️' },
  { key: 'clients',    path: '/clients',    icon: '👥' },
  { key: 'reports',    path: '/reports',    icon: '📊' },
  { key: 'settings',   path: '/settings',   icon: '⚙️' },
];

export default function Sidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const username = getAdminUsername();

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 start-0 w-[220px] bg-white border-e border-default-200 z-20">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-default-200">
        <p className="text-xl font-bold text-primary">ليـن</p>
        <p className="text-xs text-default-400 mt-0.5">Leen Psychotherapy Center</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_ITEMS.map(({ key, path, icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={key}
              to={path}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-default-600 hover:bg-default-100',
              ].join(' ')}
            >
              <span className="text-base leading-none">{icon}</span>
              <span>{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-default-200 flex flex-col gap-3">
        <ConnectionBadge />

        <LanguageToggle />

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-default-400 truncate">{username}</span>
          <Button
            size="sm"
            variant="ghost"
            color="danger"
            onPress={logout}
          >
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </aside>
  );
}
