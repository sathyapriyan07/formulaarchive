import { type ReactNode } from 'react'

export interface AdminColumn<T> {
  key: string
  title: string
  sortable?: boolean
  render: (row: T) => ReactNode
}

interface AdminTableProps<T> {
  rows: T[]
  columns: Array<AdminColumn<T>>
  rowKey: (row: T) => string | number
  sortBy: string
  sortDirection: 'asc' | 'desc'
  onSort: (key: string) => void
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

export default function AdminTable<T>({
  rows,
  columns,
  rowKey,
  sortBy,
  sortDirection,
  onSort,
  page,
  pageSize,
  total,
  onPageChange,
}: AdminTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto rounded-lg border border-f1-gray/60">
        <table className="min-w-full text-sm">
          <thead className="bg-f1-dark/80">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="p-3 text-left text-gray-200">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2"
                    onClick={() => column.sortable && onSort(column.key)}
                    disabled={!column.sortable}
                  >
                    <span>{column.title}</span>
                    {column.sortable && sortBy === column.key ? <span>{sortDirection === 'asc' ? '?' : '?'}</span> : null}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-f1-gray/40">
                {columns.map((column) => (
                  <td key={column.key} className="p-3 align-top text-gray-100">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sticky bottom-2 z-10 flex items-center justify-between rounded-md border border-f1-gray/60 bg-f1-dark/90 px-3 py-2 text-xs backdrop-blur">
        <p>
          Page {page} / {totalPages} ({total} rows)
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            Prev
          </button>
          <button type="button" className="btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
