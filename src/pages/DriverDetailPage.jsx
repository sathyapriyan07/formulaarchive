import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function DriverDetailPage() {
  const { id } = useParams()
  const [driver, setDriver] = useState(null)
  const [currentTeam, setCurrentTeam] = useState(null)
  const [pastTeams, setPastTeams] = useState([])
  const [seasonStats, setSeasonStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: driverData } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()

    setDriver(driverData)

    const currentYear = new Date().getFullYear()

    const { data: current } = await supabase
      .from('driver_season_stats')
      .select('*, teams(*)')
      .eq('driver_id', id)
      .eq('season_id', currentYear)
      .single()

    setCurrentTeam(current?.teams)

    const { data: past } = await supabase
      .from('driver_season_stats')
      .select('team_id, teams(*)')
      .eq('driver_id', id)
      .neq('season_id', currentYear)

    const uniquePast = [...new Map(past?.map(item => [item.team_id, item.teams]) || []).values()]
    setPastTeams(uniquePast)

    const { data: stats } = await supabase
      .from('driver_season_stats')
      .select('*, teams(*)')
      .eq('driver_id', id)
      .order('season_id', { ascending: false })

    setSeasonStats(stats || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  const totalStats = seasonStats.reduce((acc, stat) => ({
    championships: acc.championships + (stat.position === 1 ? 1 : 0),
    wins: acc.wins + stat.wins,
    podiums: acc.podiums + stat.podiums,
    poles: acc.poles + stat.poles,
    dnfs: acc.dnfs + stat.dnfs
  }), { championships: 0, wins: 0, podiums: 0, poles: 0, dnfs: 0 })

  return (
    <div>
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <img src={driver?.image_url} alt={driver?.name} className="w-full h-96 object-cover rounded-lg" />
          <div className="flex flex-col justify-center space-y-4">
            <h1 className="text-4xl font-bold">{driver?.name}</h1>
            <p className="text-xl text-gray-400">#{driver?.number}</p>
            <p className="text-gray-400">Born: {driver?.dob ? new Date(driver.dob).toLocaleDateString() : 'N/A'}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-f1-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Championships</p>
                <p className="text-3xl font-bold text-f1-red">{totalStats.championships}</p>
              </div>
              <div className="bg-f1-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Wins</p>
                <p className="text-3xl font-bold">{totalStats.wins}</p>
              </div>
              <div className="bg-f1-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Podiums</p>
                <p className="text-3xl font-bold">{totalStats.podiums}</p>
              </div>
              <div className="bg-f1-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Poles</p>
                <p className="text-3xl font-bold">{totalStats.poles}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Teams</h2>
        <div className="space-y-4">
          {currentTeam && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Current Team</p>
              <Link to={`/teams/${currentTeam.id}`} className="flex items-center space-x-4 p-4 bg-f1-darker rounded-lg hover:bg-f1-gray transition">
                <img src={currentTeam.logo_url} alt={currentTeam.name} className="w-16 h-16 object-contain" />
                <p className="font-bold text-lg">{currentTeam.name}</p>
              </Link>
            </div>
          )}
          
          {pastTeams.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Past Teams</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {pastTeams.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`} className="p-4 bg-f1-darker rounded-lg hover:bg-f1-gray transition">
                    <img src={team.logo_url} alt={team.name} className="w-full h-16 object-contain" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Season Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-f1-gray">
                <th className="text-left p-2">Season</th>
                <th className="text-left p-2">Team</th>
                <th className="text-right p-2">Pos</th>
                <th className="text-right p-2">Points</th>
                <th className="text-right p-2">Wins</th>
                <th className="text-right p-2">Podiums</th>
                <th className="text-right p-2">Poles</th>
              </tr>
            </thead>
            <tbody>
              {seasonStats.map(stat => (
                <tr key={stat.id} className="border-b border-f1-gray hover:bg-f1-darker">
                  <td className="p-2">
                    <Link to={`/seasons/${stat.season_id}`} className="hover:text-f1-red">{stat.season_id}</Link>
                  </td>
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <img src={stat.teams?.logo_url} alt={stat.teams?.name} className="w-6 h-6 object-contain" />
                      <span>{stat.teams?.name}</span>
                    </div>
                  </td>
                  <td className="text-right p-2">{stat.position || '-'}</td>
                  <td className="text-right p-2 font-bold">{stat.points}</td>
                  <td className="text-right p-2">{stat.wins}</td>
                  <td className="text-right p-2">{stat.podiums}</td>
                  <td className="text-right p-2">{stat.poles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
