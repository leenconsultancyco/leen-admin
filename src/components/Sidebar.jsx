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

const SIDEBAR_BG     = 'var(--sidebar-bg)';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';

export default function Sidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const username = getAdminUsername();

  return (
    <aside
      className="hidden md:flex flex-col fixed inset-y-0 start-0 w-[220px] z-20"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      {/* Logo */}
      <div style={{ padding: '20px', borderBottom: `1px solid ${SIDEBAR_BORDER}` }}>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: 0 }}>ليـن</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>
          Leen Psychotherapy Center
        </p>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {NAV_ITEMS.map(({ key, path, icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={key}
              to={path}
              className={`leen-nav-item${active ? ' leen-nav-active' : ''}`}
            >
              <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }}>{icon}</span>
              <span>{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '12px', borderTop: `1px solid ${SIDEBAR_BORDER}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ConnectionBadge />
        <LanguageToggle className="text-white" />
        <div className="group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {username}
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button size="sm" variant="ghost" color="danger" onPress={logout}>
              {t('nav.logout')}
            </Button>
          </span>
        </div>
      </div>
    </aside>
  );
}
