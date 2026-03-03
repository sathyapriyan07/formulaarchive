import { useMemo } from 'react'
import type { AdminFieldConfig } from '../../admin/entityConfigs'

interface AdminFormProps {
  fields: AdminFieldConfig[]
  value: Record<string, unknown>
  relationOptions: Record<string, Array<{ label: string; value: string | number }>>
  mode: 'create' | 'edit'
  onChange: (key: string, value: unknown) => void
  onSubmit: () => void
  onCancel: () => void
  saving: boolean
}

export default function AdminForm({ fields, value, relationOptions, mode, onChange, onSubmit, onCancel, saving }: AdminFormProps) {
  const normalizedFields = useMemo(() => fields.filter((f) => !(mode === 'create' && f.readOnlyOnCreate) && !(mode === 'edit' && f.readOnlyOnEdit)), [fields, mode])

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      {normalizedFields.map((field) => {
        const fieldValue = value[field.key]
        const relation = field.relation ? relationOptions[field.key] ?? [] : []
        const options = field.options ?? relation

        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm text-gray-200">{field.label}</label>

            {field.type === 'checkbox' ? (
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={Boolean(fieldValue)} onChange={(event) => onChange(field.key, event.target.checked)} />
                <span className="text-sm text-gray-300">Enabled</span>
              </label>
            ) : field.type === 'select' ? (
              <select
                className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2"
                value={fieldValue == null ? '' : String(fieldValue)}
                onChange={(event) => onChange(field.key, event.target.value || null)}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {options.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2"
                value={fieldValue == null ? '' : String(fieldValue)}
                onChange={(event) => {
                  const next = field.type === 'number' ? (event.target.value === '' ? null : Number(event.target.value)) : event.target.value
                  onChange(field.key, next)
                }}
                required={field.required}
              />
            )}
          </div>
        )
      })}

      <div className="flex gap-3">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
        </button>
      </div>
    </form>
  )
}
