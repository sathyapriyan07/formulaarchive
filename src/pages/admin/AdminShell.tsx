import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { label: 'Dashboard Overview', to: '/admin' },
  { label: 'Manage Seasons', to: '/admin/seasons' },
  { label: 'Manage Teams', to: '/admin/teams' },
  { label: 'Manage Drivers', to: '/admin/drivers' },
  { label: 'Manage Circuits', to: '/admin/circuits' },
  { label: 'Manage Races', to: '/admin/races' },
  { label: 'Manage Results', to: '/admin/results' },
  { label: 'Manage Standings', to: '/admin/standings' },
  { label: 'Driver-Team Assignments', to: '/admin/assignments' },
  { label: 'API Import (Single Season)', to: '/admin/import-single' },
  { label: 'Historical Bulk Import', to: '/admin/import' },
  { label: 'Recalculate Standings', to: '/admin/recalculate' },
  { label: 'Integrity Check', to: '/admin/integrity' },
  { label: 'System Logs', to: '/admin/logs' },
]

export default function AdminShell() {
  const { isAdmin, loading } = useAuth() as { isAdmin: boolean; loading: boolean }
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/')
    }
  }, [isAdmin, loading, navigate])

  if (loading) return <div>Loading...</div>
  if (!isAdmin) return null

  return (
    <div className="grid min-h-[70vh] gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="max-h-[80vh] overflow-auto rounded-lg border border-f1-gray/60 bg-f1-dark p-3">
        <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">Admin Controls</p>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm transition-colors ${isActive ? 'bg-f1-red text-white' : 'text-gray-200 hover:bg-f1-gray/60'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
