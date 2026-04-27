import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import PaymentModal from '../components/PaymentModal'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [event, setEvent]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [err, setErr]         = useState('')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    client.get(`/events/${id}`)
      .then(r => setEvent(r.data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false))
  }, [id])

  const isPaid    = parseFloat(event?.fee || 0) > 0
  const isStudent = user?.role === 'student' || user?.role === 'other_student'
  const isTeam    = (event?.max_team_size || 1) > 1

  async function registerFree() {
    setErr(''); setRegistering(true)
    try {
      await client.post('/registrations', {
        event_id: event.event_id,
        team_name: teamName.trim() || null,
        payment_ref: null,
      })
      setSuccess(true)
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Registration failed.')
    } finally { setRegistering(false) }
  }

  async function handlePaid(txn) {
    await client.post('/registrations', {
      event_id: event.event_id,
      team_name: teamName.trim() || null,
      payment_ref: txn,
    })
    setPayModal(false)
    setSuccess(true)
  }

  function handleRegister() {
    if (isPaid) { setPayModal(true) } else { registerFree() }
  }

  if (loading) return (
    <Sidebar>
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    </Sidebar>
  )

  if (!event) return (
    <Sidebar>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-muted">
        <p>Event not found.</p>
        <Link to="/events" className="btn-gold">Back to Events</Link>
      </div>
    </Sidebar>
  )

  const fillPct = event.max_participants
    ? Math.min(100, Math.round((event.confirmed_count || 0) / event.max_participants * 100)) : 0

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted text-sm hover:text-white transition-colors mb-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Hero strip */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`badge-${event.event_status}`}>{event.event_status}</span>
            <span className="bg-gold/10 text-gold text-xs px-2.5 py-1 rounded-full">{event.category}</span>
            {isPaid && <span className="bg-evamber/20 text-evamber text-xs px-2.5 py-1 rounded-full">₹{event.fee}</span>}
            {!isPaid && <span className="bg-evgreen/20 text-evgreen text-xs px-2.5 py-1 rounded-full">Free</span>}
          </div>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-2">{event.title}</h1>
          {event.organizer_name && (
            <p className="text-muted text-sm">by <span className="text-white">{event.organizer_name}</span></p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {event.description && (
              <div className="card p-6">
                <h2 className="font-display text-lg text-white mb-3">About</h2>
                <p className="text-muted text-sm leading-relaxed">{event.description}</p>
              </div>
            )}

            <div className="card p-6">
              <h2 className="font-display text-lg text-white mb-4">Schedule</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Start</span>
                  <span className="text-white">{fmtDate(event.start_datetime)} · {fmtTime(event.start_datetime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">End</span>
                  <span className="text-white">{fmtDate(event.end_datetime)} · {fmtTime(event.end_datetime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Reg Deadline</span>
                  <span className="text-white">{fmtDate(event.registration_deadline)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Venue',         val: event.venue_name || 'TBD' },
                { label: 'Participation', val: isTeam ? `Team (${event.min_team_size}–${event.max_team_size})` : 'Individual' },
                { label: 'Capacity',      val: `${event.max_participants || '—'} participants` },
                { label: 'Eligibility',   val: event.eligibility || 'All students' },
              ].map(p => (
                <div key={p.label} className="card p-4">
                  <p className="text-muted text-xs mb-1">{p.label}</p>
                  <p className="text-white text-sm">{p.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky register card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 card p-6">
              <h2 className="font-display text-lg text-white mb-4">Register</h2>

              {event.max_participants && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted mb-1.5">
                    <span>{event.confirmed_count || 0} registered</span>
                    <span>{event.max_participants} capacity</span>
                  </div>
                  <div className="h-2 bg-surface3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-evred' : fillPct >= 60 ? 'bg-evamber' : 'bg-evgreen'}`}
                      style={{ width: `${fillPct}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Fee</span>
                  <span className={isPaid ? 'text-evamber' : 'text-evgreen'}>{isPaid ? `₹${event.fee}` : 'Free'}</span>
                </div>
                {isTeam && (
                  <div className="flex justify-between">
                    <span className="text-muted">Team Size</span>
                    <span className="text-white">{event.min_team_size}–{event.max_team_size}</span>
                  </div>
                )}
              </div>

              {isTeam && !success && (
                <div className="mb-4">
                  <label className="label">Team Name (optional)</label>
                  <input className="input" placeholder="Team Phoenix"
                    value={teamName} onChange={e => setTeamName(e.target.value)} />
                </div>
              )}

              {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg mb-3">{err}</p>}

              {success ? (
                <div className="bg-evgreen/10 border border-evgreen/30 rounded-xl p-4 text-center">
                  <p className="text-evgreen font-medium text-sm">Registered successfully!</p>
                  <Link to="/my-registrations" className="text-xs text-gold mt-1 hover:underline block">View registrations →</Link>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || !isStudent}
                  className="btn-gold w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  {registering ? 'Registering…' : !isStudent ? 'Students only' : 'Register Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {payModal && (
        <PaymentModal
          event={event}
          onClose={() => setPayModal(false)}
          onPaid={handlePaid}
        />
      )}
    </Sidebar>
  )
}
