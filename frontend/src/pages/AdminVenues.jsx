import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

const VENUE_TYPES = ['Auditorium', 'Classroom', 'Lab', 'Seminar Hall', 'Ground', 'Online', 'Other']
const BLANK = { name: '', building_name: '', type: 'Seminar Hall', capacity: '' }

export default function AdminVenues() {
  const [venues, setVenues]   = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [err, setErr]           = useState('')

  function load() {
    client.get('/venues')
      .then(r => setVenues(r.data))
      .catch(() => setVenues([]))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function save(e) {
    e.preventDefault(); setErr('')
    if (!form.name.trim()) { setErr('Venue name is required.'); return }
    setSaving(true)
    try {
      await client.post('/venues', {
        name:          form.name.trim(),
        building_name: form.building_name.trim() || null,
        type:          form.type,
        capacity:      form.capacity ? parseInt(form.capacity) : null,
      })
      setForm(BLANK)
      load()
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to add venue.')
    } finally { setSaving(false) }
  }

  async function deleteVenue(id) {
    if (!confirm('Delete this venue?')) return
    setDeleting(id)
    try { await client.delete(`/venues/${id}`); load() }
    catch (ex) { alert(ex.response?.data?.detail || 'Could not delete.') }
    finally { setDeleting(null) }
  }

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">Venues</h1>
          <p className="text-muted text-sm">Manage campus venues available for events</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
          {/* Add Venue Form */}
          <div className="lg:col-span-1">
            <div className="card p-5 sticky top-6">
              <h2 className="font-display text-lg text-white mb-4">Add Venue</h2>
              <form onSubmit={save} className="space-y-3">
                <div>
                  <label className="label">Venue Name <span className="text-evred">*</span></label>
                  <input className="input" placeholder="Tech Park Auditorium"
                    value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Building</label>
                  <input className="input" placeholder="Tech Park"
                    value={form.building_name} onChange={e => set('building_name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
                    {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Capacity</label>
                  <input className="input" type="number" min="1" placeholder="500"
                    value={form.capacity} onChange={e => set('capacity', e.target.value)} />
                </div>
                {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}
                <button type="submit" disabled={saving} className="btn-gold w-full py-2.5 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Venue'}
                </button>
              </form>
            </div>
          </div>

          {/* Venues Grid */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : venues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {venues.map(v => (
                  <div key={v.venue_id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium text-sm">{v.name}</h3>
                        {v.building_name && <p className="text-muted text-xs">{v.building_name}</p>}
                      </div>
                      <button onClick={() => deleteVenue(v.venue_id)} disabled={deleting === v.venue_id}
                        className="p-1.5 rounded-lg text-muted hover:text-evred hover:bg-evred/10 transition-colors disabled:opacity-40 flex-shrink-0">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full">{v.type}</span>
                      <span className="text-[10px] font-mono text-muted">#{v.venue_id}</span>
                      {v.capacity && <span className="text-[10px] text-muted ml-auto">{v.capacity} cap.</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center text-muted text-sm">No venues added yet.</div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
