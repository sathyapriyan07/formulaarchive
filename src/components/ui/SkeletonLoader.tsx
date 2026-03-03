import clsx from 'clsx'

interface SkeletonLoaderProps {
  rows?: number
  className?: string
}

export default function SkeletonLoader({ rows = 3, className }: SkeletonLoaderProps) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 animate-pulse rounded-lg bg-f1-gray/50" />
      ))}
    </div>
  )
}
