import { type PropsWithChildren } from 'react'

interface ModalProps extends PropsWithChildren {
  title: string
  open: boolean
  onClose: () => void
}

export default function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-xl border border-f1-gray bg-f1-dark p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-f1-red">{title}</h3>
          <button type="button" onClick={onClose} className="rounded bg-f1-gray px-2 py-1 text-sm text-white">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
