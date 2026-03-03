import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const teamSchema = z.object({
  name: z.string().min(2).max(120),
  logo_url: z.url(),
  car_image_url: z.url().nullable().optional(),
  is_active: z.boolean(),
  championships: z.number().int().min(0),
})

export type TeamFormValues = z.infer<typeof teamSchema>

interface TeamFormProps {
  defaultValues?: Partial<TeamFormValues>
  onSubmit: (values: TeamFormValues) => Promise<void> | void
}

export default function TeamForm({ defaultValues, onSubmit }: TeamFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      is_active: true,
      championships: 0,
      ...defaultValues,
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <input placeholder="Team name" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('name')} />
      <input placeholder="Logo URL" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('logo_url')} />
      <input placeholder="Car image URL" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('car_image_url')} />
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input type="checkbox" {...register('is_active')} />
        Active team
      </label>
      <input type="number" placeholder="Championships" className="w-full rounded border border-f1-gray bg-f1-darker px-3 py-2" {...register('championships', { valueAsNumber: true })} />
      {(errors.name || errors.logo_url || errors.car_image_url) && <p className="text-xs text-red-400">Please fix invalid URLs and required fields.</p>}
      <button disabled={isSubmitting} type="submit" className="btn-primary">
        Save Team
      </button>
    </form>
  )
}
