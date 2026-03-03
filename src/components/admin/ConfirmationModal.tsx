import Modal from '../ui/Modal'

interface ConfirmationModalProps {
  open: boolean
  title: string
  message: string
  warning?: string
  confirmText?: string
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmationModal({
  open,
  title,
  message,
  warning,
  confirmText = 'Confirm Delete',
  onConfirm,
  onClose,
}: ConfirmationModalProps) {
  return (
    <Modal title={title} open={open} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-gray-200">{message}</p>
        {warning ? <p className="rounded border border-yellow-600/40 bg-yellow-900/20 p-3 text-xs text-yellow-200">{warning}</p> : null}
        <div className="flex gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
