import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

const STEPS = ['Basic Info', 'Schedule & Venue', 'Registration & Payment', 'Review & Submit']
const CATEGORIES = ['Hackathon', 'Workshop', 'Cultural', 'Technical', 'Ideathon', 'Makeathon', 'Other']

const INITIAL = {
  title: '', category: 'Technical', description: '', eligibility: '',
  start_datetime: '', end_datetime: '', registration_deadline: '', venue_id: '',
  fee: 0, min_team_size: 1, max_team_size: 1, max_participants: 50,
  upi_id: '', payee_name: '',
}

export default function CreateEvent() {
  const navigate   = useNavigate()
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(INITIAL)
  const [venues, setVenues]   = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  // QR image
  const [qrFile, setQrFile]       = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const qrInputRef = useRef(null)

  useEffect(() => {
    client.get('/venues').then(r => setVenues(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function next() { setErr(''); setStep(s => s + 1) }
  function back() { setErr(''); setStep(s => s - 1) }

  function onQrChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setQrFile(file)
    const reader = new FileReader()
    reader.onload = ev => setQrPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  function removeQr() {
    setQrFile(null)
    setQrPreview(null)
    if (qrInputRef.current) qrInputRef.current.value = ''
  }

  async function submit() {
    setLoading(true); setErr('')
    try {
      const payload = {
        title:                 form.title,
        category:              form.category,
        description:           form.description   || null,
        eligibility:           form.eligibility   || null,
        start_datetime:        form.start_datetime        || null,
        end_datetime:          form.end_datetime          || null,
        registration_deadline: form.registration_deadline || null,
        venue_id:              form.venue_id ? parseInt(form.venue_id) : null,
        fee:                   parseFloat(form.fee) || 0,
        min_team_size:         parseInt(form.min_team_size)  || 1,
        max_team_size:         parseInt(form.max_team_size)  || 1,
        max_participants:      parseInt(form.max_participants) || 50,
        upi_id:                form.upi_id     || null,
        payee_name:            form.payee_name || null,
      }
      const res = await client.post('/events', payload)
      const eventId = res.data.event_id

      // Upload QR image if provided
      if (qrFile && eventId) {
        const fd = new FormData()
        fd.append('file', qrFile)
        await client.post(`/events/${eventId}/upload-qr`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      navigate('/organizer/events')
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Failed to create event.')
    } finally { setLoading(false) }
  }

  const isPaid = parseFloat(form.fee) > 0

  return (
    <Sidebar>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">Create Event</h1>
          <p className="text-muted text-sm">Fill in the details to submit your event for approval</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                  i < step   ? 'bg-gold border-gold text-bg' :
                  i === step ? 'border-gold text-gold bg-gold/10' :
                               'border-[rgba(255,255,255,0.12)] text-muted'
                }`}>
                  {i < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`text-[10px] mt-1 whitespace-nowrap ${i === step ? 'text-gold' : 'text-muted'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-2 mb-4 ${i < step ? 'bg-gold/50' : 'bg-[rgba(255,255,255,0.08)]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-6">

          {/* ── Step 1: Basic Info ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Event Title <span className="text-evred">*</span></label>
                <input className="input" placeholder="e.g. HackSRM 6.0"
                  value={form.title} onChange={e => set('title', e.target.value)} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[90px] resize-none" placeholder="What is this event about?"
                  value={form.description} onChange={e => set('description', e.target.value)} />
              </div>
              <div>
                <label className="label">Eligibility</label>
                <input className="input" placeholder="e.g. All SRM students, 2nd year and above"
                  value={form.eligibility} onChange={e => set('eligibility', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Schedule & Venue ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date & Time</label>
                  <input className="input" type="datetime-local"
                    value={form.start_datetime} onChange={e => set('start_datetime', e.target.value)} />
                </div>
                <div>
                  <label className="label">End Date & Time</label>
                  <input className="input" type="datetime-local"
                    value={form.end_datetime} onChange={e => set('end_datetime', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Registration Deadline</label>
                <input className="input" type="datetime-local"
                  value={form.registration_deadline} onChange={e => set('registration_deadline', e.target.value)} />
              </div>
              <div>
                <label className="label">Venue</label>
                <select className="input" value={form.venue_id} onChange={e => set('venue_id', e.target.value)}>
                  <option value="">— Select venue —</option>
                  {venues.map(v => (
                    <option key={v.venue_id} value={v.venue_id}>
                      {v.name}{v.building_name ? ` · ${v.building_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 3: Registration & Payment ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Fee (₹)</label>
                  <input className="input" type="number" min="0" placeholder="0 for free"
                    value={form.fee} onChange={e => set('fee', e.target.value)} />
                  <p className="text-xs text-muted mt-1">Set to 0 for a free event</p>
                </div>
                <div>
                  <label className="label">Max Participants</label>
                  <input className="input" type="number" min="1"
                    value={form.max_participants} onChange={e => set('max_participants', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Min Team Size</label>
                  <input className="input" type="number" min="1"
                    value={form.min_team_size} onChange={e => set('min_team_size', e.target.value)} />
                </div>
                <div>
                  <label className="label">Max Team Size</label>
                  <input className="input" type="number" min="1"
                    value={form.max_team_size} onChange={e => set('max_team_size', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted -mt-1">Set Min and Max to 1 for individual participation.</p>

              {/* Payment details — only shown for paid events */}
              {isPaid && (
                <div className="border-t border-[rgba(255,255,255,0.07)] pt-5 space-y-4">
                  <p className="text-xs text-evamber font-medium uppercase tracking-wide">Payment Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">UPI ID</label>
                      <input className="input" placeholder="yourclub@upi"
                        value={form.upi_id} onChange={e => set('upi_id', e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Payee Name</label>
                      <input className="input" placeholder="Club / Department name"
                        value={form.payee_name} onChange={e => set('payee_name', e.target.value)} />
                    </div>
                  </div>

                  {/* QR Upload */}
                  <div>
                    <label className="label">UPI QR Code Image</label>
                    <p className="text-xs text-muted mb-3">
                      Students will see this QR in the payment popup. Upload a screenshot of your UPI QR code.
                    </p>
                    {qrPreview ? (
                      <div className="flex items-start gap-4">
                        <img
                          src={qrPreview}
                          alt="QR preview"
                          className="w-36 h-36 object-contain rounded-xl border border-[rgba(200,169,110,0.3)] bg-white p-1"
                        />
                        <div className="flex flex-col gap-2 pt-1">
                          <p className="text-white text-xs font-medium">{qrFile?.name}</p>
                          <p className="text-muted text-xs">{(qrFile?.size / 1024).toFixed(0)} KB</p>
                          <button
                            type="button"
                            onClick={removeQr}
                            className="text-xs text-evred hover:text-evred/80 transition-colors text-left"
                          >
                            Remove QR
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => qrInputRef.current?.click()}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-[rgba(200,169,110,0.25)] hover:border-gold/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted hover:text-gold"
                      >
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Click to upload QR image</span>
                        <span className="text-xs">PNG, JPG, WEBP</span>
                      </button>
                    )}
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onQrChange}
                    />
                  </div>
                </div>
              )}

              {!isPaid && (
                <div className="bg-evgreen/10 border border-evgreen/20 rounded-xl px-4 py-3 text-xs text-evgreen">
                  This is a free event — no payment details required.
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Review & Submit ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                {[
                  ['Title',        form.title],
                  ['Category',     form.category],
                  ['Description',  form.description   || '—'],
                  ['Eligibility',  form.eligibility   || 'All students'],
                  ['Start',        form.start_datetime        ? new Date(form.start_datetime).toLocaleString('en-IN')        : 'TBD'],
                  ['End',          form.end_datetime          ? new Date(form.end_datetime).toLocaleString('en-IN')          : 'TBD'],
                  ['Reg Deadline', form.registration_deadline ? new Date(form.registration_deadline).toLocaleString('en-IN') : 'TBD'],
                  ['Venue',        venues.find(v => String(v.venue_id) === String(form.venue_id))?.name || 'TBD'],
                  ['Fee',          isPaid ? `₹${form.fee}` : 'Free'],
                  ['Capacity',     `${form.max_participants} participants`],
                  ['Team Size',    parseInt(form.max_team_size) > 1 ? `${form.min_team_size}–${form.max_team_size} members` : 'Individual'],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted w-28 flex-shrink-0">{label}</span>
                    <span className="text-white">{val}</span>
                  </div>
                ))}
              </div>

              {isPaid && (
                <div className="border-t border-[rgba(255,255,255,0.07)] pt-4 space-y-2 text-sm">
                  <p className="text-xs text-evamber font-medium uppercase tracking-wide">Payment</p>
                  {[
                    ['UPI ID',   form.upi_id    || '—'],
                    ['Payee',    form.payee_name || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3">
                      <span className="text-muted w-28 flex-shrink-0">{label}</span>
                      <span className="text-white">{val}</span>
                    </div>
                  ))}
                  <div className="flex gap-3 items-center">
                    <span className="text-muted w-28 flex-shrink-0">QR Image</span>
                    {qrPreview
                      ? <img src={qrPreview} alt="QR" className="w-16 h-16 object-contain rounded-lg border border-gold/30 bg-white p-0.5" />
                      : <span className="text-muted text-xs italic">Not uploaded</span>
                    }
                  </div>
                </div>
              )}

              <div className="bg-evamber/10 border border-evamber/20 rounded-xl px-4 py-3 text-xs text-evamber">
                After submission, the event will be reviewed by an Admin before going live.
              </div>
            </div>
          )}

          {err && <p className="mt-4 text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={back}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[rgba(255,255,255,0.1)] text-muted text-sm hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button onClick={next} disabled={step === 0 && !form.title.trim()}
                className="flex items-center gap-1.5 btn-gold px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button onClick={submit} disabled={loading} className="btn-gold px-8 py-2.5 disabled:opacity-60">
                {loading ? 'Submitting…' : 'Submit for Approval'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  )
}
