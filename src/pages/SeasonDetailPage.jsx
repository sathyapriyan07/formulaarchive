import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function SeasonDetailPage() {
  const { year } = useParams()
  const [activeTab, setActiveTab] = useState('standings')
  const [standingsTab, setStandingsTab] = useState('drivers')
  const [driverStandings, setDriverStandings] = useState([])
  const [teamStandings, setTeamStandings] = useState([])
  const [races, setRaces] = useState([])
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [year])

  const fetchData = async () => {
    const { data: driverStats } = await supabase
      .from('driver_season_stats')
      .select('*, drivers(*), teams(*)')
      .eq('season_id', year)
      .order('points', { ascending: false })

    setDriverStandings(driverStats || [])

    const { data: teamStats } = await supabase
      .from('team_season_stats')
      .select('*, teams(*)')
      .eq('season_id', year)
      .order('points', { ascending: false })

    setTeamStandings(teamStats || [])

    const { data: raceData } = await supabase
      .from('races')
      .select('*, circuits(*)')
      .eq('season_id', year)
      .order('round', { ascending: true })

    setRaces(raceData || [])
    setDrivers(driverStats || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">{year} Season</h1>

      <div className="flex space-x-4 mb-6 border-b border-f1-gray overflow-x-auto">
        {['standings', 'results', 'races', 'drivers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-4 capitalize whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-f1-red text-f1-red' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'standings' && (
        <div className="card">
          <div className="flex space-x-4 mb-6 border-b border-f1-gray">
            <button
              onClick={() => setStandingsTab('drivers')}
              className={`pb-2 px-4 ${standingsTab === 'drivers' ? 'border-b-2 border-f1-red text-f1-red' : ''}`}
            >
              Drivers
            </button>
            <button
              onClick={() => setStandingsTab('teams')}
              className={`pb-2 px-4 ${standingsTab === 'teams' ? 'border-b-2 border-f1-red text-f1-red' : ''}`}
            >
              Teams
            </button>
          </div>

          {standingsTab === 'drivers' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-f1-gray">
                    <th className="text-left p-2">Pos</th>
                    <th className="text-left p-2">Driver</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-right p-2">Points</th>
                    <th className="text-right p-2">Wins</th>
                    <th className="text-right p-2">Podiums</th>
                  </tr>
                </thead>
                <tbody>
                  {driverStandings.map((standing, idx) => (
                    <tr key={standing.id} className="border-b border-f1-gray hover:bg-f1-darker">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <Link to={`/drivers/${standing.driver_id}`} className="flex items-center space-x-2 hover:text-f1-red">
                          <img src={standing.drivers?.image_url} alt={standing.drivers?.name} className="w-10 h-10 rounded-full object-cover" />
                          <span>{standing.drivers?.name}</span>
                        </Link>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center space-x-2">
                          <img src={standing.teams?.logo_url} alt={standing.teams?.name} className="w-6 h-6 object-contain" />
                          <span>{standing.teams?.name}</span>
                        </div>
                      </td>
                      <td className="text-right p-2 font-bold">{standing.points}</td>
                      <td className="text-right p-2">{standing.wins}</td>
                      <td className="text-right p-2">{standing.podiums}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {standingsTab === 'teams' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-f1-gray">
                    <th className="text-left p-2">Pos</th>
                    <th className="text-left p-2">Team</th>
                    <th className="text-right p-2">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStandings.map((standing, idx) => (
                    <tr key={standing.id} className="border-b border-f1-gray hover:bg-f1-darker">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2">
                        <Link to={`/teams/${standing.team_id}`} className="flex items-center space-x-2 hover:text-f1-red">
                          <img src={standing.teams?.logo_url} alt={standing.teams?.name} className="w-10 h-10 object-contain" />
                          <span>{standing.teams?.name}</span>
                        </Link>
                      </td>
                      <td className="text-right p-2 font-bold">{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {races.filter(r => r.status === 'completed').map(race => (
            <Link key={race.id} to={`/results/${race.id}`} className="card block hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{race.name}</h3>
                  <p className="text-gray-400">{race.circuits?.name}</p>
                </div>
                <span className="text-f1-red">View Results →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'races' && (
        <div className="space-y-4">
          {races.map(race => (
            <Link key={race.id} to={`/races/${race.id}`} className="card block hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{race.name}</h3>
                  <p className="text-gray-400">{race.circuits?.name}</p>
                  <p className="text-sm">{new Date(race.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-4 py-2 rounded ${race.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                  {race.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map(driver => (
            <Link key={driver.id} to={`/drivers/${driver.driver_id}`} className="card hover:scale-105 transition-transform">
              <img src={driver.drivers?.image_url} alt={driver.drivers?.name} className="w-full h-48 object-cover rounded-lg mb-4" />
              <h3 className="text-xl font-bold mb-2">{driver.drivers?.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-400">Wins:</span> {driver.wins}</div>
                <div><span className="text-gray-400">Podiums:</span> {driver.podiums}</div>
                <div><span className="text-gray-400">Poles:</span> {driver.poles}</div>
                <div><span className="text-gray-400">DNFs:</span> {driver.dnfs}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
