import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const studentNav = [
  { to: '/dashboard/student',                   label: 'Dashboard' },
  { to: '/events',                              label: 'Discover Events' },
  { to: '/dashboard/student#registrations',     label: 'My Registrations' },
  { to: '/dashboard/student#waitlists',         label: 'Waitlists' },
  { to: '/dashboard/student#results',           label: 'Results & Ranks' },
  { to: '/dashboard/student#certificates',      label: 'Certificates' },
  { to: '/dashboard/student#teams',             label: 'My Teams' },
  { to: '/dashboard/student#notifications',     label: 'Notifications' },
]

const organiserNav = [
  { to: '/dashboard/organiser',                 label: 'Overview' },
  { to: '/dashboard/organiser#events',          label: 'My Events' },
  { to: '/dashboard/organiser#participants',    label: 'Participants' },
  { to: '/dashboard/organiser#results',         label: 'Results & Rankings' },
  { to: '/dashboard/organiser#certificates',    label: 'Certificate Builder' },
  { to: '/dashboard/organiser#export',          label: 'Export Data' },
  { to: '/dashboard/organiser#notify',          label: 'Send Notification' },
]

const adminNav = [
  { to: '/dashboard/admin',            label: 'Overview' },
  { to: '/dashboard/admin#events',     label: 'All Events' },
  { to: '/dashboard/admin#clubs',      label: 'All Clubs' },
  { to: '/dashboard/admin#users',      label: 'All Users' },
  { to: '/dashboard/admin#approvals',  label: 'Approvals' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'organiser' ? organiserNav :
    user?.role === 'admin'     ? adminNav :
    studentNav

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <aside className="w-[220px] min-h-screen bg-surface border-r border-[rgba(200,169,110,0.12)] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.07)]">
        <span className="font-display text-xl font-bold">
          <span className="text-gold">Ev</span><span className="text-white">enzo</span>
        </span>
        {user?.role === 'organiser' && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-evgreen inline-block" />
            <span className="text-xs text-evgreen">Verified Club</span>
          </div>
        )}
        {user?.role === 'admin' && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
            <span className="text-xs text-gold">Administrator</span>
          </div>
        )}
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold font-medium text-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-muted text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <a
            key={item.to + item.label}
            href={item.to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted text-sm hover:text-white hover:bg-surface2 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold/40 flex-shrink-0" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={() => { logout(); navigate('/') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted text-sm hover:text-evred hover:bg-evred/5 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-muted/40 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
