import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const STUDENT_NAV = [
  { label: 'Dashboard',        to: '/dashboard' },
  { label: 'Explore Events',   to: '/events' },
  { label: 'My Registrations', to: '/my-registrations' },
  { label: 'My Teams',         to: '/teams' },
]
const ORG_NAV = [
  { label: 'Dashboard',   to: '/organizer/dashboard' },
  { label: 'My Events',   to: '/organizer/events' },
  { label: 'Create Event',to: '/organizer/create' },
]
const ADMIN_NAV = [
  { label: 'Dashboard',      to: '/admin/dashboard' },
  { label: 'Pending Events', to: '/admin/pending' },
  { label: 'All Events',     to: '/admin/events' },
  { label: 'Venues',         to: '/admin/venues' },
  { label: 'Registrations',  to: '/admin/registrations' },
]

function getNav(role) {
  if (role === 'admin')                       return ADMIN_NAV
  if (role === 'organizer' || role === 'faculty') return ORG_NAV
  return STUDENT_NAV
}

const ROLE_LABELS = {
  student: 'Student', other_student: 'Student', organizer: 'Organiser',
  faculty: 'Faculty', admin: 'Admin',
}

export default function Sidebar({ children }) {
  const { user, clearAuth } = useAuthStore()
  const location = useNavigate ? useLocation() : { pathname: '' }
  const navigate  = useNavigate()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('ev_sidebar') === '1'
  )
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    localStorage.setItem('ev_sidebar', collapsed ? '1' : '0')
  }, [collapsed])

  function logout() { clearAuth(); navigate('/login') }

  const nav = getNav(user?.role)
  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
    : '?'

  return (
    <div className="flex min-h-screen bg-bg font-body">
      {/* Mobile overlay */}
      {mobile && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobile(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 bg-surface border-r border-[rgba(200,169,110,0.12)]
        transition-all duration-200 flex flex-col
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
        ${mobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo row */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.05)] ${collapsed ? 'justify-center' : ''}`}>
          {!collapsed && (
            <span className="font-display text-gold text-lg tracking-wide">Evenzo</span>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-muted hover:text-white transition-colors p-1"
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User block */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-medium flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.full_name}</p>
                <p className="text-muted text-[10px]">{ROLE_LABELS[user?.role]}</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-3 border-b border-[rgba(255,255,255,0.05)]">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-medium">
              {initials}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(({ label, to }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + '/')
            return (
              <Link key={to} to={to}
                onClick={() => setMobile(false)}
                className={active ? 'nav-link-active' : 'nav-link'}
                title={collapsed ? label : undefined}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-gold' : 'bg-muted/30'}`} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}

          <div className="pt-2 border-t border-[rgba(255,255,255,0.05)] mt-2">
            <Link to="/profile"
              onClick={() => setMobile(false)}
              className={location.pathname === '/profile' ? 'nav-link-active' : 'nav-link'}
              title={collapsed ? 'Profile' : undefined}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${location.pathname === '/profile' ? 'bg-gold' : 'bg-muted/30'}`} />
              {!collapsed && <span>My Profile</span>}
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button onClick={logout}
            className="nav-link w-full"
            title={collapsed ? 'Logout' : undefined}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-200 ${collapsed ? 'md:ml-[60px]' : 'md:ml-[220px]'}`}>
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-[rgba(200,169,110,0.12)]">
          <button onClick={() => setMobile(true)} className="text-muted hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-gold text-base">Evenzo</span>
        </div>

        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
