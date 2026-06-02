import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Skeleton } from '@heroui/react';
import { getTherapistsFull, updateTherapist } from '../api';
import { useI18n } from '../i18n';
import TherapistEditModal from '../components/TherapistEditModal';
import TherapistCard from '../components/TherapistCard';
import BlockDateModal from '../components/BlockDateModal';

const BLANK_THERAPIST = {
  Therapist_ID: '', Name_EN: '', Name_AR: '',
  Title_EN: '', Title_AR: '', Bio_EN: '', Bio_AR: '',
  Specialties: '', Languages: 'Arabic, English',
  Session_Types: 'Individual', Modes: 'Both',
  Working_Days: 'Sun,Mon,Tue,Wed,Thu',
  Start_Time: '09:00', End_Time: '17:00', Session_Duration_Min: 50,
  Fee_Individual: '', Fee_Couples: '', Fee_Family: '',
  Fee_Group: '', Fee_Workshop: '', Revenue_Share_Pct: 70,
  Photo_URL: '', Display_Order: '', Active: true,
};

export default function TherapistMgmt() {
  const { t } = useI18n();
  const [therapists, setTherapists]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editing, setEditing]           = useState(null);
  const [adding, setAdding]             = useState(false);
  const [blockTarget, setBlockTarget]   = useState(null);
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

  const load = () => {
    setLoading(true);
    getTherapistsFull().then((r) => {
      setTherapists(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  async function handleToggleActive(th) {
    await updateTherapist({ ...th, Active: !th.Active });
    load();
  }

  const filtered = Array.isArray(therapists) ? therapists : [];

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('therapistMgmt.addTherapist') || 'Add Therapist'}
        </Button>,
        actionsTarget
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((th) => (
            <TherapistCard
              key={th.Therapist_ID}
              therapist={th}
              onEdit={setEditing}
              onToggleActive={handleToggleActive}
              onBlockDate={setBlockTarget}
            />
          ))}
        </div>
      )}

      {editing && (
        <TherapistEditModal
          therapist={editing} isNew={false} isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); }}
        />
      )}
      {adding && (
        <TherapistEditModal
          therapist={BLANK_THERAPIST} isNew={true} isOpen={adding}
          onClose={() => setAdding(false)}
          onSuccess={() => { setAdding(false); load(); }}
        />
      )}
      {blockTarget && (
        <BlockDateModal
          therapist={blockTarget}
          isOpen={!!blockTarget}
          onClose={() => setBlockTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
