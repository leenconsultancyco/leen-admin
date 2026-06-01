import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Skeleton } from '@heroui/react';
import { getTherapistsFull, updateTherapist } from '../api';
import { useI18n } from '../i18n';
import TherapistEditModal from '../components/TherapistEditModal';
import TherapistCard from '../components/TherapistCard';
import BlockDateModal from '../components/BlockDateModal';
import PageFilterBar, { SearchInput } from '../components/PageFilterBar';
import KpiCard from '../components/KpiCard';

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
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
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

  const filtered = useMemo(() => {
    const safe = Array.isArray(therapists) ? therapists : [];
    return safe.filter((th) => {
      if (filter === 'active'   && !th.Active)  return false;
      if (filter === 'inactive' && !!th.Active) return false;
      const q = search.toLowerCase();
      return !q || th.Name_EN?.toLowerCase().includes(q) || th.Name_AR?.includes(q);
    });
  }, [therapists, filter, search]);

  const counts = useMemo(() => {
    const safe = Array.isArray(therapists) ? therapists : [];
    return {
      total:    safe.length,
      active:   safe.filter((th) => th.Active).length,
      inactive: safe.filter((th) => !th.Active).length,
    };
  }, [therapists]);

  const FILTER_PILLS = [
    { id: 'all',      label: t('general.all')              || 'All'      },
    { id: 'active',   label: t('therapistMgmt.active')     || 'Active'   },
    { id: 'inactive', label: t('therapistMgmt.inactive')   || 'Inactive' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('therapistMgmt.addTherapist') || 'Add Therapist'}
        </Button>,
        actionsTarget
      )}

      <PageFilterBar right={<SearchInput value={search} onChange={setSearch} />}>
        <div className="flex gap-1.5">
          {FILTER_PILLS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filter === id
                  ? 'bg-primary border-primary text-white shadow-sm'
                  : 'bg-white border-default-200 text-default-500 hover:border-primary hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </PageFilterBar>

      <KpiCard metrics={[
        { label: t('therapistMgmt.total')    || 'Total Therapists', value: String(counts.total) },
        { label: t('therapistMgmt.active')   || 'Active',           value: String(counts.active),   cls: 'text-success'     },
        { label: t('therapistMgmt.inactive') || 'Inactive',         value: String(counts.inactive), cls: 'text-default-400' },
      ]} />

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
