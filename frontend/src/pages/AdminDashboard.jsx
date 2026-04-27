import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import MetricCard from '../components/MetricCard'
import client from '../api/client'

export default function AdminDashboard() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(null)

  function load() {
    client.get('/dashboard/admin')
      .then(r => setData(r.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function approve(eventId) {
    setActing(eventId + '_a')
    try { await client.patch(`/admin/events/${eventId}/approve`); load() }
    catch (ex) { alert(ex.response?.data?.detail || 'Failed to approve.') }
    finally { setActing(null) }
  }

  async function reject(eventId) {
    setActing(eventId + '_r')
    try { await client.patch(`/admin/events/${eventId}/reject`); load() }
    catch (ex) { alert(ex.response?.data?.detail || 'Failed to reject.') }
    finally { setActing(null) }
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="font-display text-3xl text-white mb-1">Admin Dashboard</h1>
            <p className="text-muted text-sm">Platform overview and moderation</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/venues" className="px-4 py-2 rounded-lg border border-[rgba(200,169,110,0.2)] text-gold text-sm hover:bg-gold/5 transition-colors">
              Manage Venues
            </Link>
            <Link to="/admin/events" className="btn-gold px-4 py-2 text-sm">All Events</Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Total Events"      value={data?.total_events        ?? 0} color="gold"  />
              <MetricCard label="Pending Approval"  value={data?.pending_count        ?? 0} color="amber" />
              <MetricCard label="Total Students"    value={data?.total_students       ?? 0} color="green" />
              <MetricCard label="All Registrations" value={data?.total_registrations  ?? 0} color="gold"  />
            </div>

            {/* Pending queue */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-white">Pending Approvals</h2>
                {(data?.pending_count || 0) > 3 && (
                  <Link to="/admin/pending" className="text-xs text-gold hover:underline">View all →</Link>
                )}
              </div>

              {data?.pending_events?.length > 0 ? (
                <div className="space-y-3">
                  {data.pending_events.slice(0, 5).map(ev => (
                    <div key={ev.event_id} className="card p-5">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium text-sm">{ev.title}</h3>
                            <span className="text-[10px] font-mono text-muted bg-surface2 px-2 py-0.5 rounded">#{ev.event_id}</span>
                          </div>
                          <p className="text-muted text-xs">
                            {ev.organizer_name && <span>by {ev.organizer_name} · </span>}
                            {ev.venue_name && <span>{ev.venue_name} · </span>}
                            <span className="capitalize">{ev.category}</span>
                          </p>
                          {ev.description && (
                            <p className="text-muted text-xs line-clamp-2 mt-1">{ev.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approve(ev.event_id)} disabled={!!acting}
                            className="px-4 py-1.5 rounded-lg bg-evgreen/10 text-evgreen border border-evgreen/20 text-xs font-medium hover:bg-evgreen/20 transition-colors disabled:opacity-50">
                            {acting === ev.event_id + '_a' ? '…' : 'Approve'}
                          </button>
                          <button onClick={() => reject(ev.event_id)} disabled={!!acting}
                            className="px-4 py-1.5 rounded-lg bg-evred/10 text-evred border border-evred/20 text-xs font-medium hover:bg-evred/20 transition-colors disabled:opacity-50">
                            {acting === ev.event_id + '_r' ? '…' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-muted text-sm">No pending approvals.</div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Pending Events',  sub: `${data?.pending_count ?? 0} awaiting`,  to: '/admin/pending' },
                { label: 'All Events',      sub: `${data?.total_events ?? 0} total`,       to: '/admin/events' },
                { label: 'Venues',          sub: 'Add or remove venues',                   to: '/admin/venues' },
                { label: 'Registrations',   sub: 'Full audit log',                         to: '/admin/registrations' },
              ].map(link => (
                <Link key={link.to} to={link.to} className="card p-4 hover:border-gold/30 transition-colors group">
                  <p className="text-white text-xs font-medium group-hover:text-gold transition-colors">{link.label}</p>
                  <p className="text-muted text-xs mt-0.5">{link.sub}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Sidebar>
  )
}
