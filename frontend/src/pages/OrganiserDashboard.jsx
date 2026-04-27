import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import MetricCard from '../components/MetricCard'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const STATUS_COLORS = {
  open: 'badge-open', full: 'badge-full', draft: 'badge-draft',
  closed: 'badge-closed', completed: 'badge-closed',
}

function NewEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', category: 'Technical', venue: '', start_date: '', end_date: '',
    reg_deadline: '', capacity: 100, team_min: 1, team_max: 1,
    prize_pool: 0, reg_fee: 0, description: '', eligibility: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/events', {
        ...form,
        capacity: parseInt(form.capacity),
        team_min: parseInt(form.team_min),
        team_max: parseInt(form.team_max),
        prize_pool: parseFloat(form.prize_pool) || 0,
        reg_fee: parseFloat(form.reg_fee) || 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        reg_deadline: form.reg_deadline || null,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 'Competition', 'Other']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-[rgba(200,169,110,0.2)] rounded-2xl w-full max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-white">New Event</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Event Name</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Venue</label>
              <input className="input" value={form.venue}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="datetime-local" value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input className="input" type="datetime-local" value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Capacity</label>
              <input className="input" type="number" min="1" value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} />
            </div>
            <div>
              <label className="label">Team Min</label>
              <input className="input" type="number" min="1" value={form.team_min}
                onChange={(e) => setForm((f) => ({ ...f, team_min: e.target.value }))} />
            </div>
            <div>
              <label className="label">Team Max</label>
              <input className="input" type="number" min="1" value={form.team_max}
                onChange={(e) => setForm((f) => ({ ...f, team_max: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prize Pool (₹)</label>
              <input className="input" type="number" min="0" value={form.prize_pool}
                onChange={(e) => setForm((f) => ({ ...f, prize_pool: e.target.value }))} />
            </div>
            <div>
              <label className="label">Reg Fee (₹)</label>
              <input className="input" type="number" min="0" value={form.reg_fee}
                onChange={(e) => setForm((f) => ({ ...f, reg_fee: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Eligibility</label>
            <input className="input" placeholder="e.g. All SRM students"
              value={form.eligibility}
              onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value }))} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-24 resize-none" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          {error && <p className="text-evred text-sm bg-evred/10 px-4 py-2.5 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  )
}

const CHART_COLORS = ['#c8a96e','#e8c99a','#1D9E75','#BA7517','#888']

export default function OrganiserDashboard() {
  const { user } = useAuth()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  function load() {
    api.get('/dashboard/organiser')
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function exportCSV(eventId) {
    const res = await api.get(`/registrations/event/${eventId}/export`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `registrations_${eventId}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  async function publishEvent(eventId) {
    await api.patch(`/admin/approve/event/${eventId}`)
    load()
  }

  const firstName = user?.name?.split(' ')[0] || 'Organiser'

  const chartData = data?.events?.slice(0, 6).map((e) => ({
    name: e.name.slice(0, 12),
    confirmed: e.confirmed || 0,
    waitlisted: e.waitlisted || 0,
  })) || []

  if (loading) return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-bg font-body">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl text-white mb-1">
                Welcome back, {firstName}
              </h1>
              <p className="text-muted text-sm">Organiser overview · {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-gold flex items-center gap-2">
              <span className="text-lg">+</span> New Event
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Active Events"        value={data?.active_events ?? 0}        icon="📅" color="gold"  />
            <MetricCard label="Total Registrations"  value={data?.total_registrations ?? 0}  icon="👥" color="green" />
            <MetricCard label="Avg Fill Rate"        value={`${data?.avg_fill_rate ?? 0}%`}  icon="📊" color="amber" />
            <MetricCard label="Certs Issued"         value={data?.certs_issued ?? 0}         icon="🎓" color="gold"  />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
            {/* Bar chart */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="font-display text-lg text-white mb-4">Registration Trend</h2>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barGap={4}>
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 8 }}
                      labelStyle={{ color: '#fafaf7' }}
                      itemStyle={{ color: '#c8a96e' }}
                    />
                    <Bar dataKey="confirmed" name="Confirmed" radius={[4,4,0,0]}>
                      {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                    <Bar dataKey="waitlisted" name="Waitlisted" fill="#BA7517" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted text-sm">
                  No event data yet. Create your first event!
                </div>
              )}
            </div>

            {/* Seat fill rates */}
            <div className="card p-5">
              <h2 className="font-display text-lg text-white mb-4">Seat Fill Rate</h2>
              <div className="space-y-4">
                {data?.events?.slice(0, 5).map((e) => {
                  const pct = e.capacity ? Math.min(100, Math.round((e.confirmed || 0) / e.capacity * 100)) : 0
                  return (
                    <div key={e.event_id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted truncate max-w-[120px]">{e.name}</span>
                        <span className="text-white">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-surface3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct >= 90 ? 'bg-evred' : pct >= 60 ? 'bg-evamber' : 'bg-evgreen'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {!data?.events?.length && (
                  <p className="text-muted text-sm text-center py-4">No events yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Events table */}
          <div id="events" className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between">
              <h2 className="font-display text-xl text-white">My Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.07)]">
                    {['Event Name','Date','Capacity','Regs','Status','Actions'].map((h) => (
                      <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-6 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data?.events?.length > 0 ? data.events.map((ev) => (
                    <tr key={ev.event_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{ev.name}</p>
                        <p className="text-muted text-xs">{ev.category}</p>
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">
                        {ev.start_date ? new Date(ev.start_date).toLocaleDateString('en-IN') : 'TBD'}
                      </td>
                      <td className="px-6 py-4 text-white">{ev.capacity}</td>
                      <td className="px-6 py-4 text-white">{ev.confirmed || 0}</td>
                      <td className="px-6 py-4">
                        <span className={STATUS_COLORS[ev.status] || 'badge-closed'}>{ev.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => exportCSV(ev.event_id)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-surface3 text-muted hover:text-white transition-colors border border-[rgba(255,255,255,0.07)]">
                            Export
                          </button>
                          {ev.status === 'draft' && (
                            <button onClick={() => publishEvent(ev.event_id)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-evgreen/20 text-evgreen hover:bg-evgreen/30 transition-colors">
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted">
                        <p className="text-3xl mb-2">📭</p>
                        <p>No events yet. Click "+ New Event" to get started.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <NewEventModal onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </div>
  )
}
