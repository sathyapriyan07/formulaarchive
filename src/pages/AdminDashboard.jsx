import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect } from 'react'

export default function AdminDashboard() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/')
    }
  }, [isAdmin, loading, navigate])

  if (loading) return <div>Loading...</div>
  if (!isAdmin) return null

  const sections = [
    { name: 'Seasons', path: '/admin/seasons', icon: 'SEASON' },
    { name: 'Teams', path: '/admin/teams', icon: 'TEAM' },
    { name: 'Drivers', path: '/admin/drivers', icon: 'DRIVER' },
    { name: 'Circuits', path: '/admin/circuits', icon: 'CIRCUIT' },
    { name: 'Races', path: '/admin/races', icon: 'RACE' },
    { name: 'Results', path: '/admin/results', icon: 'RESULT' },
    { name: 'Import', path: '/admin/import', icon: 'IMPORT' },
  ]

  return (
    <div>
      <h1 className="mb-8 text-4xl font-bold text-f1-red">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <Link key={section.path} to={section.path} className="card text-center transition-transform hover:scale-105">
            <div className="mb-4 text-3xl font-bold text-f1-red">{section.icon}</div>
            <h2 className="text-2xl font-bold">{section.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  )
}
