import { useState, useEffect, useRef } from 'react'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminEvents() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const debounceRef = useRef(null)

  function fetch(s) {
    setLoading(true)
    const params = { limit: 100 }
    if (s) params.search = s
    client.get('/admin/events', { params })
      .then(r => setEvents(r.data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch('') }, [])

  function onSearch(val) {
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetch(val), 400)
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">All Events</h1>
          <p className="text-muted text-sm">Complete list of events on the platform</p>
        </div>

        <input className="input max-w-sm mb-5" placeholder="Search by title…"
          value={search} onChange={e => onSearch(e.target.value)} />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  {['Event', 'Organizer', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev.event_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium">{ev.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-muted text-xs capitalize">{ev.category}</span>
                        <span className="text-muted text-xs">·</span>
                        <span className="text-[10px] font-mono text-muted">#{ev.event_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted text-sm">{ev.organizer_name || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`badge-${ev.event_status}`}>{ev.event_status}</span>
                        <span className={`badge-${ev.approval_status ?? 'pending'} text-[10px]`}>{ev.approval_status ?? 'pending'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted text-xs whitespace-nowrap">
                      {fmtDate(ev.start_datetime)}
                      {ev.start_datetime && (
                        <span className="block font-mono">
                          {new Date(ev.start_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center text-muted text-sm">No events found.</div>
        )}
      </div>
    </Sidebar>
  )
}
