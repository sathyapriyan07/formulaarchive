import { type ReactNode } from 'react'

export interface DataColumn<T> {
  key: string
  title: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Array<DataColumn<T>>
  rows: T[]
  rowKey: (row: T) => string
  emptyText?: string
}

export default function DataTable<T>({ columns, rows, rowKey, emptyText = 'No data available' }: DataTableProps<T>) {
  if (!rows.length) {
    return <p className="rounded-lg border border-dashed border-f1-gray p-6 text-center text-gray-300">{emptyText}</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-f1-gray">
            {columns.map((column) => (
              <th key={column.key} className={`p-3 text-left font-semibold text-gray-200 ${column.className ?? ''}`}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-f1-gray/50">
              {columns.map((column) => (
                <td key={column.key} className={`p-3 align-top text-gray-100 ${column.className ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
