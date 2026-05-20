import { useState } from 'react';
import { Button, Label, ListBox, Popover, Select, Spinner } from '@heroui/react';
import { confirmBooking, cancelBooking, markPaid } from '../api';
import { getIsOnline } from '../hooks/useOnlineStatus';
import { useI18n } from '../i18n';
import ConfirmModal from './ConfirmModal';

const PAYMENT_METHODS = ['Cash', 'Bank transfer'];

export default function SessionActions({ booking, onDone }) {
  const { t } = useI18n();
  const online = getIsOnline();
  const [busy, setBusy]             = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payMethod, setPayMethod]   = useState('Cash');

  const isPending   = booking.Status === 'Pending';
  const isConfirmed = booking.Status === 'Confirmed';
  const isUnpaid    = booking.Payment_Status === 'Unpaid';

  async function run(fn) {
    setBusy(true);
    await fn();
    setBusy(false);
    onDone();
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {isPending && (
        <Button size="sm" color="primary" isDisabled={busy || !online}
          startContent={busy ? <Spinner size="sm" color="white" /> : undefined}
          onPress={() => run(() => confirmBooking(booking.Booking_ID))}>
          {t('dashboard.confirm')}
        </Button>
      )}

      {isConfirmed && isUnpaid && (
        <Popover>
          <Popover.Trigger>
            <Button size="sm" color="success" variant="flat" isDisabled={!online}>{t('sessions.markPaid')}</Button>
          </Popover.Trigger>
          <Popover.Content>
            <div className="p-3 flex flex-col gap-2 w-44">
              <Select selectedKey={payMethod} onSelectionChange={(k) => setPayMethod(k)}>
                <Label>{t('sessions.paymentMethod')}</Label>
                <ListBox>
                  {PAYMENT_METHODS.map((m) => <ListBox.Item id={m} key={m}>{m}</ListBox.Item>)}
                </ListBox>
              </Select>
              <Button size="sm" color="success" fullWidth isDisabled={busy || !online}
                onPress={() => run(() => markPaid(booking.Booking_ID, payMethod))}>
                {t('general.confirm')}
              </Button>
            </div>
          </Popover.Content>
        </Popover>
      )}

      {(isPending || isConfirmed) && (
        <Button size="sm" color="danger" variant="ghost" isDisabled={!online}
          onPress={() => setCancelOpen(true)}>
          {t('dashboard.cancel')}
        </Button>
      )}

      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => run(() => cancelBooking(booking.Booking_ID, ''))}
        title={t('sessions.cancel')}
        message={`${t('sessions.cancel')} — ${booking.Client_Name}?`}
      />
    </div>
  );
}
