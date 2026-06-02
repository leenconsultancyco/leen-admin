import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button, Chip } from '@heroui/react';
import { getClients } from '../api';
import { useI18n } from '../i18n';
import DataTable from '../components/DataTable';
import ClientDetailModal from '../components/ClientDetailModal';
import AddClientModal from '../components/AddClientModal';
import OfflineBanner from '../components/OfflineBanner';
import PageFilterBar, { SearchInput } from '../components/PageFilterBar';

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
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
  const [actionsTarget, setActionsTarget] = useState(null);

  useEffect(() => { setActionsTarget(document.getElementById('page-title-actions')); }, []);

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
    return safe.filter((c) => c.Name?.toLowerCase().includes(q) || c.Phone?.includes(q));
  }, [clients, query]);

  const columns = [
    { key: 'Name',               label: t('clients.name'),         sortable: true },
    { key: 'Phone',              label: t('clients.phone') },
    { key: 'Email',              label: t('clients.email') },
    { key: 'First_Session_Date', label: t('clients.firstSession'), sortable: true,
      render: (r) => <span>{String(r.First_Session_Date || '—').substring(0, 10)}</span> },
    { key: 'Total_Sessions',     label: t('clients.totalSessions'), sortable: true },
    { key: 'Status',             label: t('clients.status'),
      render: (r) => (
        <Chip size="sm" variant="flat" color={r.Status === 'Active' ? 'success' : 'default'}>
          {r.Status === 'Active' ? t('clients.active') : t('clients.inactive')}
        </Chip>
      ),
    },
    { key: 'Notes', label: t('clients.notes'),
      render: (r) => <span className="text-xs text-default-400">{r.Notes || '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {actionsTarget && createPortal(
        <Button size="sm" color="primary" onPress={() => setAdding(true)}>
          + {t('clients.addClient')}
        </Button>,
        actionsTarget
      )}

      <OfflineBanner />

      <PageFilterBar right={<SearchInput value={search} onChange={setSearch} placeholder={t('clients.search')} />} />

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage={t('general.noResults')}
        onRowClick={setSelected}
      />

      {selected && (
        <ClientDetailModal client={selected} isOpen={!!selected} onClose={() => setSelected(null)} />
      )}
      <AddClientModal
        isOpen={adding}
        onClose={() => setAdding(false)}
        onSuccess={() => { setAdding(false); load(); }}
      />
    </div>
  );
}
