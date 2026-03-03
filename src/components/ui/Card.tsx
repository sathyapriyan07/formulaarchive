import { type PropsWithChildren } from 'react'
import clsx from 'clsx'

interface CardProps extends PropsWithChildren {
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return <section className={clsx('rounded-xl border border-f1-gray/60 bg-f1-dark p-4 md:p-6', className)}>{children}</section>
}
