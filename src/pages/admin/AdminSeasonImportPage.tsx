import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import { useSeasonImport } from '../../hooks/useSeasonImport'

export default function AdminSeasonImportPage() {
  const currentYear = new Date().getFullYear()
  const [seasonYear, setSeasonYear] = useState(currentYear)
  const { loading, progress, summary, runImport } = useSeasonImport()

  const handleImport = async () => {
    if (!Number.isInteger(seasonYear) || seasonYear < 1950 || seasonYear > currentYear) {
      toast.error(`Season year must be between 1950 and ${currentYear}`)
      return
    }

    try {
      const result = await runImport(seasonYear)
      if (!result) return
      if (result.success) {
        toast.success(`Season ${seasonYear} imported successfully`)
      } else {
        toast.error(`Season ${seasonYear} imported with round-level failures`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Season import failed')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">Season Import (Jolpica/Ergast)</h1>
      <Card className="space-y-4">
        <p className="text-sm text-gray-300">
          Imports one season using Jolpica as primary source with Ergast fallback.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="seasonYearImport" className="mb-1 block text-sm text-gray-200">
              Season Year
            </label>
            <input
              id="seasonYearImport"
              type="number"
              min={1950}
              max={currentYear}
              value={seasonYear}
              onChange={(event) => setSeasonYear(Number(event.target.value))}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <button type="button" className="btn-primary" disabled={loading} onClick={handleImport}>
            {loading ? 'Importing...' : 'Import Season'}
          </button>
        </div>
        {progress ? (
          <p className="text-xs text-gray-400">
            Round {progress.processedRounds}/{progress.totalRounds}
            {progress.currentRound ? ` (current: ${progress.currentRound})` : ''} - {progress.message}
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
            <p>Circuits Imported: {summary.circuitsImported}</p>
            <p>Results Inserted: {summary.resultsInserted}</p>
            <p>Failed Rounds: {summary.failedRounds.length}</p>
          </div>
          {summary.failedRounds.length ? (
            <div className="max-h-72 overflow-auto rounded border border-f1-gray/50 bg-f1-darker p-3 text-xs">
              {summary.failedRounds.map((failure) => (
                <p key={`${failure.round}-${failure.reason}`}>
                  Round {failure.round}: {failure.reason}
                </p>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  )
}
