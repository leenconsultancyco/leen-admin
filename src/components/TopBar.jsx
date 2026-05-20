import { useI18n } from '../i18n';
import LanguageToggle from './LanguageToggle';
import ConnectionBadge from './ConnectionBadge';

export default function TopBar({ title, pendingCount = 0 }) {
  const { lang } = useI18n();

  return (
    <header className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-default-200 h-14 flex items-center px-4 gap-3">
      <span className="text-lg font-bold text-primary shrink-0">ليـن</span>

      <h1
        className="flex-1 text-center text-sm font-semibold text-default-700 truncate"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {title}
      </h1>

      <div className="flex items-center gap-2 shrink-0">
        <ConnectionBadge compact />
        <LanguageToggle />

        {/* Notification bell with plain CSS dot — Badge removed (not in v3 cheat sheet) */}
        <div className="relative">
          <button
            type="button"
            className="text-xl leading-none text-default-500 p-1"
            aria-label="Pending bookings"
          >
            🔔
          </button>
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] text-[10px] font-bold
              bg-danger text-white rounded-full flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
