import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function HomePage() {
  const [nextRace, setNextRace] = useState(null)
  const [driverStandings, setDriverStandings] = useState([])
  const [teamStandings, setTeamStandings] = useState([])
  const [activeTab, setActiveTab] = useState('drivers')
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (nextRace?.date) {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const raceDate = new Date(nextRace.date).getTime()
        const distance = raceDate - now

        if (distance < 0) {
          setCountdown('Race Started!')
          clearInterval(timer)
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24))
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
          setCountdown(`${days}d ${hours}h ${minutes}m`)
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [nextRace])

  const fetchData = async () => {
    const currentYear = new Date().getFullYear()
    const { data: season } = await supabase.from('seasons').select('id, year').eq('year', currentYear).maybeSingle()
    const seasonId = season?.id

    if (seasonId) {
      const { data: races } = await supabase
        .from('races')
        .select('*, circuits(*), seasons(year)')
        .eq('season_id', seasonId)
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1)

      if (races?.[0]) setNextRace(races[0])

      const { data: drivers } = await supabase
        .from('driver_season_stats')
        .select('*, drivers(*), teams(*)')
        .eq('season_id', seasonId)
        .order('points', { ascending: false })
        .limit(5)

      setDriverStandings(drivers || [])

      const { data: teams } = await supabase
        .from('team_season_stats')
        .select('*, teams(*)')
        .eq('season_id', seasonId)
        .order('points', { ascending: false })
        .limit(5)

      setTeamStandings(teams || [])
    }
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  return (
    <div className="space-y-8">
      {nextRace && (
        <section className="card">
          <h2 className="text-3xl font-bold mb-6 text-f1-red">Next Race</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <img 
              src={nextRace.circuits?.layout_image_url} 
              alt={nextRace.circuits?.name}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="flex flex-col justify-center space-y-4">
              <h3 className="text-2xl font-bold">{nextRace.name}</h3>
              <p className="text-gray-400">{nextRace.circuits?.name}</p>
              <p className="text-lg">{new Date(nextRace.date).toLocaleDateString()}</p>
              <div className="text-3xl font-bold text-f1-red">{countdown}</div>
              <Link to={`/seasons/${nextRace.seasons?.year}/races/${nextRace.id}`} className="btn-primary w-fit">View Details</Link>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-f1-red">Current Standings</h2>
          <Link to="/seasons" className="btn-secondary">View Full Standings</Link>
        </div>

        <div className="flex space-x-4 mb-6 border-b border-f1-gray">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`pb-2 px-4 ${activeTab === 'drivers' ? 'border-b-2 border-f1-red text-f1-red' : ''}`}
          >
            Drivers
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-2 px-4 ${activeTab === 'teams' ? 'border-b-2 border-f1-red text-f1-red' : ''}`}
          >
            Teams
          </button>
        </div>

        {activeTab === 'drivers' && (
          <div className="space-y-4">
            {driverStandings.map((standing, idx) => (
              <div key={standing.id} className="flex items-center space-x-4 p-4 bg-f1-darker rounded-lg">
                <span className="text-2xl font-bold text-gray-500 w-8">{idx + 1}</span>
                <img src={standing.drivers?.image_url} alt={standing.drivers?.name} className="w-16 h-16 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-bold">{standing.drivers?.name}</p>
                  <div className="flex items-center space-x-2">
                    <img src={standing.teams?.logo_url} alt={standing.teams?.name} className="w-6 h-6 object-contain" />
                    <p className="text-sm text-gray-400">{standing.teams?.name}</p>
                  </div>
                </div>
                <span className="text-xl font-bold">{standing.points}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-4">
            {teamStandings.map((standing, idx) => (
              <div key={standing.id} className="flex items-center space-x-4 p-4 bg-f1-darker rounded-lg">
                <span className="text-2xl font-bold text-gray-500 w-8">{idx + 1}</span>
                <img src={standing.teams?.logo_url} alt={standing.teams?.name} className="w-16 h-16 object-contain" />
                <p className="flex-1 font-bold">{standing.teams?.name}</p>
                <span className="text-xl font-bold">{standing.points}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
