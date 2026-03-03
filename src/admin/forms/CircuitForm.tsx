import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const circuitSchema = z.object({
  name: z.string().min(2).max(120),
  country: z.string().min(2).max(80),
  length_km: z.number().min(0).nullable().optional(),
  first_race_year: z.number().int().min(1950).max(2100).nullable().optional(),
  layout_image_url: z.url().nullable().optional(),
})

export type CircuitFormValues = z.infer<typeof circuitSchema>

interface CircuitFormProps {
  defaultValues?: Partial<CircuitFormValues>
  onSubmit: (values: CircuitFormValues) => Promise<void> | void
}

export default function CircuitForm({ defaultValues, onSubmit }: CircuitFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CircuitFormValues>({
    resolver: zodResolver(circuitSchema),
    defaultValues,
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input placeholder="Circuit name" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('name')} />
      <input placeholder="Country" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('country')} />
      <input type="number" step="0.001" placeholder="Length (km)" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('length_km', { valueAsNumber: true })} />
      <input type="number" placeholder="First race year" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('first_race_year', { valueAsNumber: true })} />
      <input placeholder="Layout image URL" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('layout_image_url')} />
      {(errors.name || errors.country || errors.layout_image_url) && <p className="text-xs text-red-400">Please fix required fields and invalid URL.</p>}
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Circuit
      </button>
    </form>
  )
}
