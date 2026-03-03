import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function TeamDetailPage() {
  const { id } = useParams()
  const [team, setTeam] = useState(null)
  const [currentDrivers, setCurrentDrivers] = useState([])
  const [pastDrivers, setPastDrivers] = useState([])
  const [seasonStats, setSeasonStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single()

    setTeam(teamData)

    const currentYear = new Date().getFullYear()

    const { data: current } = await supabase
      .from('driver_season_stats')
      .select('*, drivers(*)')
      .eq('team_id', id)
      .eq('season_id', currentYear)

    setCurrentDrivers(current || [])

    const { data: past } = await supabase
      .from('driver_season_stats')
      .select('driver_id, drivers(*)')
      .eq('team_id', id)
      .neq('season_id', currentYear)

    const uniquePast = [...new Map(past?.map(item => [item.driver_id, item]) || []).values()]
    setPastDrivers(uniquePast)

    const { data: stats } = await supabase
      .from('team_season_stats')
      .select('*')
      .eq('team_id', id)
      .order('season_id', { ascending: false })

    setSeasonStats(stats || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  return (
    <div>
      <div className="card mb-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex items-center justify-center">
            <img src={team?.logo_url} alt={team?.name} className="max-h-64 object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-4xl font-bold mb-4">{team?.name}</h1>
            {team?.car_image_url && (
              <img src={team.car_image_url} alt="Car" className="w-full rounded-lg mb-4" />
            )}
            <p className="text-xl text-gray-400">Championships: <span className="text-f1-red font-bold">{team?.championships || 0}</span></p>
          </div>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Current Drivers</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {currentDrivers.map(driver => (
            <Link key={driver.id} to={`/drivers/${driver.driver_id}`} className="flex items-center space-x-4 p-4 bg-f1-darker rounded-lg hover:bg-f1-gray transition">
              <img src={driver.drivers?.image_url} alt={driver.drivers?.name} className="w-20 h-20 rounded-full object-cover" />
              <div>
                <p className="font-bold text-lg">{driver.drivers?.name}</p>
                <p className="text-gray-400">#{driver.drivers?.number}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {pastDrivers.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold mb-4 text-f1-red">Past Drivers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {pastDrivers.map(driver => (
              <Link key={driver.driver_id} to={`/drivers/${driver.driver_id}`} className="text-center hover:scale-105 transition">
                <img src={driver.drivers?.image_url} alt={driver.drivers?.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                <p className="text-sm">{driver.drivers?.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Season History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-f1-gray">
                <th className="text-left p-2">Season</th>
                <th className="text-right p-2">Position</th>
                <th className="text-right p-2">Points</th>
              </tr>
            </thead>
            <tbody>
              {seasonStats.map(stat => (
                <tr key={stat.id} className="border-b border-f1-gray hover:bg-f1-darker">
                  <td className="p-2">
                    <Link to={`/seasons/${stat.season_id}`} className="hover:text-f1-red">{stat.season_id}</Link>
                  </td>
                  <td className="text-right p-2">{stat.position || '-'}</td>
                  <td className="text-right p-2 font-bold">{stat.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
