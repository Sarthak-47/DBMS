import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'Date TBD'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPending() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState(null)

  function load() {
    client.get('/admin/pending')
      .then(r => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function approve(id) {
    setActing(id + '_a')
    try { await client.patch(`/admin/events/${id}/approve`); load() }
    catch (ex) { alert(ex.response?.data?.detail || 'Failed.') }
    finally { setActing(null) }
  }

  async function reject(id) {
    setActing(id + '_r')
    try { await client.patch(`/admin/events/${id}/reject`); load() }
    catch (ex) { alert(ex.response?.data?.detail || 'Failed.') }
    finally { setActing(null) }
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">Pending Events</h1>
          <p className="text-muted text-sm">
            {events.length} event{events.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(ev => (
              <div key={ev.event_id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium text-sm">{ev.title}</h3>
                      <span className="text-[10px] font-mono text-muted bg-surface2 px-1.5 py-0.5 rounded">#{ev.event_id}</span>
                    </div>
                    <p className="text-muted text-xs mt-0.5">{fmtDate(ev.start_datetime)}</p>
                  </div>
                  <span className="badge-pending flex-shrink-0">pending</span>
                </div>

                {ev.description && (
                  <p className="text-muted text-xs leading-relaxed mb-3 line-clamp-3">{ev.description}</p>
                )}

                <div className="space-y-1 text-xs mb-4">
                  {ev.organizer_name && (
                    <div className="flex gap-2">
                      <span className="text-muted w-20">Organizer</span>
                      <span className="text-white">{ev.organizer_name}</span>
                    </div>
                  )}
                  {ev.venue_name && (
                    <div className="flex gap-2">
                      <span className="text-muted w-20">Venue</span>
                      <span className="text-white">{ev.venue_name}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="text-muted w-20">Category</span>
                    <span className="text-white capitalize">{ev.category}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => approve(ev.event_id)} disabled={!!acting}
                    className="flex-1 py-2 rounded-lg bg-evgreen/10 text-evgreen border border-evgreen/20 text-xs font-medium hover:bg-evgreen/20 transition-colors disabled:opacity-50">
                    {acting === ev.event_id + '_a' ? 'Approving…' : 'Approve'}
                  </button>
                  <button onClick={() => reject(ev.event_id)} disabled={!!acting}
                    className="flex-1 py-2 rounded-lg bg-evred/10 text-evred border border-evred/20 text-xs font-medium hover:bg-evred/20 transition-colors disabled:opacity-50">
                    {acting === ev.event_id + '_r' ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center text-muted text-sm">
            All caught up — no pending events.
          </div>
        )}
      </div>
    </Sidebar>
  )
}
