import { useState, useEffect, useMemo } from 'react';
import { Button, Chip, Skeleton } from '@heroui/react';
import { getClients } from '../api';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import ClientDetailModal from '../components/ClientDetailModal';
import AddClientModal from '../components/AddClientModal';
import OfflineBanner from '../components/OfflineBanner';

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Clients() {
  const { t } = useI18n();
  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [adding, setAdding]     = useState(false);

  const query = useDebounce(search, 300);

  const load = () => {
    setLoading(true);
    getClients().then((r) => {
      setClients(r.success && Array.isArray(r.data) ? r.data : []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const safe = Array.isArray(clients) ? clients : [];
    if (!query) return safe;
    const q = query.toLowerCase();
    return safe.filter((c) =>
      c.Name?.toLowerCase().includes(q) || c.Phone?.includes(q)
    );
  }, [clients, query]);

  const columns = [
    { key: 'Name',             label: t('clients.name'),         sortable: true },
    { key: 'Phone',            label: t('clients.phone') },
    { key: 'Email',            label: t('clients.email') },
    { key: 'First_Session_Date', label: t('clients.firstSession'), sortable: true,
      render: (r) => <span>{String(r.First_Session_Date || '—').substring(0, 10)}</span> },
    { key: 'Total_Sessions',   label: t('clients.totalSessions'), sortable: true },
    { key: 'Status',           label: t('clients.status'),
      render: (r) => (
        <Chip size="sm" variant="flat" color={r.Status === 'Active' ? 'success' : 'default'}>
          {r.Status === 'Active' ? t('clients.active') : t('clients.inactive')}
        </Chip>
      ),
    },
    { key: 'Notes', label: t('clients.notes'),
      render: (r) => (
        <span style={{ color: '#a1a1aa', fontSize: '12px' }}>{r.Notes || '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder={t('clients.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '180px', maxWidth: '300px',
            borderWidth: '2px', borderStyle: 'solid', borderColor: '#d1d5db',
            borderRadius: '8px', padding: '7px 14px', fontSize: '14px',
            backgroundColor: '#fff', color: '#111827', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('clients.addClient')}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          loading={false}
          emptyMessage={t('general.noResults')}
          onRowClick={setSelected}
        />
      )}

      {selected && (
        <ClientDetailModal
          client={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
        />
      )}

      <AddClientModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSuccess={() => { setAdding(false); load(); }}
      />
    </div>
  );
}
