import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

export default function MyRegistrations() {
  const [regs, setRegs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(null)

  function load() {
    client.get('/registrations/my')
      .then(r => setRegs(r.data))
      .catch(() => setRegs([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function cancel(regId) {
    if (!confirm('Cancel this registration?')) return
    setCancelling(regId)
    try {
      await client.patch(`/registrations/${regId}/cancel`)
      load()
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Could not cancel.')
    } finally { setCancelling(null) }
  }

  const active = regs.filter(r => r.status !== 'cancelled').length

  return (
    <Sidebar>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">My Registrations</h1>
          <p className="text-muted text-sm">
            <span className="text-white font-medium">{active}</span> active registration{active !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : regs.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  {['Event', 'Date', 'Team', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regs.map(r => {
                  const future = r.start_datetime && new Date(r.start_datetime) > new Date()
                  return (
                    <tr key={r.reg_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                      <td className="px-5 py-4">
                        <Link to={`/events/${r.event_id}`}
                          className="text-white font-medium hover:text-gold transition-colors block">{r.title}</Link>
                        {r.venue_name && <span className="text-muted text-xs">{r.venue_name}</span>}
                      </td>
                      <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">
                        {r.start_datetime
                          ? new Date(r.start_datetime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'TBD'}
                      </td>
                      <td className="px-5 py-4 text-muted text-xs">
                        {r.team_name || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge-${r.status}`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {r.status !== 'cancelled' && future && (
                          <button onClick={() => cancel(r.reg_id)} disabled={cancelling === r.reg_id}
                            title="Cancel registration"
                            className="p-1.5 rounded-lg text-muted hover:text-evred hover:bg-evred/10 transition-colors disabled:opacity-40">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center text-muted">
            <p className="mb-3">No registrations yet.</p>
            <Link to="/events" className="btn-gold text-xs px-5 py-2">Browse Events</Link>
          </div>
        )}
      </div>
    </Sidebar>
  )
}
