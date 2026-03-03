import clsx from 'clsx'

type BadgeTone = 'neutral' | 'danger' | 'success' | 'warning' | 'champion'

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-f1-gray text-f1-light',
  danger: 'bg-red-700 text-white',
  success: 'bg-green-700 text-white',
  warning: 'bg-yellow-600 text-black',
  champion: 'bg-amber-400 text-black',
}

interface BadgeProps {
  label: string
  tone?: BadgeTone
}

export default function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return <span className={clsx('inline-flex rounded-full px-2 py-1 text-xs font-bold uppercase tracking-wide', toneStyles[tone])}>{label}</span>
}
