import { useState, useEffect } from 'react';
import { Card, Button, Chip, Skeleton } from '@heroui/react';
import { getTherapistsFull } from '../api';
import { useI18n } from '../i18n';
import TherapistEditModal from '../components/TherapistEditModal';

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

function Avatar({ therapist }) {
  if (therapist.Photo_URL) {
    return <img src={therapist.Photo_URL} alt={therapist.Name_EN}
      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  const letters = (therapist.Name_EN || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: 48, height: 48, borderRadius: '50%', backgroundColor: '#0E9B73',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, flexShrink: 0,
    }}>
      {letters}
    </div>
  );
}

export default function TherapistMgmt() {
  const { t } = useI18n();
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [editing, setEditing]       = useState(null);
  const [adding, setAdding]         = useState(false);

  const load = () => {
    setLoading(true);
    getTherapistsFull().then((r) => {
      setTherapists(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = (Array.isArray(therapists) ? therapists : []).filter((th) => {
    const q = search.toLowerCase();
    return !q || th.Name_EN?.toLowerCase().includes(q) || th.Name_AR?.includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t('clients.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '180px', maxWidth: '280px',
            borderWidth: '2px', borderStyle: 'solid', borderColor: '#d1d5db',
            borderRadius: '8px', padding: '7px 14px', fontSize: '14px',
            backgroundColor: '#fff', color: '#111827', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('therapistMgmt.addTherapist') || 'Add Therapist'}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((th) => (
            <Card key={th.Therapist_ID} style={{ opacity: th.Active ? 1 : 0.6 }}>
              <Card.Content className="flex flex-row items-center gap-4 p-4">
                <Avatar therapist={th} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-default-800 truncate">{th.Name_EN}</p>
                    <Chip size="sm" color={th.Active ? 'success' : 'default'} variant="flat">
                      {th.Active ? t('therapistMgmt.active') : t('therapistMgmt.inactive')}
                    </Chip>
                  </div>
                  <p className="text-xs text-default-400 truncate">{th.Name_AR}</p>
                  <p className="text-xs text-default-500 mt-0.5">{th.Title_EN}</p>
                </div>
                <Button size="sm" variant="flat" onPress={() => setEditing(th)}>
                  {t('general.edit')}
                </Button>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Edit existing therapist */}
      {editing && (
        <TherapistEditModal
          therapist={editing}
          isNew={false}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); }}
        />
      )}

      {/* Add new therapist */}
      {adding && (
        <TherapistEditModal
          therapist={BLANK_THERAPIST}
          isNew={true}
          isOpen={adding}
          onClose={() => setAdding(false)}
          onSuccess={() => { setAdding(false); load(); }}
        />
      )}
    </div>
  );
}
