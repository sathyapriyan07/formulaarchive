import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function CircuitDetailPage() {
  const { id } = useParams()
  const [circuit, setCircuit] = useState(null)
  const [races, setRaces] = useState([])
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
      .select('*')
      .eq('circuit_id', id)
      .order('date', { ascending: false })

    setRaces(raceData || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={3} className="h-64 mb-4" />

  return (
    <div>
      <div className="card mb-8">
        <img src={circuit?.image_url} alt={circuit?.name} className="w-full h-96 object-cover rounded-lg mb-6" />
        <h1 className="text-4xl font-bold mb-4">{circuit?.name}</h1>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Country</p>
            <p className="text-xl font-bold">{circuit?.country}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Length</p>
            <p className="text-xl font-bold">{circuit?.length} km</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">First Race</p>
            <p className="text-xl font-bold">{circuit?.first_race_year}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold mb-4 text-f1-red">Race History</h2>
        <div className="space-y-2">
          {races.map(race => (
            <Link key={race.id} to={`/races/${race.id}`} className="block p-4 bg-f1-darker rounded-lg hover:bg-f1-gray transition">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">{race.name}</p>
                  <p className="text-sm text-gray-400">{new Date(race.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm ${race.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                  {race.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
