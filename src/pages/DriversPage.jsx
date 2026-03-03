import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function DriversPage() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrivers()
  }, [])

  const fetchDrivers = async () => {
    const { data } = await supabase
      .from('drivers')
      .select('*')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
    setDrivers(data || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={12} className="h-64" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">Drivers</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {drivers.map(driver => (
          <Link key={driver.id} to={`/drivers/${driver.id}`} className="card hover:scale-105 transition-transform">
            <img src={driver.image_url} alt={driver.name} className="w-full h-48 object-cover rounded-lg mb-4" />
            <h2 className="text-xl font-bold">{driver.name || `${driver.first_name ?? ''} ${driver.last_name ?? ''}`.trim()}</h2>
            <p className="text-gray-400">#{driver.permanent_number || driver.number}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
