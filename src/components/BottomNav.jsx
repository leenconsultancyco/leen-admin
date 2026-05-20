import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal, ModalContent, ModalBody, Button } from '@heroui/react';
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

function TabButton({ icon, label, active, onClick, to }) {
  const cls = [
    'flex flex-col items-center gap-0.5 px-2 py-2 flex-1 text-xs transition-colors',
    active ? 'text-primary font-semibold' : 'text-default-400',
  ].join(' ');

  if (to) {
    return (
      <Link to={to} className={cls}>
        <span className="text-xl leading-none">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <span className="text-xl leading-none">{icon}</span>
      <span>{label}</span>
    </button>
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
        {PRIMARY_TABS.map(({ key, path, icon }) => (
          <TabButton
            key={key}
            to={path}
            icon={icon}
            label={t(`nav.${key}`)}
            active={location.pathname === path}
          />
        ))}
        <TabButton
          icon="••••"
          label={t('general.more') || 'More'}
          active={moreActive}
          onClick={() => setMoreOpen(true)}
        />
      </nav>

      {/* More sheet */}
      <Modal
        isOpen={moreOpen}
        onClose={() => setMoreOpen(false)}
        placement="bottom"
        hideCloseButton={false}
        classNames={{ base: 'rounded-t-2xl rounded-b-none m-0 max-w-full' }}
      >
        <ModalContent>
          <ModalBody className="py-4 px-4">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {MORE_ITEMS.map(({ key, path, icon }) => (
                <Link
                  key={key}
                  to={path}
                  onClick={() => setMoreOpen(false)}
                  className={[
                    'flex flex-col items-center gap-1 py-3 rounded-xl text-sm transition-colors',
                    location.pathname === path
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'bg-default-100 text-default-600',
                  ].join(' ')}
                >
                  <span className="text-2xl leading-none">{icon}</span>
                  <span>{t(`nav.${key}`)}</span>
                </Link>
              ))}
            </div>
            <Button
              color="danger"
              variant="flat"
              fullWidth
              onPress={() => { setMoreOpen(false); logout(); }}
            >
              {t('nav.logout')}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
