import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const seasonSchema = z.object({
  year: z.number().int().min(1950).max(2100),
  champion_driver_id: z.string().uuid().nullable().optional(),
  champion_team_id: z.string().uuid().nullable().optional(),
})

export type SeasonFormValues = z.infer<typeof seasonSchema>

interface SeasonFormProps {
  defaultValues?: Partial<SeasonFormValues>
  onSubmit: (values: SeasonFormValues) => Promise<void> | void
}

export default function SeasonForm({ defaultValues, onSubmit }: SeasonFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      ...defaultValues,
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="year" className="mb-1 block text-sm text-gray-300">
          Year
        </label>
        <input id="year" type="number" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('year', { valueAsNumber: true })} />
        {errors.year && <p className="text-xs text-red-400">{errors.year.message}</p>}
      </div>
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Season
      </button>
    </form>
  )
}
