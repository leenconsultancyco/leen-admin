import { useState, useEffect } from 'react';
import { Card, Button, Chip, Input, Skeleton } from '@heroui/react';
import { getTherapistsFull } from '../api';
import { useI18n } from '../i18n';
import TherapistEditModal from '../components/TherapistEditModal';

function Avatar({ therapist }) {
  if (therapist.Photo_URL) {
    return <img src={therapist.Photo_URL} alt={therapist.Name_EN} className="w-12 h-12 rounded-full object-cover shrink-0" />;
  }
  const letters = (therapist.Name_EN || '?').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
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
      <Input
        size="sm"
        placeholder={t('clients.search')}
        value={search}
        onValueChange={setSearch}
        className="max-w-xs"
        startContent={<span className="text-default-400">🔍</span>}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-default-400 text-center py-8">{t('general.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((th) => (
            <Card key={th.Therapist_ID} className={!th.Active ? 'opacity-60' : ''}>
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

      {editing && (
        <TherapistEditModal
          therapist={editing}
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}
