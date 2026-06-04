import { useState, useMemo } from 'react';
import { Card, Skeleton } from '@heroui/react';

const PAGE_SIZE = 50;

function MobileCardList({ columns, rows, onRowClick }) {
  const preview = columns.slice(0, 4);
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <Card
          key={i}
          isPressable={!!onRowClick}
          onPress={() => onRowClick?.(row)}
          className="leen-card w-full"
        >
          <Card.Content className="p-3 gap-1">
            {preview.map((col) => (
              <div key={col.key} className="flex justify-between gap-2 text-sm">
                <span className="text-default-400 shrink-0">{col.label}</span>
                <span className="text-default-700 text-end">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </span>
              </div>
            ))}
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = '—', onRowClick }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);

  function toggleSort(key) {
    setSort((prev) => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setPage(1);
  }

  const sorted = useMemo(() => {
    const safe = Array.isArray(data) ? data : [];
    if (!sort.key) return safe;
    return [...safe].sort((a, b) => {
      const cmp = String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-default-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    className={`px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-default-500 bg-gray-50 border-b border-default-200
                      ${col.sortable ? 'cursor-pointer select-none hover:text-default-800' : ''}`}
                  >
                    {col.label}{col.sortable && sort.key === col.key && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-default-100">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-full rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-10 text-center text-default-400 text-sm">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-default-100 last:border-b-0 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-gray-50/60'}`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-default-700">
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        {loading ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : pageRows.length === 0 ? (
          <p className="text-sm text-default-400 text-center py-6">{emptyMessage}</p>
        ) : (
          <MobileCardList columns={columns} rows={pageRows} onRowClick={onRowClick} />
        )}
      </div>

      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: page === 1 ? 'not-allowed' : 'pointer',
              border: '1px solid #DCE1EA', background: page === 1 ? '#F7F8FB' : '#fff', color: page === 1 ? '#C0C7D4' : '#2A3344',
            }}
          >
            ‹
          </button>

          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pageCount || Math.abs(n - page) <= 1)
            .reduce((acc, n, idx, arr) => {
              if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, [])
            .map((item, idx) =>
              item === '…' ? (
                <span key={`e-${idx}`} style={{ fontSize: 13, color: '#8089A0', padding: '0 2px' }}>…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  style={{
                    minWidth: 32, padding: '5px 8px', borderRadius: 8, fontSize: 13, fontWeight: item === page ? 700 : 400,
                    cursor: 'pointer', border: '1px solid',
                    borderColor: item === page ? '#0E9B73' : '#DCE1EA',
                    background: item === page ? '#0E9B73' : '#fff',
                    color: item === page ? '#fff' : '#2A3344',
                  }}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            style={{
              padding: '5px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: page === pageCount ? 'not-allowed' : 'pointer',
              border: '1px solid #DCE1EA', background: page === pageCount ? '#F7F8FB' : '#fff', color: page === pageCount ? '#C0C7D4' : '#2A3344',
            }}
          >
            ›
          </button>

          <span style={{ fontSize: 12, color: '#8089A0', marginLeft: 4 }}>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} / {sorted.length}
          </span>
        </div>
      )}
    </div>
  );
}
