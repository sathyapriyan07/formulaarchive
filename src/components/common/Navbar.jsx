import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-f1-dark border-b border-f1-gray sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-bold text-f1-red">F1 Archive</Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/seasons" className="hover:text-f1-red transition">Seasons</Link>
            <Link to="/teams" className="hover:text-f1-red transition">Teams</Link>
            <Link to="/drivers" className="hover:text-f1-red transition">Drivers</Link>
            <Link to="/circuits" className="hover:text-f1-red transition">Circuits</Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="btn-primary">Admin</Link>
                )}
                <Link to="/profile" className="hover:text-f1-red transition">Profile</Link>
                <button onClick={handleSignOut} className="hover:text-f1-red transition">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-f1-red transition">Login</Link>
                <Link to="/signup" className="btn-primary">Sign Up</Link>
              </>
            )}
          </div>
        </div>

        <div className="md:hidden flex justify-around py-2 border-t border-f1-gray">
          <Link to="/seasons" className="text-sm hover:text-f1-red">Seasons</Link>
          <Link to="/teams" className="text-sm hover:text-f1-red">Teams</Link>
          <Link to="/drivers" className="text-sm hover:text-f1-red">Drivers</Link>
          <Link to="/circuits" className="text-sm hover:text-f1-red">Circuits</Link>
        </div>
      </div>
    </nav>
  )
}
