import { useState, useMemo } from 'react';
import { Card, Button, Chip, Separator, Spinner } from '@heroui/react';
import { markPayoutPaid } from '../api';
import { toast } from './Toast';
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
  const [payingIdx, setPayingIdx]   = useState(null);
  const [saving, setSaving]         = useState(false);

  const pending   = Number(payout.pending   || 0);
  const totalPaid = Number(payout.totalPaid || 0);

  // Sort oldest-first so cumulative settlement is FIFO-consistent
  const sortedSessions = useMemo(() =>
    [...(payout.sessions || [])].sort((a, b) =>
      String(a.Session_Date).localeCompare(String(b.Session_Date))
    ),
  [payout.sessions]);

  // Sessions where running cumulative ≤ totalPaid are already settled
  const sessionStates = useMemo(() => {
    let cum = 0;
    return sortedSessions.map((s) => {
      cum += Number(s.Revenue_Therapist || 0);
      return { session: s, settled: cum <= totalPaid };
    });
  }, [sortedSessions, totalPaid]);

  async function handlePaySession(session, idx) {
    setPayingIdx(idx);
    await markPayoutPaid(payout.therapistId, month, year, Number(session.Revenue_Therapist || 0));
    setPayingIdx(null);
    toast('Payout recorded');
    onDone();
  }

  async function handleSettleAll() {
    setSaving(true);
    await markPayoutPaid(payout.therapistId, month, year, pending);
    setSaving(false);
    toast('Payout settled');
    onDone();
  }

  return (
    <>
      <Card className={`leen-card ${pending > 0 ? 'border border-warning-200' : ''}`}>
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
              <p dir="ltr" className="font-semibold text-success">{fmt(totalPaid)}</p>
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

          {expanded && sortedSessions.length > 0 && (
            <>
              <Separator />
              <ul className="flex flex-col gap-1.5">
                {sessionStates.map(({ session: s, settled }, i) => (
                  <li key={i} className="flex justify-between items-center text-xs py-0.5">
                    <span className="text-default-600">
                      {s.Session_Date} · {s.Session_Type}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span dir="ltr" className={`font-medium ${settled ? 'text-success' : 'text-primary'}`}>
                        {fmt(s.Revenue_Therapist)}
                      </span>
                      {settled ? (
                        <span className="text-success font-bold text-xs w-10 text-center">✓ Paid</span>
                      ) : (
                        <button
                          type="button"
                          disabled={payingIdx !== null}
                          onClick={() => handlePaySession(s, i)}
                          style={{
                            width: '40px', fontSize: '11px', padding: '3px 0',
                            borderRadius: '5px', border: 'none',
                            background: payingIdx === i ? '#f59e0b' : '#d97706',
                            color: '#fff', cursor: payingIdx !== null ? 'not-allowed' : 'pointer',
                            opacity: payingIdx !== null && payingIdx !== i ? 0.5 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {payingIdx === i
                            ? <Spinner size="sm" color="white" />
                            : 'Pay'}
                        </button>
                      )}
                    </div>
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
        onConfirm={handleSettleAll}
        title={t('payouts.settlePayout')}
        message={`${t('payouts.settlePayout')}: ${payout.therapistName} — ${fmt(pending)}`}
        confirmColor="warning"
      />
    </>
  );
}
