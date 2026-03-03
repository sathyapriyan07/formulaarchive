import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user, isAdmin, refreshAdminStatus } = useAuth()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-3xl font-bold mb-6 text-f1-red">Profile</h1>
        
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm">Email</p>
            <p className="text-xl">{user?.email}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">Role</p>
            <p className="text-xl">{isAdmin ? 'Admin' : 'User'}</p>
          </div>

          <div>
            <p className="text-gray-400 text-sm">User ID</p>
            <p className="text-sm font-mono">{user?.id}</p>
          </div>

          <button onClick={refreshAdminStatus} className="btn-secondary">
            Refresh Role
          </button>
        </div>
      </div>
    </div>
  )
}
