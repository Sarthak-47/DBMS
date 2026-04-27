import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import MetricCard from '../components/MetricCard'
import EventCard from '../components/EventCard'
import PaymentModal from '../components/PaymentModal'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [data, setData]         = useState(null)
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [payModal, setPayModal] = useState(null)
  const [registering, setRegistering] = useState(null)
  const [registered, setRegistered]   = useState({})

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/student'),
      client.get('/events', { params: { limit: 6 } }),
    ]).then(([d, ev]) => {
      setData(d.data)
      setEvents(ev.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function register(event) {
    if (parseFloat(event.fee || 0) > 0) {
      setPayModal(event)
      return
    }
    setRegistering(event.event_id)
    try {
      await client.post('/registrations', { event_id: event.event_id, team_name: null, payment_ref: null })
      setRegistered(r => ({ ...r, [event.event_id]: true }))
    } catch (ex) {
      alert(ex.response?.data?.detail || 'Registration failed.')
    } finally { setRegistering(null) }
  }

  async function handlePaid(txn) {
    const ev = payModal
    await client.post('/registrations', {
      event_id: ev.event_id, team_name: null, payment_ref: txn,
    })
    setRegistered(r => ({ ...r, [ev.event_id]: true }))
    setPayModal(null)
  }

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  })()

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">
            {greeting}, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-muted text-sm">Here's what's happening on campus today.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Upcoming Events"   value={data?.upcoming_events_count ?? 0} color="gold"  />
              <MetricCard label="My Registrations"  value={data?.registrations_count   ?? 0} color="green" />
              <MetricCard label="Active Teams"       value={data?.active_teams_count    ?? 0} color="amber" />
              <MetricCard label="Points Earned"      value={data?.points               ?? 0} color="gold"  />
            </div>

            {/* Active Registrations */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-white">Active Registrations</h2>
                <Link to="/my-registrations" className="text-xs text-gold hover:underline">View all →</Link>
              </div>

              {data?.recent_registrations?.length > 0 ? (
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                  {data.recent_registrations.map((reg) => (
                    <div key={reg.reg_id}
                      className="card flex-shrink-0 w-60 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`badge-${reg.status} text-xs`}>{reg.status}</span>
                      </div>
                      <p className="text-white text-sm font-medium mb-1 line-clamp-2">{reg.title}</p>
                      <p className="text-muted text-xs">{fmtDate(reg.start_datetime)}</p>
                      {reg.team_name && (
                        <p className="text-gold text-xs mt-1">Team: {reg.team_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-muted">
                  <p className="mb-3 text-sm">No active registrations yet.</p>
                  <Link to="/events" className="btn-gold text-xs px-5 py-2">Browse Events</Link>
                </div>
              )}
            </div>

            {/* Explore Events */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-white">Explore Events</h2>
                <Link to="/events" className="text-xs text-gold hover:underline">View all →</Link>
              </div>
              {events.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {events.map((ev) => (
                    <EventCard
                      key={ev.event_id}
                      event={ev}
                      onRegister={registered[ev.event_id] ? null : register}
                      registering={registering === ev.event_id}
                    />
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-muted text-sm">No events available.</div>
              )}
            </div>
          </>
        )}
      </div>

      {payModal && (
        <PaymentModal
          event={payModal}
          onClose={() => setPayModal(null)}
          onPaid={handlePaid}
        />
      )}
    </Sidebar>
  )
}
