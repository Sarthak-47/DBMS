import { useState, createContext, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EvenzoAssistant from './EvenzoAssistant'

const SidebarCtx = createContext(false)
export const useCollapsed = () => useContext(SidebarCtx)

/* ── Per-role nav definitions ───────────────────────────────── */
const studentNav = [
  { to: '/dashboard',           label: 'Dashboard'        },
  { to: '/events',              label: 'Explore Events'   },
  { to: '/my-registrations',    label: 'My Registrations' },
  { to: '/teams',               label: 'My Teams'         },
  { to: '/profile',             label: 'My Profile'       },
]

const organiserNav = [
  { to: '/organizer/dashboard', label: 'Dashboard'        },
  { to: '/organizer/events',    label: 'My Events'        },
  { to: '/organizer/create',    label: 'Create Event'     },
  { to: '/profile',             label: 'My Profile'       },
]

const adminNav = [
  { to: '/admin/dashboard',     label: 'Dashboard'        },
  { to: '/admin/pending',       label: 'Pending Events'   },
  { to: '/admin/events',        label: 'All Events'       },
  { to: '/admin/venues',        label: 'Venues'           },
  { to: '/admin/registrations', label: 'Registrations'    },
  { to: '/profile',             label: 'My Profile'       },
]

function navFor(role) {
  if (role === 'organiser' || role === 'faculty') return organiserNav
  if (role === 'admin')                            return adminNav
  return studentNav
}

/* ── Sidebar ─────────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initials = (user?.name || '?')
    .split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const nav = navFor(user?.role)
  const cur = window.location.pathname

  return (
    <aside
      className={`min-h-screen bg-surface border-r border-[rgba(200,169,110,0.12)] flex flex-col
                  transition-all duration-200 flex-shrink-0
                  ${collapsed ? 'w-14' : 'w-[220px]'}`}>
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-[rgba(255,255,255,0.07)]">
        {!collapsed && (
          <Link to="/" className="font-display text-lg font-bold">
            <span className="text-gold">Ev</span><span className="text-white">enzo</span>
          </Link>
        )}
        <button onClick={onToggle}
          className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-white hover:bg-surface2 transition-colors ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />}
          </svg>
        </button>
      </div>

      {/* User info */}
      <div className={`border-b border-[rgba(255,255,255,0.07)] ${collapsed ? 'px-2 py-3' : 'px-4 py-4'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-medium text-xs flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-muted text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = cur === item.to || cur.startsWith(item.to + '/')
          return (
            <Link key={item.to} to={item.to}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-colors
                ${active ? 'bg-gold/10 text-gold border border-gold/20' : 'text-muted hover:text-white hover:bg-surface2'}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-gold' : 'bg-muted/40'}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button onClick={() => { logout(); navigate('/login') }}
          title={collapsed ? 'Logout' : undefined}
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-muted text-sm hover:text-evred hover:bg-evred/5 transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

/* ── Mobile overlay sidebar ──────────────────────────────────── */
function MobileSidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const nav = navFor(user?.role)
  const cur = window.location.pathname

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="relative w-64 bg-surface h-full flex flex-col border-r border-[rgba(200,169,110,0.12)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
          <Link to="/" className="font-display text-xl font-bold" onClick={onClose}>
            <span className="text-gold">Ev</span><span className="text-white">enzo</span>
          </Link>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">×</button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <Link key={item.to} to={item.to} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                ${cur === item.to ? 'bg-gold/10 text-gold' : 'text-muted hover:text-white hover:bg-surface2'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/40" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-5">
          <button onClick={() => { logout(); navigate('/login'); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted text-sm hover:text-evred">
            <span className="w-1.5 h-1.5 rounded-full bg-muted/40" />Logout
          </button>
        </div>
      </aside>
    </div>
  )
}

/* ── DashboardLayout (exported) ──────────────────────────────── */
export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('ev_sidebar_collapsed') === 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleCollapse() {
    const next = !collapsed
    localStorage.setItem('ev_sidebar_collapsed', String(next))
    setCollapsed(next)
  }

  return (
    <SidebarCtx.Provider value={collapsed}>
      <div className="flex min-h-screen bg-bg">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
        </div>

        {/* Mobile sidebar */}
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-[rgba(200,169,110,0.12)]">
            <button onClick={() => setMobileOpen(true)} className="text-muted hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-display text-base font-bold">
              <span className="text-gold">Ev</span><span className="text-white">enzo</span>
            </span>
          </div>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Floating AI assistant — role-aware */}
        <EvenzoAssistant />
      </div>
    </SidebarCtx.Provider>
  )
}
