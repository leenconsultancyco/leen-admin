import { useState } from 'react';
import { Card, Button, Chip, Separator } from '@heroui/react';
import { markPayoutPaid } from '../api';
import { useI18n } from '../i18n';
import ConfirmModal from './ConfirmModal';

function Initials({ name }) {
  const letters = (name || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
      {letters}
    </div>
  );
}

const fmt = (n) => `${Number(n || 0).toLocaleString('en-EG')} EGP`;

export default function PayoutCard({ payout, month, year, onDone }) {
  const { t } = useI18n();
  const [expanded, setExpanded]     = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [saving, setSaving]         = useState(false);

  const pending = Number(payout.pending || 0);

  async function handleSettle() {
    setSaving(true);
    await markPayoutPaid(payout.therapistId, month, year, pending);
    setSaving(false);
    onDone();
  }

  return (
    <>
      <Card className={pending > 0 ? 'border border-warning-200' : ''}>
        <Card.Content className="gap-3 p-4">
          <div className="flex items-center gap-3">
            <Initials name={payout.therapistName} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-default-800 truncate">{payout.therapistName}</p>
              <p className="text-xs text-default-400">{payout.sessions?.length ?? 0} {t('payouts.sessions')}</p>
            </div>
            {pending > 0 && <Chip size="sm" color="warning" variant="flat">{t('payouts.pending')}</Chip>}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-default-50 rounded-lg px-2 py-1.5">
              <p className="text-default-400">{t('payouts.totalEarned')}</p>
              <p dir="ltr" className="font-semibold text-default-800">{fmt(payout.totalEarned)}</p>
            </div>
            <div className="bg-default-50 rounded-lg px-2 py-1.5">
              <p className="text-default-400">{t('payouts.totalPaid')}</p>
              <p dir="ltr" className="font-semibold text-success">{fmt(payout.totalPaid)}</p>
            </div>
            <div className={`rounded-lg px-2 py-1.5 ${pending > 0 ? 'bg-warning-50' : 'bg-default-50'}`}>
              <p className="text-default-400">{t('payouts.pending')}</p>
              <p dir="ltr" className={`font-semibold ${pending > 0 ? 'text-warning-700' : 'text-default-800'}`}>{fmt(pending)}</p>
            </div>
          </div>

          <div className="flex gap-2 justify-between items-center">
            <Button size="sm" variant="light" onPress={() => setExpanded((v) => !v)}>
              {expanded ? '▲' : '▼'} {t('payouts.payoutHistory')}
            </Button>
            {pending > 0 && (
              <Button size="sm" color="warning" variant="flat" isDisabled={saving}
                onPress={() => setSettleOpen(true)}>
                {t('payouts.settlePayout')}
              </Button>
            )}
          </div>

          {expanded && (payout.sessions?.length ?? 0) > 0 && (
            <>
              <Separator />
              <ul className="flex flex-col gap-1">
                {payout.sessions.map((s, i) => (
                  <li key={i} className="flex justify-between text-xs text-default-600 py-0.5">
                    <span>{s.Session_Date} · {s.Session_Type}</span>
                    <span dir="ltr" className="text-primary font-medium">{fmt(s.Revenue_Therapist)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card.Content>
      </Card>

      <ConfirmModal
        isOpen={settleOpen}
        onClose={() => setSettleOpen(false)}
        onConfirm={handleSettle}
        title={t('payouts.settlePayout')}
        message={`${t('payouts.settlePayout')}: ${payout.therapistName} — ${fmt(pending)}`}
        confirmColor="warning"
      />
    </>
  );
}
