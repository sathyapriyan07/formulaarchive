import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const driverSchema = z.object({
  name: z.string().min(2).max(120),
  image_url: z.url(),
  dob: z.string().nullable().optional(),
  number: z.string().min(1).max(3),
  nationality: z.string().min(2).max(80).nullable().optional(),
})

export type DriverFormValues = z.infer<typeof driverSchema>

interface DriverFormProps {
  defaultValues?: Partial<DriverFormValues>
  onSubmit: (values: DriverFormValues) => Promise<void> | void
}

export default function DriverForm({ defaultValues, onSubmit }: DriverFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues,
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input placeholder="Driver name" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('name')} />
      <input placeholder="Image URL" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('image_url')} />
      <input type="date" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('dob')} />
      <input placeholder="Car number" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('number')} />
      <input placeholder="Nationality" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('nationality')} />
      {(errors.name || errors.image_url || errors.number) && <p className="text-xs text-red-400">Please fix required fields and invalid URL.</p>}
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Driver
      </button>
    </form>
  )
}
