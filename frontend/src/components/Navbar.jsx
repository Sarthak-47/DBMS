import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/')
  }

  const dashboardPath = {
    student:   '/dashboard/student',
    organiser: '/dashboard/organiser',
    admin:     '/dashboard/admin',
    faculty:   '/dashboard/student',
  }[user?.role] || '/auth'

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-[rgba(200,169,110,0.12)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold">
            <span className="text-gold">Ev</span><span className="text-white">enzo</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-muted font-body">
          <Link to="/events" className="hover:text-white transition-colors">Events</Link>
          <Link to="/events?category=Cultural" className="hover:text-white transition-colors">Clubs</Link>
          <Link to="/events" className="hover:text-white transition-colors">Calendar</Link>
          <Link to="/events?category=Technical" className="hover:text-white transition-colors">Results</Link>
          {user?.role === 'admin' && (
            <Link to="/dashboard/admin" className="hover:text-white transition-colors">Admin</Link>
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to={dashboardPath}
                className="text-sm text-muted hover:text-white transition-colors">
                {user.name}
              </Link>
              <button onClick={handleLogout}
                className="text-sm border border-[rgba(200,169,110,0.3)] text-gold px-4 py-2 rounded-lg hover:bg-gold/10 transition-colors">
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/auth" className="text-sm text-muted hover:text-white transition-colors">Login</Link>
              <Link to="/auth?mode=register" className="btn-gold text-sm px-5 py-2">Register Now</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-muted" onClick={() => setOpen(!open)}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-surface border-t border-[rgba(255,255,255,0.07)] px-6 py-4 flex flex-col gap-3 text-sm">
          <Link to="/events" className="text-muted hover:text-white" onClick={() => setOpen(false)}>Events</Link>
          <Link to="/events" className="text-muted hover:text-white" onClick={() => setOpen(false)}>Calendar</Link>
          {user
            ? <button onClick={handleLogout} className="text-left text-evred">Logout</button>
            : <Link to="/auth" className="btn-gold text-center" onClick={() => setOpen(false)}>Register Now</Link>
          }
        </div>
      )}
    </nav>
  )
}
