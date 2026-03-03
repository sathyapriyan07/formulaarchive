import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import { supabaseClient } from '../../services/supabaseClient'

type ImportSummary = {
  success: boolean
  seasonYear: number
  racesImported: number
  driversImported: number
  teamsImported: number
  resultsInserted: number
  failedSessions: Array<{ session_key: number; reason: string }>
  error?: string
}

export default function AdminOpenF1ImportPage() {
  const [seasonYear, setSeasonYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleImport = async () => {
    setLoading(true)
    setSummary(null)
    try {
      const { data: sessionData } = await supabaseClient.auth.getSession()
      if (!sessionData.session) throw new Error('User not logged in')

      const { data, error } = await supabaseClient.functions.invoke('importSeasonOpenF1', {
        body: { seasonYear },
      })

      if (error) throw new Error(error.message || 'Edge function invoke failed')
      setSummary(data as ImportSummary)

      if ((data as ImportSummary).success) {
        toast.success(`OpenF1 season ${seasonYear} import completed`)
      } else {
        toast.error((data as ImportSummary).error || 'OpenF1 import completed with issues')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'OpenF1 import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">OpenF1 Season Import</h1>
      <Card className="space-y-4">
        <p className="text-sm text-gray-300">Imports only official race sessions from OpenF1 for a selected season.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="seasonYear" className="mb-1 block text-sm text-gray-200">Season Year</label>
            <input
              id="seasonYear"
              type="number"
              min={2018}
              max={new Date().getFullYear()}
              value={seasonYear}
              onChange={(event) => setSeasonYear(Number(event.target.value))}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <button type="button" className="btn-primary" disabled={loading} onClick={handleImport}>
            {loading ? 'Importing...' : 'Import Season (OpenF1)'}
          </button>
        </div>
      </Card>

      {summary ? (
        <Card className="space-y-3">
          <h2 className="text-xl font-semibold">Import Summary</h2>
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>Season: {summary.seasonYear}</p>
            <p>Races Imported: {summary.racesImported}</p>
            <p>Drivers Imported: {summary.driversImported}</p>
            <p>Teams Imported: {summary.teamsImported}</p>
            <p>Results Inserted: {summary.resultsInserted}</p>
            <p>Failed Sessions: {summary.failedSessions.length}</p>
          </div>
          {summary.failedSessions.length ? (
            <div className="max-h-72 overflow-auto rounded border border-f1-gray/50 bg-f1-darker p-3 text-xs">
              {summary.failedSessions.map((failure) => (
                <p key={`${failure.session_key}-${failure.reason}`}>
                  {failure.session_key}: {failure.reason}
                </p>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
