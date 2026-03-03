import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function RacesPage() {
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRaces()
  }, [])

  const fetchRaces = async () => {
    const { data } = await supabase
      .from('races')
      .select('*, circuits(*)')
      .order('date', { ascending: false })
    setRaces(data || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={10} className="h-32" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">Races</h1>
      <div className="space-y-4">
        {races.map(race => (
          <Link key={race.id} to={`/races/${race.id}`} className="card block hover:scale-[1.02] transition-transform">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{race.name}</h2>
                <p className="text-gray-400">{race.circuits?.name}</p>
                <p className="text-sm text-gray-500">{new Date(race.date).toLocaleDateString()}</p>
              </div>
              <span className={`px-4 py-2 rounded ${race.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                {race.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
