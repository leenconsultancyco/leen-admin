import { Link, useLocation } from 'react-router-dom';
import { Button, Drawer } from '@heroui/react';
import { useI18n } from '../i18n';
import { logout } from '../auth';

const PRIMARY_TABS = [
  { key: 'dashboard', path: '/dashboard', icon: '🏠' },
  { key: 'sessions',  path: '/sessions',  icon: '📅' },
  { key: 'cashflow',  path: '/cashflow',  icon: '💰' },
  { key: 'expenses',  path: '/expenses',  icon: '📋' },
];

const MORE_ITEMS = [
  { key: 'payouts',    path: '/payouts',    icon: '💳' },
  { key: 'therapists', path: '/therapists', icon: '👩‍⚕️' },
  { key: 'clients',    path: '/clients',    icon: '👥' },
  { key: 'reports',    path: '/reports',    icon: '📊' },
  { key: 'settings',   path: '/settings',   icon: '⚙️' },
];

function TabLink({ icon, label, active, path }) {
  return (
    <Link
      to={path}
      className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 text-xs transition-colors
        ${active ? 'text-primary font-semibold' : 'text-default-400'}`}
    >
      <span className="text-xl leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const { t } = useI18n();
  const location = useLocation();
  const moreActive = MORE_ITEMS.some((item) => location.pathname === item.path);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-default-200 flex z-20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {PRIMARY_TABS.map(({ key, path, icon }) => (
        <TabLink key={key} path={path} icon={icon} label={t(`nav.${key}`)} active={location.pathname === path} />
      ))}

      {/* More drawer trigger */}
      <Drawer>
        <Drawer.Trigger>
          <button
            type="button"
            className={`flex flex-col items-center gap-0.5 px-2 py-2 flex-1 text-xs transition-colors
              ${moreActive ? 'text-primary font-semibold' : 'text-default-400'}`}
          >
            <span className="text-xl leading-none">••••</span>
            <span>{t('general.more')}</span>
          </button>
        </Drawer.Trigger>
        <Drawer.Backdrop>
          <Drawer.Container>
            <Drawer.Content>
              <Drawer.Header>{t('general.more')}</Drawer.Header>
              <Drawer.Body>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {MORE_ITEMS.map(({ key, path, icon }) => (
                    <Link
                      key={key}
                      to={path}
                      className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm transition-colors
                        ${location.pathname === path ? 'bg-primary/10 text-primary font-semibold' : 'bg-default-100 text-default-600'}`}
                    >
                      <span className="text-2xl leading-none">{icon}</span>
                      <span>{t(`nav.${key}`)}</span>
                    </Link>
                  ))}
                </div>
              </Drawer.Body>
              <Drawer.Footer>
                <Button color="danger" variant="flat" fullWidth onPress={logout}>
                  {t('nav.logout')}
                </Button>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Container>
        </Drawer.Backdrop>
      </Drawer>
    </nav>
  );
}
