import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function CircuitDetailPage() {
  const { id } = useParams()
  const [circuit, setCircuit] = useState(null)
  const [races, setRaces] = useState([])
  const [winnerHistory, setWinnerHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: circuitData } = await supabase
      .from('circuits')
      .select('*')
      .eq('id', id)
      .single()

    setCircuit(circuitData)

    const { data: raceData } = await supabase
      .from('races')
      .select('*, seasons(year)')
      .eq('circuit_id', id)
      .order('date', { ascending: false })

    setRaces(raceData || [])

    if (raceData?.length) {
      const raceIds = raceData.map((race) => race.id)
      const { data: winners } = await supabase
        .from('race_results')
        .select('race_id, driver_id, drivers(name), races(name, date, seasons(year))')
        .in('race_id', raceIds)
        .eq('position', 1)
        .order('race_id', { ascending: false })
      setWinnerHistory(winners || [])
    } else {
      setWinnerHistory([])
    }
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  return (
    <div>
      <div className="card mb-8">
        <img src={circuit?.layout_image_url} alt={circuit?.name} className="w-full h-96 object-cover rounded-lg mb-6" />
        <h1 className="text-4xl font-bold mb-4">{circuit?.name}</h1>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Country</p>
            <p className="text-xl font-bold">{circuit?.country}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Locality</p>
            <p className="text-xl font-bold">{circuit?.locality || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Length</p>
            <p className="text-xl font-bold">{circuit?.length_km} km</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">First Race</p>
            <p className="text-xl font-bold">{circuit?.first_race_year}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Times Hosted</p>
            <p className="text-xl font-bold">{races.length}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Race History</h2>
        <div className="space-y-2">
          {races.map(race => (
            <Link key={race.id} to={`/seasons/${race.seasons?.year}/races/${race.id}`} className="block p-4 bg-f1-darker rounded-lg hover:bg-f1-gray transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{race.name}</p>
                  <p className="text-sm text-gray-400">{race.seasons?.year} · {new Date(race.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${race.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                  {race.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Winners History</h2>
        <div className="space-y-2">
          {winnerHistory.map((winner, idx) => (
            <p key={`${winner.race_id}-${idx}`} className="rounded bg-f1-darker p-3">
              {winner.races?.seasons?.year}: {winner.drivers?.name} ({winner.races?.name})
            </p>
          ))}
          {!winnerHistory.length ? <p className="text-gray-400">No completed winner data yet.</p> : null}
        </div>
      </div>
    </div>
  )
}
