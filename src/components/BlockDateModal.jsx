import { useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { blockDate } from '../api';
import { toast } from './Toast';
import { useOverlayState } from '@heroui/react';

export default function BlockDateModal({ therapist, isOpen, onClose, onSuccess }) {
  const [date, setDate]       = useState('');
  const [timeStart, setStart] = useState('');
  const [timeEnd, setEnd]     = useState('');
  const [reason, setReason]   = useState('');
  const [busy, setBusy]       = useState(false);

  const inputCls = 'w-full border border-default-200 rounded-lg px-3 py-2 text-sm bg-white text-default-700 focus:outline-none focus:border-primary';

  async function handleSubmit() {
    if (!date) return;
    setBusy(true);
    const res = await blockDate(therapist.Therapist_ID, date, timeStart || null, timeEnd || null, reason || null);
    setBusy(false);
    if (res.success) {
      toast(`Date blocked for ${therapist.Name_EN}`);
      onSuccess?.();
      onClose();
    } else {
      toast('Failed to block date');
    }
  }

  if (!isOpen) return null;

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>Block Date — {therapist?.Name_EN}</Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-default-500 mb-1 block">Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-default-500 mb-1 block">Start time (optional)</label>
                  <input type="time" value={timeStart} onChange={(e) => setStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-default-500 mb-1 block">End time (optional)</label>
                  <input type="time" value={timeEnd} onChange={(e) => setEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
              <p className="text-xs text-default-400">Leave time fields empty to block the full day.</p>
              <div>
                <label className="text-xs text-default-500 mb-1 block">Reason (optional)</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                  placeholder="Holiday, Sick, Conference…" className={inputCls} />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="flat" onPress={onClose}>Cancel</Button>
            <Button color="primary" isDisabled={!date || busy} isLoading={busy} onPress={handleSubmit}>
              Block Date
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
