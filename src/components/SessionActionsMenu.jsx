import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, Spinner } from '@heroui/react';
import { confirmBooking, cancelBooking, markPaid, addTransaction } from '../api';
import { toast } from './Toast';
import { getIsOnline } from '../hooks/useOnlineStatus';
import { useI18n } from '../i18n';
import ConfirmModal from './ConfirmModal';

const PAY_METHODS = ['Cash', 'Bank transfer'];

function MenuItem({ children, onClick, disabled, variant = 'default' }) {
  const [hovered, setHovered] = useState(false);
  const colors = {
    default: { text: '#374151', hover: '#f9fafb' },
    success: { text: '#16a34a', hover: '#f0fdf4' },
    danger:  { text: '#ef4444', hover: '#fef2f2' },
  };
  const c = colors[variant] || colors.default;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '9px 14px', fontSize: '13px', border: 'none',
        background: hovered ? c.hover : 'transparent',
        color: c.text, cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: '6px', opacity: disabled ? 0.45 : 1,
        transition: 'background 0.1s',
      }}
    >
      {children}
    </button>
  );
}

export default function SessionActionsMenu({ booking, onDone, onEdit, onDelete }) {
  const { t } = useI18n();
  const online     = getIsOnline();
  const btnRef     = useRef(null);
  const dropRef    = useRef(null);

  const [open, setOpen]           = useState(false);
  const [step, setStep]           = useState('menu');
  const [payMethod, setPayMethod] = useState('Cash');
  const [busy, setBusy]           = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [dropPos, setDropPos]     = useState({ top: 0, right: 0, openUp: false });

  const isPending   = booking.Status === 'Pending';
  const isConfirmed = booking.Status === 'Confirmed';
  const isUnpaid    = booking.Payment_Status === 'Unpaid';
  const hasWorkflow = isPending || isConfirmed;

  function handleToggle() {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      setDropPos({
        right:  window.innerWidth - r.right,
        top:    r.bottom + 4,
        bottom: window.innerHeight - r.top + 4,
        openUp: spaceBelow < 240,
      });
    }
    setOpen((o) => !o);
    setStep('menu');
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      const inBtn  = btnRef.current?.contains(e.target);
      const inDrop = dropRef.current?.contains(e.target);
      if (!inBtn && !inDrop) { setOpen(false); setStep('menu'); }
    }
    document.addEventListener('mousedown', handleOutside, true);
    return () => document.removeEventListener('mousedown', handleOutside, true);
  }, [open]);

  async function run(fn, message = 'Done') {
    setBusy(true);
    setOpen(false);
    setStep('menu');
    await fn();
    setBusy(false);
    toast(message);
    onDone();
  }

  function close() { setOpen(false); setStep('menu'); }

  const dropStyle = {
    position: 'fixed',
    right: dropPos.right,
    zIndex: 9999,
    backgroundColor: '#fff', border: '1px solid #e5e7eb',
    borderRadius: '10px', boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
    minWidth: '175px', overflow: 'hidden', padding: '4px',
    ...(dropPos.openUp
      ? { bottom: dropPos.bottom, top: 'auto' }
      : { top: dropPos.top, bottom: 'auto' }),
  };

  return (
    <>
      <div style={{ display: 'inline-block' }}>
        <div ref={btnRef}>
          <Button
            size="sm"
            variant="flat"
            isDisabled={busy}
            startContent={busy ? <Spinner size="sm" /> : undefined}
            onPress={handleToggle}
          >
            {t('sessions.actions') || 'Actions'} ▾
          </Button>
        </div>
      </div>

      {open && createPortal(
        <div ref={dropRef} style={dropStyle}>

            {step === 'menu' && (
              <>
                {isPending && (
                  <MenuItem variant="success" disabled={!online}
                    onClick={() => run(() => confirmBooking(booking.Booking_ID), 'Session confirmed')}>
                    ✅ {t('dashboard.confirm')}
                  </MenuItem>
                )}
                {isConfirmed && isUnpaid && (
                  <MenuItem variant="success" disabled={!online}
                    onClick={() => setStep('payMethod')}>
                    💳 {t('sessions.markPaid')}
                  </MenuItem>
                )}
                {(isPending || isConfirmed) && (
                  <MenuItem variant="danger" disabled={!online}
                    onClick={() => { close(); setCancelOpen(true); }}>
                    ✕ {t('dashboard.cancel')}
                  </MenuItem>
                )}

                {hasWorkflow && (
                  <div style={{ height: '1px', backgroundColor: '#f3f4f6', margin: '4px 0' }} />
                )}

                <MenuItem onClick={() => { close(); onEdit(); }}>
                  ✏️ {t('general.edit')}
                </MenuItem>
                <MenuItem variant="danger" onClick={() => { close(); onDelete(); }}>
                  🗑️ {t('general.delete')}
                </MenuItem>
              </>
            )}

            {step === 'payMethod' && (
              <div style={{ padding: '10px 12px' }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  {t('sessions.paymentMethod')}
                </p>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  style={{
                    width: '100%', padding: '6px 10px', borderRadius: '6px',
                    border: '1.5px solid #d1d5db', fontSize: '13px',
                    marginBottom: '10px', boxSizing: 'border-box',
                  }}
                >
                  {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={() => setStep('menu')}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', borderRadius: '6px',
                      border: '1.5px solid #d1d5db', background: '#fff', cursor: 'pointer', color: '#6b7280' }}>
                    {t('general.cancel')}
                  </button>
                  <button type="button" disabled={!online}
                    onClick={() => run(async () => {
                      await markPaid(booking.Booking_ID, payMethod);
                      await addTransaction({
                        date: booking.Session_Date,
                        description: `Session — ${booking.Client_Name} with ${booking.Therapist_Name}`,
                        category: 'Revenue',
                        cashIn: Number(booking.Fee),
                        method: payMethod,
                        bookingId: booking.Booking_ID,
                        idempotencyKey: `txn-paid-${booking.Booking_ID}`,
                      });
                    }, 'Payment recorded')}
                    style={{ flex: 1, padding: '6px', fontSize: '12px', fontWeight: '600',
                      borderRadius: '6px', border: 'none', background: '#0E9B73',
                      color: '#fff', cursor: 'pointer' }}>
                    {t('general.confirm')}
                  </button>
                </div>
              </div>
            )}
        </div>,
        document.body
      )}

      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => run(() => cancelBooking(booking.Booking_ID, ''), 'Session cancelled')}
        title={t('sessions.cancel')}
        message={`${t('sessions.cancel')} — ${booking.Client_Name}?`}
      />
    </>
  );
}
