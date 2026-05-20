import { useState } from 'react';
import { Card, CardBody, Button, Chip, Spinner } from '@heroui/react';
import { confirmBooking, cancelBooking } from '../api';
import { getIsOnline } from '../hooks/useOnlineStatus';
import { useI18n } from '../i18n';
import ConfirmModal from './ConfirmModal';

export default function PendingBookingCard({ booking, onDone }) {
  const { t } = useI18n();
  const online = getIsOnline();
  const [confirming, setConfirming] = useState(false);
  const [cancelOpen, setCancelOpen]  = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    await confirmBooking(booking.Booking_ID);
    setConfirming(false);
    onDone(booking.Booking_ID);
  }

  async function handleCancel() {
    await cancelBooking(booking.Booking_ID, '');
    onDone(booking.Booking_ID);
  }

  return (
    <>
      <Card className="border border-warning-200 bg-warning-50">
        <CardBody className="gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-default-800">{booking.Client_Name}</p>
              <p className="text-sm text-default-500">{booking.Therapist_Name}</p>
            </div>
            <Chip size="sm" color="warning" variant="flat">{t('sessions.status')}: {booking.Status}</Chip>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-default-600">
            <span>📅 {booking.Session_Date}</span>
            <span>🕐 {booking.Session_Time}</span>
            <span>📋 {booking.Session_Type}</span>
            <span>📍 {booking.Session_Mode}</span>
            <span dir="ltr">💰 {Number(booking.Fee || 0).toLocaleString('en-EG')} EGP</span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              color="danger"
              variant="ghost"
              isDisabled={!online}
              onPress={() => setCancelOpen(true)}
            >
              {t('dashboard.cancel')}
            </Button>
            <Button
              size="sm"
              color="primary"
              isDisabled={confirming || !online}
              startContent={confirming ? <Spinner size="sm" color="white" /> : undefined}
              onPress={handleConfirm}
            >
              {t('dashboard.confirm')}
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmModal
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title={t('dashboard.cancel')}
        message={`${t('sessions.cancel')} ${booking.Client_Name}?`}
        confirmColor="danger"
      />
    </>
  );
}
