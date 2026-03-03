import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeasons()
  }, [])

  const fetchSeasons = async () => {
    const { data } = await supabase
      .from('seasons')
      .select('*')
      .order('year', { ascending: false })
    setSeasons(data || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={12} className="h-32" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">Seasons</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {seasons.map(season => (
          <Link
            key={season.year}
            to={`/seasons/${season.year}`}
            className="card text-center hover:scale-105 transition-transform"
          >
            <h2 className="text-3xl font-bold">{season.year}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
