import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import PaymentVerifyModal from '../components/PaymentVerifyModal'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OrganizerEvents() {
  const navigate = useNavigate()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [payModal, setPayModal] = useState(null)       // event object for payment verify modal
  const [pendingCounts, setPendingCounts] = useState({}) // event_id → pending count

  function load() {
    client.get('/events/my')
      .then(r => {
        setEvents(r.data)
        // Fetch pending payment counts for paid+approved events
        const paidApproved = r.data.filter(
          ev => parseFloat(ev.fee || 0) > 0 && ev.approval_status === 'Approved'
        )
        paidApproved.forEach(ev => {
          client.get(`/events/${ev.event_id}/pending-payments`)
            .then(res => setPendingCounts(prev => ({
              ...prev,
              [ev.event_id]: res.data.length,
            })))
            .catch(() => {})
        })
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return
    setDeleting(id)
    try {
      await client.delete(`/events/${id}`)
      load()
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Could not delete event.')
    } finally { setDeleting(null) }
  }

  function onPayModalClose() {
    setPayModal(null)
    // Refresh pending counts
    load()
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-7">
          <div>
            <h1 className="font-display text-3xl text-white mb-1">My Events</h1>
            <p className="text-muted text-sm">{events.length} event{events.length !== 1 ? 's' : ''} total</p>
          </div>
          <Link to="/organizer/create" className="btn-gold px-5 py-2.5 text-sm">+ New Event</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  {['Event', 'Date', 'Regs', 'Status', 'Approval', 'Actions'].map(h => (
                    <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => {
                  const isPaid    = parseFloat(ev.fee || 0) > 0
                  const isApproved = ev.approval_status === 'Approved'
                  const pendCount = pendingCounts[ev.event_id] ?? 0
                  return (
                    <tr key={ev.event_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{ev.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-muted text-xs capitalize">{ev.category}</p>
                          {isPaid && (
                            <span className="text-xs text-evamber">· ₹{ev.fee}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">{fmtDate(ev.start_datetime)}</td>
                      <td className="px-5 py-4 text-white">{ev.confirmed_count ?? 0}</td>
                      <td className="px-5 py-4"><span className={`badge-${ev.event_status}`}>{ev.event_status}</span></td>
                      <td className="px-5 py-4"><span className={`badge-${ev.approval_status ?? 'pending'}`}>{ev.approval_status ?? 'pending'}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {/* View button */}
                          <button onClick={() => navigate(`/events/${ev.event_id}`)} title="View event"
                            className="p-1.5 rounded-lg text-muted hover:text-gold hover:bg-gold/10 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Verify payments button — only for paid + approved events */}
                          {isPaid && isApproved && (
                            <button
                              onClick={() => setPayModal(ev)}
                              title="Verify payments"
                              className="relative p-1.5 rounded-lg text-muted hover:text-evamber hover:bg-evamber/10 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {pendCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-evamber text-bg text-[10px] font-bold flex items-center justify-center">
                                  {pendCount > 9 ? '9+' : pendCount}
                                </span>
                              )}
                            </button>
                          )}

                          {/* Delete button — only for pending events */}
                          {(!ev.approval_status || ev.approval_status === 'Pending') && (
                            <button onClick={() => deleteEvent(ev.event_id)} disabled={deleting === ev.event_id}
                              title="Delete event"
                              className="p-1.5 rounded-lg text-muted hover:text-evred hover:bg-evred/10 transition-colors disabled:opacity-40">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center text-muted">
            <p className="mb-3">No events created yet.</p>
            <Link to="/organizer/create" className="btn-gold text-xs px-5 py-2">Create Event</Link>
          </div>
        )}
      </div>

      {payModal && (
        <PaymentVerifyModal event={payModal} onClose={onPayModalClose} />
      )}
    </Sidebar>
  )
}
