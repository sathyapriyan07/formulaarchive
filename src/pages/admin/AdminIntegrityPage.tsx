import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import { supabaseClient } from '../../services/supabaseClient'

type IntegrityItem = { label: string; count: number; detail: string }

export default function AdminIntegrityPage() {
  const [running, setRunning] = useState(false)
  const [report, setReport] = useState<IntegrityItem[]>([])

  const runCheck = async () => {
    setRunning(true)
    try {
      const [driversRes, statsRes, racesRes, raceResultsRes, seasonsRes] = await Promise.all([
        supabaseClient.from('drivers').select('id'),
        supabaseClient.from('driver_season_stats').select('driver_id, team_id, season_id'),
        supabaseClient.from('races').select('id, season_id, status, circuit_id'),
        supabaseClient.from('race_results').select('id, race_id, driver_id, team_id'),
        supabaseClient.from('seasons').select('id, year'),
      ])

      if (driversRes.error || statsRes.error || racesRes.error || raceResultsRes.error || seasonsRes.error) {
        throw new Error('Failed to fetch integrity datasets')
      }

      const driverIdsWithStats = new Set((statsRes.data ?? []).map((row) => row.driver_id))
      const raceIdsWithResults = new Set((raceResultsRes.data ?? []).map((row) => row.race_id))

      const orphanDrivers = (driversRes.data ?? []).filter((driver) => !driverIdsWithStats.has(driver.id))
      const completedRaceWithoutResults = (racesRes.data ?? []).filter((race) => race.status === 'completed' && !raceIdsWithResults.has(race.id))
      const missingTeamRelations = (statsRes.data ?? []).filter((row) => !row.team_id)
      const nullRaceCircuit = (racesRes.data ?? []).filter((row) => !row.circuit_id)

      const duplicateSeasonYears = (() => {
        const counts = new Map<number, number>()
        for (const row of seasonsRes.data ?? []) {
          counts.set(row.year, (counts.get(row.year) ?? 0) + 1)
        }
        return [...counts.values()].filter((count) => count > 1).length
      })()

      const nextReport: IntegrityItem[] = [
        { label: 'Orphan drivers', count: orphanDrivers.length, detail: 'Drivers without season stats' },
        { label: 'Missing team relations', count: missingTeamRelations.length, detail: 'Driver season stats missing team mapping' },
        { label: 'Completed races without results', count: completedRaceWithoutResults.length, detail: 'Race marked completed but no result rows' },
        { label: 'Duplicate season year groups', count: duplicateSeasonYears, detail: 'Duplicate season years found' },
        { label: 'Races with null circuit', count: nullRaceCircuit.length, detail: 'Race foreign key missing circuit relation' },
      ]

      setReport(nextReport)
      toast.success('Integrity check completed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Integrity check failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">Run Integrity Check</h1>
      <Card className="space-y-3">
        <button type="button" className="btn-primary" onClick={runCheck} disabled={running}>
          {running ? 'Running...' : 'Run Integrity Check'}
        </button>

        {report.length ? (
          <div className="space-y-2">
            {report.map((item) => (
              <div key={item.label} className="rounded border border-f1-gray/50 bg-f1-darker p-3">
                <p className="text-sm font-semibold">{item.label}: {item.count}</p>
                <p className="text-xs text-gray-400">{item.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
