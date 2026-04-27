import { useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    team_name: '',
    track: '',
    tshirt_size: 'M',
    members: [],
  })
  const [memberInput, setMemberInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <ModalShell onClose={onClose} title="Register">
        <p className="text-muted mb-4">Please log in to register for events.</p>
        <button className="btn-gold w-full" onClick={() => navigate('/auth')}>Login / Register</button>
      </ModalShell>
    )
  }

  function addMember() {
    const v = memberInput.trim()
    if (!v) return
    if (form.members.find((m) => m.reg_no === v)) return
    if (form.members.length >= (event.team_max - 1)) return
    setForm((f) => ({ ...f, members: [...f.members, { reg_no: v }] }))
    setMemberInput('')
  }

  function removeMember(rno) {
    setForm((f) => ({ ...f, members: f.members.filter((m) => m.reg_no !== rno) }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/registrations', {
        event_id: event.event_id,
        team_name: form.team_name || null,
        track: form.track || null,
        tshirt_size: form.tshirt_size,
        members: form.members,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isTeam = event.team_max > 1
  const tracks = ['Web Dev', 'AI/ML', 'Blockchain', 'IoT', 'HealthTech', 'FinTech', 'Open']

  return (
    <ModalShell onClose={onClose} title={`Register for ${event.name}`}>
      <form onSubmit={submit} className="space-y-4">
        {isTeam && (
          <div>
            <label className="label">Team Name</label>
            <input className="input" placeholder="e.g. Team Zenith"
              value={form.team_name}
              onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))} />
          </div>
        )}

        {isTeam && (
          <div>
            <label className="label">Add Team Members (Reg No.)</label>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="RA24XXXXXXXXX"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())} />
              <button type="button" onClick={addMember}
                className="px-3 py-2.5 bg-surface3 border border-[rgba(200,169,110,0.2)] text-gold rounded-lg text-sm hover:bg-surface2 transition-colors">
                + Add
              </button>
            </div>
            {form.members.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.members.map((m) => (
                  <span key={m.reg_no}
                    className="bg-gold/10 text-gold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    {m.reg_no}
                    <button type="button" onClick={() => removeMember(m.reg_no)}
                      className="text-gold/60 hover:text-evred">×</button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted mt-1">
              Team size: 1 (you) + {form.members.length} members. Max: {event.team_max}
            </p>
          </div>
        )}

        <div>
          <label className="label">Track / Category</label>
          <select className="input" value={form.track}
            onChange={(e) => setForm((f) => ({ ...f, track: e.target.value }))}>
            <option value="">Select track (optional)</option>
            {tracks.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">T-Shirt Size</label>
          <select className="input" value={form.tshirt_size}
            onChange={(e) => setForm((f) => ({ ...f, tshirt_size: e.target.value }))}>
            {['XS','S','M','L','XL','XXL'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-evred/10 border border-evred/30 text-evred text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="btn-gold w-full py-3 disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? 'Registering…' : 'Register Team →'}
        </button>

        <p className="text-center text-xs text-muted">
          {event.reg_fee > 0 ? `₹${event.reg_fee} registration fee` : 'Free entry'} · Confirmation via email
        </p>
      </form>
    </ModalShell>
  )
}

function ModalShell({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-[rgba(200,169,110,0.2)] rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-white">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
