import { useState } from 'react'
import { toast } from 'sonner'
import Card from '../../components/ui/Card'
import AdminEntityPage from './AdminEntityPage'
import { recalculateSeason } from '../../services/standingsService'
import Tabs from '../../components/ui/Tabs'

export default function AdminStandingsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [tab, setTab] = useState<'driver' | 'team'>('driver')

  const handleRecalculate = async () => {
    setRecalcLoading(true)
    try {
      const result = await recalculateSeason(year)
      toast.success(`Standings recalculated (${result.driverStandingsCount} drivers, ${result.teamStandingsCount} teams)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to recalculate standings')
    } finally {
      setRecalcLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-f1-red">Manage Standings</h1>

      <Card className="space-y-3">
        <p className="text-sm text-gray-300">Recompute wins, podiums, points, and ranking tables for a selected season.</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm text-gray-200">Season Year</label>
            <input
              type="number"
              min={1950}
              max={2100}
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="rounded border border-f1-gray bg-f1-darker px-3 py-2"
            />
          </div>
          <button type="button" className="btn-primary" onClick={handleRecalculate} disabled={recalcLoading}>
            {recalcLoading ? 'Recalculating...' : 'Recalculate Standings'}
          </button>
        </div>
      </Card>

      <Tabs
        tabs={[
          { value: 'driver', label: 'Driver Season Stats' },
          { value: 'team', label: 'Team Season Stats' },
        ]}
        value={tab}
        onChange={(value) => setTab(value as 'driver' | 'team')}
      />

      {tab === 'driver' ? <AdminEntityPage entityKey="driver_season_stats" /> : <AdminEntityPage entityKey="team_season_stats" />}
    </div>
  )
}
