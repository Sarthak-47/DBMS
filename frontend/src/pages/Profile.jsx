import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

const ROLE_LABELS = {
  student:       'SRM Student',
  other_student: 'Other College',
  organizer:     'Organizer',
  faculty:       'Faculty',
  admin:         'Admin',
}

const ROLE_COLORS = {
  student:       'bg-gold/10 text-gold border-gold/20',
  other_student: 'bg-evamber/10 text-evamber border-evamber/20',
  organizer:     'bg-evgreen/10 text-evgreen border-evgreen/20',
  faculty:       'bg-evgreen/10 text-evgreen border-evgreen/20',
  admin:         'bg-evred/10 text-evred border-evred/20',
}

export default function Profile() {
  const { user: authUser } = useAuthStore()
  const [user, setUser]       = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      client.get('/auth/me'),
      client.get('/registrations/my'),
    ]).then(([me, regs]) => {
      setUser(me.data)
      setActivity(regs.data.slice(0, 10))
    }).catch(() => {
      setUser(authUser)
    }).finally(() => setLoading(false))
  }, [])

  const u = user || authUser
  if (!u) return null

  const initials = u.full_name
    ? u.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const roleLabel = ROLE_LABELS[u.role] || u.role
  const roleCls   = ROLE_COLORS[u.role]  || 'bg-gold/10 text-gold border-gold/20'

  return (
    <Sidebar>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">My Profile</h1>
          <p className="text-muted text-sm">Your account information and activity</p>
        </div>

        {/* Avatar block */}
        <div className="card p-6 mb-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gold/20 border-2 border-gold/30 flex items-center justify-center text-gold font-display text-2xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-white font-medium text-lg">{u.full_name}</h2>
            <p className="text-muted text-sm mb-2">{u.email}</p>
            <span className={`text-xs border px-2.5 py-0.5 rounded-full font-medium ${roleCls}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Role-specific details */}
        <div className="card p-5 mb-5">
          <h3 className="font-display text-base text-white mb-4">Account Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {u.role === 'student' && (
              <>
                <InfoCell label="Reg No."    val={u.reg_no     || '—'} />
                <InfoCell label="Department" val={u.department || '—'} />
                <InfoCell label="Year"       val={u.year       || '—'} />
                <InfoCell label="Course"     val={u.course     || '—'} />
                <InfoCell label="Phone"      val={u.phone      || '—'} />
              </>
            )}
            {u.role === 'other_student' && (
              <>
                <InfoCell label="College" val={u.college_name || '—'} />
                <InfoCell label="City"    val={u.city         || '—'} />
                <InfoCell label="Year"    val={u.year         || '—'} />
                <InfoCell label="Course"  val={u.course       || '—'} />
                <InfoCell label="Phone"   val={u.phone        || '—'} />
              </>
            )}
            {(u.role === 'organizer' || u.role === 'faculty') && (
              <>
                <InfoCell label="Org / Club"  val={u.org_name    || '—'} />
                <InfoCell label="Department"  val={u.department  || '—'} />
                <InfoCell label="Designation" val={u.designation || '—'} />
                <InfoCell label="Org Type"    val={u.org_type    || '—'} />
                <InfoCell label="Org Role"    val={u.org_role    || '—'} />
                <InfoCell label="Phone"       val={u.phone       || '—'} />
              </>
            )}
            {u.role === 'admin' && (
              <>
                <InfoCell label="Phone"   val={u.phone       || '—'} />
                <InfoCell label="User ID" val={`#${u.user_id}`} />
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
            <h3 className="font-display text-base text-white">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activity.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  {['Event', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity.map(r => (
                  <tr key={r.reg_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                    <td className="px-5 py-3 text-white text-sm">{r.title}</td>
                    <td className="px-5 py-3 text-muted text-xs whitespace-nowrap">
                      {r.start_datetime
                        ? new Date(r.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'TBD'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge-${r.status}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted text-sm text-center py-8">No activity yet.</p>
          )}
        </div>
      </div>
    </Sidebar>
  )
}

function InfoCell({ label, val }) {
  return (
    <div className="bg-surface2 rounded-xl p-3">
      <p className="text-muted text-xs mb-0.5">{label}</p>
      <p className="text-white text-sm font-medium">{val}</p>
    </div>
  )
}
