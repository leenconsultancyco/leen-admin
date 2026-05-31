import { Link, useLocation } from 'react-router-dom';
import { Button } from '@heroui/react';
import {
  LayoutDashboard, CalendarDays, ArrowLeftRight,
  Receipt, CreditCard, UserRound, Users, BarChart3, Settings, LogOut,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { logout, getAdminUsername } from '../auth';
import LanguageToggle from './LanguageToggle';
import ConnectionBadge from './ConnectionBadge';

const NAV_ITEMS = [
  { key: 'dashboard',  path: '/dashboard',  Icon: LayoutDashboard },
  { key: 'sessions',   path: '/sessions',   Icon: CalendarDays    },
  { key: 'cashflow',   path: '/cashflow',   Icon: ArrowLeftRight  },
  { key: 'expenses',   path: '/expenses',   Icon: Receipt         },
  { key: 'payouts',    path: '/payouts',    Icon: CreditCard      },
  { key: 'therapists', path: '/therapists', Icon: UserRound       },
  { key: 'clients',    path: '/clients',    Icon: Users           },
  { key: 'reports',    path: '/reports',    Icon: BarChart3       },
  { key: 'settings',   path: '/settings',   Icon: Settings        },
];

const SIDEBAR_BG     = 'var(--sidebar-bg)';
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)';

export default function Sidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const username = getAdminUsername();

  return (
    <aside
      className="hidden md:flex flex-col fixed inset-y-0 start-0 w-[240px] z-20"
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
        {NAV_ITEMS.map(({ key, path, Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={key}
              to={path}
              className={`leen-nav-item${active ? ' leen-nav-active' : ''}`}
            >
              <Icon size={17} strokeWidth={1.6} style={{ flexShrink: 0 }} />
              <span>{t(`nav.${key}`)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '12px', borderTop: `1px solid ${SIDEBAR_BORDER}`, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <ConnectionBadge />
        <LanguageToggle className="text-white" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {username}
          </span>
          <Button
            size="sm"
            variant="flat"
            onPress={logout}
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', minWidth: 'unset' }}
          >
            <LogOut size={14} strokeWidth={1.8} />
            <span className="ms-1">{t('nav.logout')}</span>
          </Button>
        </div>
      </div>
    </aside>
  );
}
