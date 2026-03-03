import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import { supabaseClient } from '../../services/supabaseClient'

const TABLES = [
  'seasons',
  'teams',
  'drivers',
  'circuits',
  'races',
  'race_results',
  'driver_season_stats',
  'team_season_stats',
]

export default function AdminOverviewPage() {
  const query = useQuery({
    queryKey: ['admin-overview-counts'],
    queryFn: async () => {
      const result: Record<string, number> = {}
      for (const table of TABLES) {
        const { count, error } = await supabaseClient.from(table).select('*', { count: 'exact', head: true })
        if (error) throw error
        result[table] = count ?? 0
      }
      return result
    },
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">Dashboard Overview</h1>
      <Card>
        {query.isLoading ? <p>Loading overview...</p> : null}
        {query.error ? <p className="text-red-400">Failed to load overview counts.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(query.data ?? {}).map(([table, count]) => (
            <div key={table} className="rounded border border-f1-gray/60 bg-f1-darker p-3">
              <p className="text-xs uppercase text-gray-400">{table}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
