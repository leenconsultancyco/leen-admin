import { useState, useEffect } from 'react';
import { Button, Chip, Divider, Modal, Spinner, TextArea } from '@heroui/react';
import { useI18n } from '../i18n';
import DataTable from './DataTable';

const SESSION_COLS = [
  { key: 'Session_Date',   label: 'Date',      sortable: true },
  { key: 'Therapist_Name', label: 'Therapist' },
  { key: 'Session_Type',   label: 'Type' },
  { key: 'Session_Mode',   label: 'Mode' },
  { key: 'Fee',            label: 'Fee',  render: (r) => <span dir="ltr">{Number(r.Fee || 0).toLocaleString('en-EG')} EGP</span> },
  { key: 'Status',         label: 'Status', render: (r) => <Chip size="sm" variant="flat">{r.Status}</Chip> },
];

export default function ClientDetailModal({ client, isOpen, onClose }) {
  const { t } = useI18n();
  const [notes, setNotes]   = useState(client.Notes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => { setNotes(client.Notes || ''); setSaved(false); }, [client, isOpen]);

  async function handleSaveNotes() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    client.Notes = notes;
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.Header>
            <div className="flex items-center gap-3">
              <span>{client.Name}</span>
              <Chip size="sm" color={client.Status === 'Active' ? 'success' : 'default'} variant="flat">
                {client.Status === 'Active' ? t('clients.active') : t('clients.inactive')}
              </Chip>
            </div>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4 pb-6">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {[
                [t('clients.phone'),              client.Phone],
                [t('clients.email'),              client.Email || '—'],
                [t('clients.firstSession'),       client.First_Session_Date || '—'],
                [t('clients.totalSessions'),      client.Total_Sessions ?? 0],
                [t('clients.preferredTherapist'), client.Preferred_Therapist_ID || '—'],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-default-400 text-xs">{label}</p>
                  <p className="text-default-800 font-medium">{val}</p>
                </div>
              ))}
            </div>

            <Divider />

            <div>
              <p className="text-sm font-semibold text-default-700 mb-2">{t('clients.sessionHistory')}</p>
              <DataTable columns={SESSION_COLS} data={client.sessions ?? []} loading={false} emptyMessage={t('general.noResults')} />
            </div>

            <Divider />

            <div>
              <p className="text-sm font-semibold text-default-700 mb-2">{t('clients.notes')}</p>
              <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" color="primary" isDisabled={saving}
                  startContent={saving ? <Spinner size="sm" color="white" /> : undefined}
                  onPress={handleSaveNotes}>
                  {saved ? '✓ ' + t('general.success') : t('general.save')}
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
