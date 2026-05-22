import { useState, useMemo } from 'react';
import { Card, Skeleton, Pagination } from '@heroui/react';

const PAGE_SIZE = 20;

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
      {/* Desktop plain-HTML table (HeroUI v3 Table API uncertain — using plain HTML per cheat sheet) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-default-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  className={`px-3 py-2 text-start text-xs font-semibold uppercase text-default-500 bg-default-50
                    ${col.sortable ? 'cursor-pointer select-none hover:text-default-800' : ''}`}
                >
                  {col.label}{col.sortable && sort.key === col.key && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-default-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-default-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-default-100 ${onRowClick ? 'cursor-pointer hover:bg-default-50' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-default-700">
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
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

      {sorted.length > PAGE_SIZE && (
        <div className="flex justify-center">
          <Pagination total={pageCount} page={page} onChange={setPage} size="sm" />
        </div>
      )}
    </div>
  );
}
