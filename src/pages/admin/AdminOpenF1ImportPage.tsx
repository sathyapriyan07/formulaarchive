import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import { useOpenF1Import } from '../../hooks/useOpenF1Import'

export default function AdminOpenF1ImportPage() {
  const currentYear = new Date().getFullYear()
  const minOpenF1Year = 2023
  const [seasonYear, setSeasonYear] = useState(currentYear)
  const { loading, progress, summary, runImport } = useOpenF1Import()

  const handleImport = async () => {
    if (!Number.isInteger(seasonYear) || seasonYear < minOpenF1Year || seasonYear > currentYear) {
      toast.error(`Season year must be between ${minOpenF1Year} and ${currentYear}`)
      return
    }

    try {
      const result = await runImport(seasonYear)
      if (!result) return
      if (result.success) {
        toast.success(`OpenF1 season ${seasonYear} import completed`)
      } else {
        toast.error('OpenF1 import completed with issues')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'OpenF1 import failed')
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
              min={minOpenF1Year}
              max={currentYear}
              value={seasonYear}
              onChange={(event) => setSeasonYear(Number(event.target.value))}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <button type="button" className="btn-primary" disabled={loading} onClick={handleImport}>
            {loading ? 'Importing...' : 'Import Season (OpenF1)'}
          </button>
        </div>
        {progress ? (
          <p className="text-xs text-gray-400">
            {progress.processedSessions}/{progress.totalSessions} sessions processed
            {progress.currentSessionKey ? ` (session ${progress.currentSessionKey})` : ''} - {progress.message}
          </p>
        ) : null}
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
