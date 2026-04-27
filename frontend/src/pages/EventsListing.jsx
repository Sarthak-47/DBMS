import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import EventCard from '../components/EventCard'
import api from '../api/client'

const CATEGORIES = ['All', 'Hackathon', 'Workshop', 'Cultural', 'Technical', 'Ideathon', 'Makeathon', 'Other']

export default function EventsListing() {
  const [searchParams] = useSearchParams()
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')

  useEffect(() => {
    setLoading(true)
    const params = { limit: 24 }
    if (category !== 'All') params.category = category
    if (search) params.search = search
    api.get('/events', { params })
      .then((r) => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [category, search])

  return (
    <div className="bg-bg min-h-screen font-body">
      <Navbar />
      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-white mb-1">All Events</h1>
          <p className="text-muted text-sm">Discover and register for events across all clubs and departments</p>
        </div>

        {/* Search */}
        <input className="input max-w-sm mb-5" placeholder="Search by title…"
          value={search} onChange={(e) => setSearch(e.target.value)} />

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => <EventCard key={ev.event_id} event={ev} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted">
            <p className="text-4xl mb-3">📭</p>
            <p>No events found. Try a different filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
