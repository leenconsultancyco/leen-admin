import { useState, useEffect, useMemo } from 'react';
import { Input, Chip, Skeleton } from '@heroui/react';
import { getClients } from '../api';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import ClientDetailModal from '../components/ClientDetailModal';
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
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const query = useDebounce(search, 300);

  useEffect(() => {
    getClients().then((r) => {
      setClients(r.success ? (r.data ?? []) : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query) return clients;
    const q = query.toLowerCase();
    return clients.filter((c) =>
      c.Name?.toLowerCase().includes(q) || c.Phone?.includes(q)
    );
  }, [clients, query]);

  const columns = [
    { key: 'Name',          label: t('clients.name'),         sortable: true },
    { key: 'Phone',         label: t('clients.phone') },
    { key: 'Email',         label: t('clients.email') },
    { key: 'First_Session_Date', label: t('clients.firstSession'), sortable: true },
    { key: 'Total_Sessions',     label: t('clients.totalSessions'),  sortable: true },
    { key: 'Status',        label: t('clients.status'),
      render: (r) => (
        <Chip size="sm" variant="flat" color={r.Status === 'Active' ? 'success' : 'default'}>
          {r.Status === 'Active' ? t('clients.active') : t('clients.inactive')}
        </Chip>
      ),
    },
    { key: 'Notes',         label: t('clients.notes'),
      render: (r) => <span className="text-default-400 text-xs truncate max-w-[120px] inline-block">{r.Notes || '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <OfflineBanner />
      <Input
        size="sm"
        placeholder={t('clients.search')}
        value={search}
        onValueChange={setSearch}
        className="max-w-xs"
        startContent={<span className="text-default-400">🔍</span>}
      />

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
    </div>
  );
}
