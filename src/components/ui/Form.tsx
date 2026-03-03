import { type FormEvent, type PropsWithChildren } from 'react'

interface FormProps extends PropsWithChildren {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  className?: string
}

interface FieldProps extends PropsWithChildren {
  label: string
  htmlFor: string
  error?: string
}

export function Form({ onSubmit, className, children }: FormProps) {
  return (
    <form onSubmit={onSubmit} className={className ?? 'space-y-4'}>
      {children}
    </form>
  )
}

export function FormField({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-200">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
