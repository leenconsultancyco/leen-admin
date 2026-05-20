import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { useI18n } from '../i18n';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmColor = 'danger' }) {
  const { t } = useI18n();

  function handleConfirm() {
    onConfirm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-600">{message}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{t('general.cancel')}</Button>
          <Button color={confirmColor} onPress={handleConfirm}>{t('general.confirm')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
