import { Card, Button, Chip } from '@heroui/react';
import { useI18n } from '../i18n';

// ── Inline icons ──────────────────────────────────────────────────────────────
function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function MoneyIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-default-400">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-xs text-default-700 leading-relaxed">{value || '—'}</span>
    </div>
  );
}

export default function TherapistCard({ therapist: th, onEdit, onToggleActive, onBlockDate }) {
  const { t } = useI18n();

  const specialties = (th.Specialties || '').split(',').map((s) => s.trim()).filter(Boolean);
  const days        = (th.Working_Days || '').split(',').map((d) => d.trim()).filter(Boolean);

  const fees = [
    th.Fee_Individual && `Ind ${Number(th.Fee_Individual).toLocaleString('en-EG')}`,
    th.Fee_Couples    && `Cou ${Number(th.Fee_Couples).toLocaleString('en-EG')}`,
    th.Fee_Family     && `Fam ${Number(th.Fee_Family).toLocaleString('en-EG')}`,
    th.Fee_Group      && `Gro ${Number(th.Fee_Group).toLocaleString('en-EG')}`,
    th.Fee_Workshop   && `Wor ${Number(th.Fee_Workshop).toLocaleString('en-EG')}`,
  ].filter(Boolean);

  const expYears = th.Joined_Date
    ? Math.floor((Date.now() - new Date(th.Joined_Date)) / (365.25 * 24 * 3600 * 1000))
    : null;

  const sessionInfo = [
    th.Session_Duration_Min ? `${th.Session_Duration_Min} min` : null,
    (th.Start_Time && th.End_Time) ? `${th.Start_Time}–${th.End_Time}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Card className="leen-card" style={{ opacity: th.Active ? 1 : 0.65 }}>
      <Card.Content className="p-5 flex flex-col gap-3">

        {/* Header — name / status / edit */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-default-800 text-[15px]">{th.Name_EN}</span>
              <Chip size="sm" color={th.Active ? 'success' : 'default'} variant="flat">
                {th.Active ? (t('therapistMgmt.active') || 'Active') : (t('therapistMgmt.inactive') || 'Inactive')}
              </Chip>
            </div>
            <p className="text-xs text-primary-600 mt-0.5">{th.Title_EN}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="bordered" onPress={() => onEdit(th)}>
              {t('general.edit')}
            </Button>
            <button
              onClick={() => onToggleActive(th)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                th.Active
                  ? 'border-danger-300 text-danger hover:bg-danger hover:text-white'
                  : 'border-primary-300 text-primary hover:bg-primary hover:text-white'
              }`}
            >
              {th.Active
                ? (t('therapistMgmt.deactivate') || 'Deactivate')
                : (t('therapistMgmt.reactivate') || 'Reactivate')}
            </button>
          </div>
        </div>

        {/* Specialties — large word-cloud style */}
        {specialties.length > 0 && (
          <p className="text-[15px] font-semibold text-default-800 leading-snug">
            {specialties.join('  ')}
          </p>
        )}

        {/* Info 2×2 grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow icon={<ClockIcon />}    label="Session"      value={sessionInfo} />
          <InfoRow icon={<GlobeIcon />}    label="Languages"    value={th.Languages} />
          <InfoRow icon={<CalendarIcon />} label="Working Days" value={days.join(' · ')} />
          <InfoRow icon={<MoneyIcon />}    label="Fees"         value={fees.join(' · ')} />
        </div>

        {/* Footer */}
        <div className="border-t border-default-100 pt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-default-500 flex-wrap">
            <span>Revenue share</span>
            <strong className="text-default-800 ms-0.5">{th.Revenue_Share_Pct}%</strong>
            {expYears !== null && expYears >= 0 && (
              <>
                <span className="mx-1.5 text-default-300">·</span>
                <span>Experience</span>
                <strong className="text-default-800 ms-0.5">{expYears} yrs</strong>
              </>
            )}
          </div>
          <button
            onClick={() => onBlockDate(th)}
            className="text-xs text-default-400 hover:text-primary font-medium cursor-pointer transition-colors"
          >
            Block date
          </button>
        </div>

      </Card.Content>
    </Card>
  );
}
