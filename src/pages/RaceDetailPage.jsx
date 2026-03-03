import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function RaceDetailPage() {
  const { id } = useParams()
  const [race, setRace] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    const { data: raceData } = await supabase
      .from('races')
      .select('*, circuits(*)')
      .eq('id', id)
      .single()

    setRace(raceData)
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={2} className="h-64 mb-4" />

  return (
    <div>
      <div className="card mb-8">
        <img src={race?.circuits?.image_url} alt={race?.circuits?.name} className="w-full h-96 object-cover rounded-lg mb-6" />
        <h1 className="text-4xl font-bold mb-4">{race?.name}</h1>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-gray-400 text-sm">Circuit</p>
            <Link to={`/circuits/${race?.circuit_id}`} className="text-xl font-bold hover:text-f1-red">
              {race?.circuits?.name}
            </Link>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Date</p>
            <p className="text-xl font-bold">{race?.date ? new Date(race.date).toLocaleDateString() : 'TBA'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Status</p>
            <span className={`inline-block px-4 py-2 rounded ${race?.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}`}>
              {race?.status}
            </span>
          </div>
        </div>
        
        {race?.status === 'completed' && (
          <Link to={`/results/${race.id}`} className="btn-primary">
            View Results
          </Link>
        )}
      </div>
    </div>
  )
}
