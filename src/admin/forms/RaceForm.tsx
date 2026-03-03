import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const raceSchema = z.object({
  season_id: z.string().uuid(),
  circuit_id: z.string().uuid(),
  name: z.string().min(2).max(120),
  round: z.number().int().min(1).max(40),
  date: z.string(),
  status: z.enum(['scheduled', 'completed', 'cancelled']),
})

export type RaceFormValues = z.infer<typeof raceSchema>

interface RaceFormProps {
  defaultValues?: Partial<RaceFormValues>
  onSubmit: (values: RaceFormValues) => Promise<void> | void
}

export default function RaceForm({ defaultValues, onSubmit }: RaceFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RaceFormValues>({
    resolver: zodResolver(raceSchema),
    defaultValues: {
      status: 'scheduled',
      ...defaultValues,
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input placeholder="Season ID" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('season_id')} />
      <input placeholder="Circuit ID" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('circuit_id')} />
      <input placeholder="Race name" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('name')} />
      <input type="number" placeholder="Round" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('round', { valueAsNumber: true })} />
      <input type="date" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('date')} />
      <select className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('status')}>
        <option value="scheduled">Scheduled</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {Object.keys(errors).length > 0 && <p className="text-xs text-red-400">Please fix the form values.</p>}
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Race
      </button>
    </form>
  )
}
