import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import MetricCard from '../components/MetricCard'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrganizerDashboard() {
  const { user } = useAuthStore()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/dashboard/organizer')
      .then(r => setData(r.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="font-display text-3xl text-white mb-1">Organizer Dashboard</h1>
            <p className="text-muted text-sm">Welcome back, {user?.full_name?.split(' ')[0]}</p>
          </div>
          <Link to="/organizer/create" className="btn-gold px-5 py-2.5 text-sm">+ New Event</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <MetricCard label="Total Events"        value={data?.total_events          ?? 0} color="gold"  />
              <MetricCard label="Total Registrations" value={data?.total_registrations   ?? 0} color="green" />
              <MetricCard label="Pending Approval"    value={data?.pending_approval_count ?? 0} color="amber" />
            </div>

            {/* Recent Events */}
            <div className="card overflow-hidden mb-7">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
                <h2 className="font-display text-lg text-white">Recent Events</h2>
                <Link to="/organizer/events" className="text-xs text-gold hover:underline">View all →</Link>
              </div>

              {data?.recent_events?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      {['Event', 'Date', 'Registrations', 'Status', 'Approval'].map(h => (
                        <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_events.map(ev => (
                      <tr key={ev.event_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-white font-medium">{ev.title}</p>
                          <p className="text-muted text-xs capitalize">{ev.category}</p>
                        </td>
                        <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">{fmtDate(ev.start_datetime)}</td>
                        <td className="px-5 py-4 text-white text-sm">{ev.confirmed_count ?? 0}</td>
                        <td className="px-5 py-4"><span className={`badge-${ev.event_status}`}>{ev.event_status}</span></td>
                        <td className="px-5 py-4"><span className={`badge-${ev.approval_status ?? 'pending'}`}>{ev.approval_status ?? 'pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10 text-center text-muted text-sm">
                  No events yet.{' '}
                  <Link to="/organizer/create" className="text-gold hover:underline">Create your first event</Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/organizer/events" className="card p-5 hover:border-gold/30 transition-colors group">
                <h3 className="text-white font-medium text-sm mb-1 group-hover:text-gold transition-colors">Manage Events</h3>
                <p className="text-muted text-xs">View, track, and delete your events</p>
              </Link>
              <Link to="/organizer/create" className="card p-5 hover:border-gold/30 transition-colors group">
                <h3 className="text-white font-medium text-sm mb-1 group-hover:text-gold transition-colors">Create New Event</h3>
                <p className="text-muted text-xs">Launch a new event in 4 simple steps</p>
              </Link>
            </div>
          </>
        )}
      </div>
    </Sidebar>
  )
}
