import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import { useDriversImport } from '../../hooks/useDriversImport'
import { useCircuitsImport } from '../../hooks/useCircuitsImport'
import { useRacesImport } from '../../hooks/useRacesImport'

export default function AdminModularImportPage() {
  const currentYear = new Date().getFullYear()
  const [yearInput, setYearInput] = useState(String(currentYear))

  const driversImport = useDriversImport()
  const circuitsImport = useCircuitsImport()
  const racesImport = useRacesImport()

  const anyLoading = driversImport.loading || circuitsImport.loading || racesImport.loading
  const parsedYear = Number(yearInput)
  const validYear = Number.isInteger(parsedYear) && parsedYear >= 1950 && parsedYear <= currentYear

  const handleDriversImport = async () => {
    try {
      const year = validYear ? parsedYear : undefined
      const result = await driversImport.runImport(year)
      if (!result) return
      if (result.failedDrivers.length) toast.error(`Drivers import finished with ${result.failedDrivers.length} failures`)
      else toast.success(`Drivers imported from ${result.source} (${result.year})`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Drivers import failed')
    }
  }

  const handleCircuitsImport = async () => {
    try {
      const year = validYear ? parsedYear : undefined
      const result = await circuitsImport.runImport(year)
      if (!result) return
      if (result.failedCircuits.length) toast.error(`Circuits import finished with ${result.failedCircuits.length} failures`)
      else toast.success(`Circuits imported from ${result.source} (${result.year})`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Circuits import failed')
    }
  }

  const handleRacesImport = async () => {
    if (!validYear) {
      toast.error(`Races import requires a year between 1950 and ${currentYear}`)
      return
    }
    try {
      const result = await racesImport.runImport(parsedYear)
      if (!result) return
      if (result.failedRaces.length) toast.error(`Races import finished with ${result.failedRaces.length} failures`)
      else toast.success(`Races imported from ${result.source} (${result.year})`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Races import failed')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">Modular Season Imports (Jolpica/Ergast)</h1>

      <Card className="space-y-4">
        <p className="text-sm text-gray-300">
          Drivers and circuits can use optional year input. Races require a year.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="modularYear" className="mb-1 block text-sm text-gray-200">Year (optional for drivers/circuits)</label>
            <input
              id="modularYear"
              type="number"
              min={1950}
              max={currentYear}
              value={yearInput}
              onChange={(event) => setYearInput(event.target.value)}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <button type="button" className="btn-primary" disabled={anyLoading} onClick={handleDriversImport}>
            {driversImport.loading ? 'Importing Drivers...' : 'Import Drivers'}
          </button>
          <button type="button" className="btn-primary" disabled={anyLoading} onClick={handleCircuitsImport}>
            {circuitsImport.loading ? 'Importing Circuits...' : 'Import Circuits'}
          </button>
          <button type="button" className="btn-primary" disabled={anyLoading || !validYear} onClick={handleRacesImport}>
            {racesImport.loading ? 'Importing Races...' : 'Import Races'}
          </button>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">Progress</h2>
        <div className="grid gap-2 text-sm md:grid-cols-3">
          <p>
            Drivers:
            {' '}
            {driversImport.progress ? `${driversImport.progress.processed}/${driversImport.progress.total} - ${driversImport.progress.message}` : 'idle'}
          </p>
          <p>
            Circuits:
            {' '}
            {circuitsImport.progress ? `${circuitsImport.progress.processed}/${circuitsImport.progress.total} - ${circuitsImport.progress.message}` : 'idle'}
          </p>
          <p>
            Races:
            {' '}
            {racesImport.progress ? `${racesImport.progress.processed}/${racesImport.progress.total} - ${racesImport.progress.message}` : 'idle'}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-2">
          <h3 className="text-lg font-semibold">Drivers Summary</h3>
          <p className="text-sm">Imported: {driversImport.summary?.driversImported ?? 0}</p>
          <p className="text-sm">Updated: {driversImport.summary?.driversUpdated ?? 0}</p>
          <p className="text-sm">Failed: {driversImport.summary?.failedDrivers.length ?? 0}</p>
        </Card>

        <Card className="space-y-2">
          <h3 className="text-lg font-semibold">Circuits Summary</h3>
          <p className="text-sm">Imported: {circuitsImport.summary?.circuitsImported ?? 0}</p>
          <p className="text-sm">Updated: {circuitsImport.summary?.circuitsUpdated ?? 0}</p>
          <p className="text-sm">Failed: {circuitsImport.summary?.failedCircuits.length ?? 0}</p>
        </Card>

        <Card className="space-y-2">
          <h3 className="text-lg font-semibold">Races Summary</h3>
          <p className="text-sm">Imported: {racesImport.summary?.racesImported ?? 0}</p>
          <p className="text-sm">Updated: {racesImport.summary?.racesUpdated ?? 0}</p>
          <p className="text-sm">Failed: {racesImport.summary?.failedRaces.length ?? 0}</p>
        </Card>
      </div>
    </div>
  )
}
