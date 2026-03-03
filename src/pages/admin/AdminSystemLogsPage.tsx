import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import { supabaseClient } from '../../services/supabaseClient'

export default function AdminSystemLogsPage() {
  const query = useQuery({
    queryKey: ['admin-system-logs'],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from('import_jobs')
        .select('id, status, from_year, to_year, message, error_message, logs, created_at, finished_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data ?? []
    },
    refetchInterval: 5000,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">System Logs</h1>
      <Card className="space-y-3">
        {query.isLoading ? <p>Loading logs...</p> : null}
        {query.error ? <p className="text-red-400">Failed to load logs.</p> : null}

        {(query.data ?? []).map((job) => (
          <div key={job.id} className="rounded border border-f1-gray/60 bg-f1-darker p-3 text-xs">
            <p className="text-sm font-semibold">
              {job.status.toUpperCase()} | {job.from_year} - {job.to_year}
            </p>
            <p className="text-gray-300">{job.message}</p>
            {job.error_message ? <p className="text-red-300">{job.error_message}</p> : null}
            <p className="text-gray-400">Created: {new Date(job.created_at).toLocaleString()}</p>
            {job.finished_at ? <p className="text-gray-400">Finished: {new Date(job.finished_at).toLocaleString()}</p> : null}
            <div className="mt-2 max-h-28 overflow-auto rounded border border-f1-gray/40 p-2 font-mono">
              {(job.logs ?? []).slice(-8).map((line: string, idx: number) => (
                <p key={`${job.id}-${idx}`}>{line}</p>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
