import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import AdminTable, { type AdminColumn } from '../../components/admin/AdminTable'
import AdminForm from '../../components/admin/AdminForm'
import ConfirmationModal from '../../components/admin/ConfirmationModal'
import { ADMIN_ENTITY_CONFIGS, type AdminEntityKey } from '../../admin/entityConfigs'
import { useCrudEntity } from '../../hooks/useCrudEntity'
import { supabaseClient } from '../../services/supabaseClient'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const PAGE_SIZE = 10

function coerceValue(key: string, value: unknown) {
  if (value === '') return null
  if (key.endsWith('_id') && value != null) return String(value)
  return value
}

export default function AdminEntityPage({ entityKey }: { entityKey: AdminEntityKey }) {
  const config = ADMIN_ENTITY_CONFIGS[entityKey]
  const { query, createMutation, updateMutation, deleteMutation } = useCrudEntity<Record<string, unknown>>(config.table, config.defaultSort)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState(config.defaultSort)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [activeFilter, setActiveFilter] = useState<Record<string, string>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null)
  const [draft, setDraft] = useState<Record<string, unknown>>({})

  const [relationOptions, setRelationOptions] = useState<Record<string, Array<{ label: string; value: string | number }>>>({})

  useEffect(() => {
    const loadRelationOptions = async () => {
      const next: Record<string, Array<{ label: string; value: string | number }>> = {}

      for (const field of config.fields) {
        if (!field.relation) continue
        const { data, error } = await supabaseClient
          .from(field.relation.table)
          .select(`${field.relation.valueKey}, ${field.relation.labelKey}`)
          .order(field.relation.labelKey, { ascending: true })

        if (error) {
          toast.error(`Failed to load ${field.label} options: ${error.message}`)
          continue
        }

        const optionRows = ((data ?? []) as unknown[]) as Record<string, unknown>[]
        next[field.key] = optionRows.map((row) => ({
          value: row[field.relation!.valueKey] as string | number,
          label: String(row[field.relation!.labelKey]),
        }))
      }

      setRelationOptions(next)
    }

    loadRelationOptions()
  }, [config.fields])

  const rows = useMemo(() => {
    const baseRows = (query.data ?? []) as Record<string, unknown>[]

    const filtered = baseRows.filter((row) => {
      const matchesSearch = !debouncedSearch
        || config.searchFields.some((key) => String(row[key] ?? '').toLowerCase().includes(debouncedSearch.toLowerCase()))

      if (!matchesSearch) return false

      for (const [key, value] of Object.entries(activeFilter)) {
        if (!value) continue
        if (String(row[key] ?? '') !== value) return false
      }
      return true
    })

    const sorted = [...filtered].sort((a, b) => {
      const left = a[sortBy]
      const right = b[sortBy]
      const leftNormalized = typeof left === 'number' ? left : String(left ?? '').toLowerCase()
      const rightNormalized = typeof right === 'number' ? right : String(right ?? '').toLowerCase()

      if (leftNormalized < rightNormalized) return sortDirection === 'asc' ? -1 : 1
      if (leftNormalized > rightNormalized) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [query.data, debouncedSearch, config.searchFields, activeFilter, sortBy, sortDirection])

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeFilter, sortBy, sortDirection])

  const columns = useMemo<Array<AdminColumn<Record<string, unknown>>>>(() => {
    const base = config.fields.slice(0, 5).map((field) => ({
      key: field.key,
      title: field.label,
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const value = row[field.key]
        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
        return String(value ?? '-')
      },
    }))

    return [
      ...base,
      {
        key: 'actions',
        title: 'Actions',
        render: (row) => (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-f1-gray px-2 py-1 text-xs"
              onClick={() => {
                setEditingRow(row)
                setDraft(row)
                setEditOpen(true)
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="rounded bg-red-700 px-2 py-1 text-xs"
              onClick={() => {
                setEditingRow(row)
                setDeleteOpen(true)
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ]
  }, [config.fields])

  const handleCreate = async () => {
    try {
      const payload = config.fields.reduce((acc, field) => {
        if (field.readOnlyOnCreate) return acc
        const value = draft[field.key]
        if (value === undefined) return acc
        acc[field.key] = coerceValue(field.key, value)
        return acc
      }, {} as Record<string, unknown>)

      await createMutation.mutateAsync(payload)
      setCreateOpen(false)
      setDraft({})
    } catch {
      // handled by mutation toast
    }
  }

  const handleUpdate = async () => {
    if (!editingRow) return
    try {
      const payload = config.fields.reduce((acc, field) => {
        if (field.readOnlyOnEdit) return acc
        if (!(field.key in draft)) return acc
        acc[field.key] = coerceValue(field.key, draft[field.key])
        return acc
      }, {} as Record<string, unknown>)

      await updateMutation.mutateAsync({
        keyField: config.keyField,
        keyValue: editingRow[config.keyField] as string | number,
        payload,
      })

      setEditOpen(false)
      setEditingRow(null)
      setDraft({})
    } catch {
      // handled by mutation toast
    }
  }

  const handleDelete = async () => {
    if (!editingRow) return
    try {
      await deleteMutation.mutateAsync({
        keyField: config.keyField,
        keyValue: editingRow[config.keyField] as string | number,
      })
      setDeleteOpen(false)
      setEditingRow(null)
    } catch {
      // handled by mutation toast
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-f1-red">{config.title}</h1>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setDraft({})
            setCreateOpen(true)
          }}
        >
          Create
        </button>
      </div>

      <Card className="space-y-3">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
          />

          {config.filters?.map((filter) => (
            <select
              key={filter.key}
              value={activeFilter[filter.key] ?? ''}
              onChange={(event) => setActiveFilter((prev) => ({ ...prev, [filter.key]: event.target.value }))}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            >
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {query.isLoading ? <p>Loading...</p> : null}
        {query.error ? <p className="text-red-400">Failed to load records.</p> : null}

        <AdminTable
          rows={pagedRows}
          columns={columns}
          rowKey={(row) => row[config.keyField] as string | number}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(key) => {
            if (sortBy === key) setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
            else {
              setSortBy(key)
              setSortDirection('asc')
            }
          }}
          page={page}
          pageSize={PAGE_SIZE}
          total={rows.length}
          onPageChange={setPage}
        />
      </Card>

      <Modal title={`Create ${config.title}`} open={createOpen} onClose={() => setCreateOpen(false)}>
        <AdminForm
          fields={config.fields}
          value={draft}
          relationOptions={relationOptions}
          mode="create"
          onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          saving={createMutation.isPending}
        />
      </Modal>

      <Modal title={`Edit ${config.title}`} open={editOpen} onClose={() => setEditOpen(false)}>
        <AdminForm
          fields={config.fields}
          value={draft}
          relationOptions={relationOptions}
          mode="edit"
          onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
          onSubmit={handleUpdate}
          onCancel={() => setEditOpen(false)}
          saving={updateMutation.isPending}
        />
      </Modal>

      <ConfirmationModal
        open={deleteOpen}
        title="Delete Record"
        message="This action will permanently remove this record."
        warning="If this record is linked through foreign keys, this may cascade or fail depending on constraints."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
