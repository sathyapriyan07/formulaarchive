import { type ReactNode, useMemo, useState } from 'react'
import { type DataColumn } from '../../components/ui/DataTable'
import DataTable from '../../components/ui/DataTable'
import Modal from '../../components/ui/Modal'
import Card from '../../components/ui/Card'

interface AdminCrudPageProps<T extends Record<string, unknown>> {
  title: string
  rows: T[]
  columns: Array<DataColumn<T>>
  rowKey: (row: T) => string
  form: ReactNode
}

export default function AdminCrudPage<T extends Record<string, unknown>>({ title, rows, columns, rowKey, form }: AdminCrudPageProps<T>) {
  const [open, setOpen] = useState(false)
  const safeRows = useMemo(() => rows ?? [], [rows])

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-f1-red">{title}</h1>
        <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
          Add
        </button>
      </div>
      <DataTable columns={columns} rows={safeRows} rowKey={rowKey} />
      <Modal title={`Add ${title}`} open={open} onClose={() => setOpen(false)}>
        {form}
      </Modal>
    </Card>
  )
}
