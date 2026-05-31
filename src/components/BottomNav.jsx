import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@heroui/react';
import {
  LayoutDashboard, CalendarDays, ArrowLeftRight, Receipt,
  CreditCard, UserRound, Users, BarChart3, Settings, MoreHorizontal,
} from 'lucide-react';
import { useI18n } from '../i18n';
import { logout } from '../auth';

const PRIMARY_TABS = [
  { key: 'dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { key: 'sessions',  path: '/sessions',  Icon: CalendarDays    },
  { key: 'cashflow',  path: '/cashflow',  Icon: ArrowLeftRight  },
  { key: 'expenses',  path: '/expenses',  Icon: Receipt         },
];

const MORE_ITEMS = [
  { key: 'payouts',    path: '/payouts',    Icon: CreditCard  },
  { key: 'therapists', path: '/therapists', Icon: UserRound   },
  { key: 'clients',    path: '/clients',    Icon: Users       },
  { key: 'reports',    path: '/reports',    Icon: BarChart3   },
  { key: 'settings',   path: '/settings',  Icon: Settings    },
];

function TabLink({ Icon, label, active, path }) {
  return (
    <Link
      to={path}
      className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 text-xs transition-colors
        ${active ? 'text-primary font-semibold' : 'text-default-400'}`}
    >
      <Icon size={20} strokeWidth={1.6} />
      <span>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-default-200 flex z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_TABS.map(({ key, path, Icon }) => (
          <TabLink key={key} path={path} Icon={Icon} label={t(`nav.${key}`)} active={location.pathname === path} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 text-xs transition-colors
            ${moreActive ? 'text-primary font-semibold' : 'text-default-400'}`}
        >
          <MoreHorizontal size={20} strokeWidth={1.6} />
          <span>{t('general.more')}</span>
        </button>
      </nav>

      {/* More overlay */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl px-4 pt-4 pb-8 shadow-xl">
            <div className="w-10 h-1 bg-default-200 rounded-full mx-auto mb-4" />
            <p className="text-sm font-semibold text-default-500 mb-3">{t('general.more')}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {MORE_ITEMS.map(({ key, path, Icon }) => (
                <Link
                  key={key}
                  to={path}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm transition-colors
                    ${location.pathname === path ? 'bg-primary/10 text-primary font-semibold' : 'bg-default-100 text-default-600'}`}
                >
                  <Icon size={22} strokeWidth={1.6} />
                  <span>{t(`nav.${key}`)}</span>
                </Link>
              ))}
            </div>
            <Button color="danger" variant="flat" fullWidth onPress={logout}>
              {t('nav.logout')}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
