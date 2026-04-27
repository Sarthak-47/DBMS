import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/layout/Sidebar'
import EventCard from '../components/EventCard'
import PaymentModal from '../components/PaymentModal'
import client from '../api/client'

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Cultural', 'Technical', 'Ideathon', 'Makeathon', 'Other']

export default function EventsBrowser() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [payModal, setPayModal] = useState(null)
  const [registering, setRegistering] = useState(null)
  const [registered, setRegistered]   = useState({})
  const debounceRef = useRef(null)

  function fetchEvents(s, cat) {
    setLoading(true)
    const params = { limit: 50 }
    if (cat !== 'All') params.category = cat
    if (s) params.search = s
    client.get('/events', { params })
      .then(r => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  // Seed registered map from existing registrations on mount
  useEffect(() => {
    client.get('/registrations/my')
      .then(r => {
        const map = {}
        r.data.forEach(reg => {
          if (reg.status !== 'Cancelled') map[reg.event_id] = true
        })
        setRegistered(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchEvents(search, category)
  }, [category])

  function onSearch(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchEvents(val, category), 400)
  }

  async function register(event) {
    if (parseFloat(event.fee || 0) > 0) { setPayModal(event); return }
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
    await client.post('/registrations', { event_id: ev.event_id, team_name: null, payment_ref: txn })
    setRegistered(r => ({ ...r, [ev.event_id]: true }))
    setPayModal(null)
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">Explore Events</h1>
          <p className="text-muted text-sm">Discover and register for events across clubs and departments</p>
        </div>

        {/* Search */}
        <input
          className="input max-w-sm mb-5"
          placeholder="Search events…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-7">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                category === cat
                  ? 'bg-gold text-bg border-gold'
                  : 'border-[rgba(200,169,110,0.2)] text-muted hover:text-white hover:border-gold/40'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map(ev => (
              <EventCard
                key={ev.event_id}
                event={ev}
                onRegister={registered[ev.event_id] ? null : register}
                registering={registering === ev.event_id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <p className="text-3xl mb-3">📭</p>
            <p>No events found. Try a different filter.</p>
          </div>
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
