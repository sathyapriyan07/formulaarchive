import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import type { ImportSummary } from '../../services/import/seasonImporter'
import { importSeasonFromApi } from '../../services/import/seasonImporter'

export default function AdminSingleImportPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleImport = async () => {
    setLoading(true)
    setProgress('')
    setSummary(null)
    try {
      const result = await importSeasonFromApi(year, (p) => {
        setProgress(`${p.source.toUpperCase()} ${p.processedRaces}/${p.totalRaces}: ${p.currentRace ?? ''}`)
      })
      setSummary(result)
      toast.success(`Season ${year} imported`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Single season import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">API Import (Single Season)</h1>
      <Card className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
          />
          <button type="button" className="btn-primary" onClick={handleImport} disabled={loading}>
            {loading ? 'Importing...' : 'Import Season'}
          </button>
        </div>
        {progress ? <p className="text-sm text-gray-300">{progress}</p> : null}
        {summary ? (
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>Races: {summary.racesProcessed}</p>
            <p>Drivers: {summary.driversUpserted}</p>
            <p>Teams: {summary.teamsUpserted}</p>
            <p>Circuits: {summary.circuitsUpserted}</p>
            <p>Results: {summary.resultsUpserted}</p>
            <p>Failed races: {summary.failedRaces.length}</p>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
