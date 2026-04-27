import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const DASH = {
  student: '/dashboard', other_student: '/dashboard',
  organizer: '/organizer/dashboard', faculty: '/organizer/dashboard',
  admin: '/admin/dashboard',
}

export default function Navbar() {
  const { user, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  function logout() { clearAuth(); navigate('/login') }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur border-b border-[rgba(200,169,110,0.12)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl text-gold tracking-wide">Evenzo</Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-muted">
          <Link to="/events" className="hover:text-white transition-colors">Events</Link>
          <Link to="/#features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/#about" className="hover:text-white transition-colors">About</Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to={DASH[user.role] || '/dashboard'}
                className="text-sm text-muted hover:text-white transition-colors">
                {user.full_name?.split(' ')[0]}
              </Link>
              <button onClick={logout} className="btn-outline text-xs px-4 py-2">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-muted hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="btn-gold text-xs px-4 py-2">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
