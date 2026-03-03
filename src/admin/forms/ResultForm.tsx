import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const resultSchema = z.object({
  race_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  team_id: z.string().uuid(),
  position: z.number().int().min(1).max(30),
  laps: z.number().int().min(0),
  time: z.string().nullable().optional(),
  status: z.enum(['Finished', 'DNF', 'DSQ', 'DNS']),
})

export type ResultFormValues = z.infer<typeof resultSchema>

interface ResultFormProps {
  defaultValues?: Partial<ResultFormValues>
  onSubmit: (values: ResultFormValues) => Promise<void> | void
}

export default function ResultForm({ defaultValues, onSubmit }: ResultFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      status: 'Finished',
      ...defaultValues,
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input placeholder="Race ID" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('race_id')} />
      <input placeholder="Driver ID" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('driver_id')} />
      <input placeholder="Team ID" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('team_id')} />
      <input type="number" placeholder="Position" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('position', { valueAsNumber: true })} />
      <input type="number" placeholder="Laps" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('laps', { valueAsNumber: true })} />
      <input placeholder="Time (optional)" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('time')} />
      <select className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('status')}>
        <option value="Finished">Finished</option>
        <option value="DNF">DNF</option>
        <option value="DSQ">DSQ</option>
        <option value="DNS">DNS</option>
      </select>
      {Object.keys(errors).length > 0 && <p className="text-xs text-red-400">Please fix the form values.</p>}
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Result
      </button>
    </form>
  )
}
