import { useState, useMemo } from 'react';
import { Spinner } from '@heroui/react';
import { markPayoutPaid } from '../api';
import { toast } from './Toast';
import { useI18n } from '../i18n';

const fmt = (n) => `${Number(n || 0).toLocaleString('en-EG')} EGP`;

const CARD_STYLE = {
  background: '#fff',
  border: '1px solid #E6EAF1',
  borderRadius: 22,
  boxShadow: '0 1px 2px rgba(11,19,32,.04), 0 1px 3px rgba(11,19,32,.04)',
  padding: 20,
};

function PayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export default function PayoutCard({ payout, month, year, onDone }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [payingIdx, setPayingIdx] = useState(null);

  const pending   = Number(payout.pending    || 0);
  const totalPaid = Number(payout.totalPaid  || 0);
  const earned    = Number(payout.totalEarned || 0);
  const sharesPct = payout.revenueSharePct ?? payout.revenue_share_pct ?? '';

  // Oldest-first so cumulative settlement is FIFO-consistent
  const sortedSessions = useMemo(() =>
    [...(payout.sessions || [])].sort((a, b) =>
      String(a.Session_Date).localeCompare(String(b.Session_Date))
    ),
  [payout.sessions]);

  // Mark sessions as settled based on cumulative running total vs totalPaid
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
    toast(t('payouts.markPaid'));
    onDone();
  }

  return (
    <div className="leen-card" style={CARD_STYLE}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

        {/* Identity */}
        <div style={{ minWidth: 0, flex: '0 0 auto', width: 200 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0B1320', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {payout.therapistName}
          </p>
          <p style={{ fontSize: 12, color: '#5A6478', margin: '3px 0 0' }}>
            <span dir="ltr" style={{ unicodeBidi: 'embed', display: 'inline-block' }}>{sortedSessions.length}</span>
            {' '}{t('payouts.sessions')}
            {sharesPct !== '' && (
              <> · {t('payouts.share')} <span dir="ltr" style={{ unicodeBidi: 'embed', display: 'inline-block' }}>{sharesPct}%</span></>
            )}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, flex: 1, minWidth: 260 }}>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.03em', fontWeight: 600 }}>
              {t('payouts.totalEarned')}
            </p>
            <p dir="ltr" style={{ fontSize: 18, fontWeight: 700, color: '#0B1320', margin: 0, unicodeBidi: 'embed' }}>
              {fmt(earned)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.03em', fontWeight: 600 }}>
              {t('payouts.totalPaid')}
            </p>
            <p dir="ltr" style={{ fontSize: 18, fontWeight: 700, color: '#8089A0', margin: 0, unicodeBidi: 'embed' }}>
              {fmt(totalPaid)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#5A6478', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '.03em', fontWeight: 600 }}>
              {t('payouts.pending')}
            </p>
            <p dir="ltr" style={{ fontSize: 18, fontWeight: 700, color: pending > 0 ? '#E69013' : '#16A567', margin: 0, unicodeBidi: 'embed' }}>
              {fmt(pending)}
            </p>
          </div>
        </div>

        {/* Actions column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'stretch', flexShrink: 0 }}>
          {pending === 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#E6F6EE',
              color: '#0a6e3f',
              borderRadius: 999,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              ✓ {t('payouts.settled')}
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2A3344',
              borderRadius: 10,
              padding: '4px 8px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#EEF1F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {expanded ? t('payouts.hideSessions') : t('payouts.seeSessions')}
          </button>
        </div>
      </div>

      {/* Expanded session table */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #E6EAF1' }}>
          {sortedSessions.length === 0 ? (
            <p style={{ fontSize: 12, color: '#8089A0', textAlign: 'center', margin: 0 }}>{t('general.noResults')}</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#FAFBFD', borderBottom: '1px solid #E6EAF1' }}>
                  {[t('payouts.colDate'), t('payouts.colClient'), t('payouts.colType'), t('payouts.colFee'), t('payouts.colShare'), ''].map((col, i) => (
                    <th key={i} style={{
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#5A6478',
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                      textAlign: i >= 3 && i < 5 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessionStates.map(({ session: s, settled }, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < sessionStates.length - 1 ? '1px solid #E6EAF1' : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F7F8FB'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '10px 10px', color: '#2A3344', whiteSpace: 'nowrap' }}>{s.Session_Date}</td>
                    <td style={{ padding: '10px 10px', color: '#2A3344' }}>{s.Client_Name || '—'}</td>
                    <td style={{ padding: '10px 10px', color: '#2A3344' }}>{s.Session_Type}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                      <span dir="ltr" style={{ color: '#0B1320', unicodeBidi: 'embed', display: 'inline-block' }}>{fmt(s.Fee)}</span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                      <span dir="ltr" style={{ fontWeight: 600, color: settled ? '#16A567' : '#E69013', unicodeBidi: 'embed', display: 'inline-block' }}>
                        {fmt(s.Revenue_Therapist)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'center', width: 40 }}>
                      {settled ? (
                        <span style={{ color: '#16A567', fontSize: 14, fontWeight: 700 }}>✓</span>
                      ) : (
                        <button
                          type="button"
                          title={t('payouts.markPaid')}
                          disabled={payingIdx !== null}
                          onClick={() => handlePaySession(s, i)}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: 'none',
                            background: payingIdx === i ? '#0A6E51' : '#0E9B73',
                            color: '#fff',
                            cursor: payingIdx !== null ? 'not-allowed' : 'pointer',
                            opacity: payingIdx !== null && payingIdx !== i ? 0.45 : 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {payingIdx === i ? <Spinner size="sm" /> : <PayIcon />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
