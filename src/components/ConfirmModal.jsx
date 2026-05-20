import { Button, Modal } from '@heroui/react';
import { useI18n } from '../i18n';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmColor = 'danger' }) {
  const { t } = useI18n();

  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>{title}</Modal.Header>
          <Modal.Body>
            <p className="text-sm text-default-600">{message}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
            <Button color={confirmColor} onPress={handleConfirm}>{t('general.confirm')}</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
