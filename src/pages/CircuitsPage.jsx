import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCircuits()
  }, [])

  const fetchCircuits = async () => {
    const { data } = await supabase
      .from('circuits')
      .select('*')
      .order('name', { ascending: true })
    setCircuits(data || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={12} className="h-64" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">Circuits</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuits.map(circuit => (
          <Link key={circuit.id} to={`/circuits/${circuit.id}`} className="card hover:scale-105 transition-transform">
            <img src={circuit.layout_image_url} alt={circuit.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-bold mb-2">{circuit.name}</h2>
            <p className="text-gray-400">{circuit.locality ? `${circuit.locality}, ${circuit.country}` : circuit.country}</p>
            <p className="text-sm text-gray-500">First race: {circuit.first_race_year}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
