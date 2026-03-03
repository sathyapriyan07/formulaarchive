import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import LoadingSkeleton from '../components/common/LoadingSkeleton'

export default function TeamsPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data } = await supabase
      .from('teams')
      .select('*')
      .order('active_to', { ascending: false, nullsFirst: true })
      .order('active_from', { ascending: false, nullsFirst: true })
      .order('name', { ascending: true })
    setTeams(data || [])
    setLoading(false)
  }

  if (loading) return <LoadingSkeleton count={10} className="h-48" />

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8 text-f1-red">Teams</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <Link key={team.id} to={`/teams/${team.id}`} className="card hover:scale-105 transition-transform">
            <div className="flex items-center justify-center h-32 mb-4">
              <img src={team.logo_url} alt={team.name} className="max-h-full max-w-full object-contain" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">{team.name}</h2>
            <p className="text-center text-sm text-gray-400">{team.nationality || 'Nationality N/A'}</p>
            <span className="block text-center text-xs text-gray-500 mt-1">
              {team.active_from || '-'} - {team.active_to || 'Present'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
