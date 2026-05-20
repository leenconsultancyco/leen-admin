import { useState, useMemo } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Card, CardBody, Skeleton, Pagination,
} from '@heroui/react';

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
          className="w-full"
        >
          <CardBody className="p-3 gap-1">
            {preview.map((col) => (
              <div key={col.key} className="flex justify-between gap-2 text-sm">
                <span className="text-default-400 shrink-0">{col.label}</span>
                <span className="text-default-700 text-end">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function SkeletonRows({ columns, count = 5 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {columns.map((col) => (
        <TableCell key={col.key}><Skeleton className="h-4 w-full rounded" /></TableCell>
      ))}
    </TableRow>
  ));
}

export default function DataTable({ columns = [], data = [], loading = false, emptyMessage = '—', onRowClick }) {
  const [sort, setSort]     = useState({ key: null, dir: 'asc' });
  const [page, setPage]     = useState(1);

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setPage(1);
  }

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);

  const pageCount  = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const showPaging = sorted.length > PAGE_SIZE;

  return (
    <div className="flex flex-col gap-3">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <Table
          aria-label="data-table"
          removeWrapper
          classNames={{ th: 'bg-default-50 text-default-500 text-xs uppercase' }}
        >
          <TableHeader>
            {columns.map((col) => (
              <TableColumn
                key={col.key}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                className={col.sortable ? 'cursor-pointer select-none hover:text-default-800' : ''}
              >
                {col.label}
                {col.sortable && sort.key === col.key && (sort.dir === 'asc' ? ' ↑' : ' ↓')}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent={!loading ? emptyMessage : ' '}>
            {loading
              ? SkeletonRows({ columns })
              : pageRows.map((row, i) => (
                  <TableRow
                    key={i}
                    className={onRowClick ? 'cursor-pointer hover:bg-default-50' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
            }
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        {loading
          ? <Skeleton className="h-40 rounded-xl" />
          : pageRows.length === 0
            ? <p className="text-sm text-default-400 text-center py-6">{emptyMessage}</p>
            : <MobileCardList columns={columns} rows={pageRows} onRowClick={onRowClick} />
        }
      </div>

      {/* Pagination */}
      {showPaging && (
        <div className="flex justify-center">
          <Pagination total={pageCount} page={page} onChange={setPage} size="sm" />
        </div>
      )}
    </div>
  );
}
