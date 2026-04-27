import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

const STEPS = ['Basic Info', 'Schedule & Venue', 'Registration & Payment', 'Review & Submit']

const CATEGORIES = [
  'Hackathon', 'Workshop', 'Cultural', 'Technical',
  'Ideathon', 'Makeathon', 'Other',
]

const ELIGIBILITY_OPTIONS = [
  { value: '',                          label: '— Select eligibility —',        disabled: true },
  { value: 'Open to All',               label: 'Open to All'                                   },
  { value: 'SRM Students Only',         label: 'SRM Students Only'                             },
  { value: 'Non-SRM Students Welcome',  label: 'Non-SRM Students Welcome'                      },
  { value: '1st Year Only',             label: '1st Year Only'                                 },
  { value: '2nd Year Only',             label: '2nd Year Only'                                 },
  { value: '3rd Year Only',             label: '3rd Year Only'                                 },
  { value: '4th Year Only',             label: '4th Year Only'                                 },
  { value: '1st & 2nd Year',            label: '1st & 2nd Year'                                },
  { value: '3rd & 4th Year',            label: '3rd & 4th Year'                                },
  { value: 'Final Year Only',           label: 'Final Year Only'                               },
  { value: 'B.Tech Students',           label: 'B.Tech Students'                               },
  { value: 'M.Tech Students',           label: 'M.Tech Students'                               },
  { value: 'B.Tech & M.Tech',           label: 'B.Tech & M.Tech'                               },
  { value: 'PhD Students',              label: 'PhD Students'                                  },
  { value: 'CSE / IT Students',         label: 'CSE / IT Students'                             },
  { value: 'ECE / EEE Students',        label: 'ECE / EEE Students'                            },
  { value: 'Mechanical Students',       label: 'Mechanical Students'                           },
  { value: 'Civil Students',            label: 'Civil Students'                                },
  { value: 'All Engineering Branches',  label: 'All Engineering Branches'                      },
]

const INITIAL = {
  title: '', category: 'Technical', description: '', eligibility: '',
  start_datetime: '', end_datetime: '', registration_deadline: '', venue_id: '',
  fee: 0, min_team_size: 1, max_team_size: 1, max_participants: 50,
  upi_id: '', payee_name: '',
}

/* ── per-step required field descriptors ── */
const STEP_FIELDS = {
  0: [
    { key: 'title',       label: 'Event title'    },
    { key: 'description', label: 'Description'    },
    { key: 'eligibility', label: 'Eligibility'    },
  ],
  1: [
    { key: 'start_datetime',        label: 'Start date & time'       },
    { key: 'end_datetime',          label: 'End date & time'         },
    { key: 'registration_deadline', label: 'Registration deadline'   },
    { key: 'venue_id',              label: 'Venue'                   },
  ],
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [form, setForm]       = useState(INITIAL)
  const [venues, setVenues]   = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [fieldErrs, setFieldErrs] = useState({})  // field-level red highlights

  // QR image
  const [qrFile, setQrFile]       = useState(null)
  const [qrPreview, setQrPreview] = useState(null)
  const qrInputRef = useRef(null)

  useEffect(() => {
    client.get('/venues').then(r => setVenues(r.data)).catch(() => {})
  }, [])

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    // Clear field error when the user fixes it
    if (fieldErrs[k]) setFieldErrs(fe => { const n = { ...fe }; delete n[k]; return n })
  }

  const isPaid = parseFloat(form.fee) > 0

  /* ── validation ── */
  function validateStep(s) {
    const errs = {}

    if (s === 0) {
      if (!form.title.trim())       errs.title       = 'Event title is required.'
      if (!form.description.trim()) errs.description = 'Description is required.'
      if (!form.eligibility)        errs.eligibility = 'Please select an eligibility option.'
    }

    if (s === 1) {
      if (!form.start_datetime)        errs.start_datetime        = 'Start date & time is required.'
      if (!form.end_datetime)          errs.end_datetime          = 'End date & time is required.'
      if (!form.registration_deadline) errs.registration_deadline = 'Registration deadline is required.'
      if (!form.venue_id)              errs.venue_id              = 'Please select a venue.'

      if (!errs.start_datetime && !errs.end_datetime) {
        if (new Date(form.end_datetime) <= new Date(form.start_datetime))
          errs.end_datetime = 'End time must be after start time.'
      }
      if (!errs.registration_deadline && !errs.start_datetime) {
        if (new Date(form.registration_deadline) > new Date(form.start_datetime))
          errs.registration_deadline = 'Deadline must be on or before the start time.'
      }
    }

    if (s === 2) {
      const maxP = parseInt(form.max_participants)
      const minT = parseInt(form.min_team_size)
      const maxT = parseInt(form.max_team_size)
      if (!maxP || maxP < 1)  errs.max_participants = 'Max participants must be at least 1.'
      if (!minT || minT < 1)  errs.min_team_size    = 'Min team size must be at least 1.'
      if (!maxT || maxT < 1)  errs.max_team_size    = 'Max team size must be at least 1.'
      if (!errs.min_team_size && !errs.max_team_size && minT > maxT)
        errs.min_team_size = 'Min team size cannot exceed max team size.'

      if (isPaid) {
        if (!form.upi_id.trim())    errs.upi_id    = 'UPI ID is required for paid events.'
        if (!form.payee_name.trim()) errs.payee_name = 'Payee name is required for paid events.'
      }
    }

    return errs
  }

  function next() {
    const errs = validateStep(step)
    if (Object.keys(errs).length > 0) {
      setFieldErrs(errs)
      // Summary message listing what's missing
      const labels = STEP_FIELDS[step]
        ?.filter(f => errs[f.key])
        .map(f => f.label)
      const extra = Object.keys(errs).filter(
        k => !(STEP_FIELDS[step] || []).find(f => f.key === k)
      )
      const allMissing = [
        ...(labels || []),
        ...extra.map(k => errs[k]),
      ]
      setErr(allMissing.length === 1
        ? allMissing[0]
        : `Please fill in: ${allMissing.join(', ')}.`)
      return
    }
    setErr('')
    setFieldErrs({})
    setStep(s => s + 1)
  }

  function back() {
    setErr('')
    setFieldErrs({})
    setStep(s => s - 1)
  }

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

  /* ── field class helper — red border when field has an error ── */
  const fc = key =>
    `input${fieldErrs[key] ? ' border-evred/70 focus:border-evred' : ''}`

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
                <label className="label">
                  Event Title <span className="text-evred">*</span>
                </label>
                <input
                  className={fc('title')}
                  placeholder="e.g. HackSRM 6.0"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                />
                {fieldErrs.title && <p className="text-evred text-xs mt-1">{fieldErrs.title}</p>}
              </div>

              <div>
                <label className="label">Category <span className="text-evred">*</span></label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="label">
                  Description <span className="text-evred">*</span>
                </label>
                <textarea
                  className={`${fc('description')} min-h-[90px] resize-none`}
                  placeholder="What is this event about? Include agenda, prizes, or any key details."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                />
                {fieldErrs.description && <p className="text-evred text-xs mt-1">{fieldErrs.description}</p>}
              </div>

              <div>
                <label className="label">
                  Eligibility <span className="text-evred">*</span>
                </label>
                <select
                  className={fc('eligibility')}
                  value={form.eligibility}
                  onChange={e => set('eligibility', e.target.value)}
                >
                  {ELIGIBILITY_OPTIONS.map(opt => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                {fieldErrs.eligibility && <p className="text-evred text-xs mt-1">{fieldErrs.eligibility}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Schedule & Venue ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date & Time <span className="text-evred">*</span></label>
                  <input
                    className={fc('start_datetime')}
                    type="datetime-local"
                    value={form.start_datetime}
                    onChange={e => set('start_datetime', e.target.value)}
                  />
                  {fieldErrs.start_datetime && <p className="text-evred text-xs mt-1">{fieldErrs.start_datetime}</p>}
                </div>
                <div>
                  <label className="label">End Date & Time <span className="text-evred">*</span></label>
                  <input
                    className={fc('end_datetime')}
                    type="datetime-local"
                    value={form.end_datetime}
                    onChange={e => set('end_datetime', e.target.value)}
                  />
                  {fieldErrs.end_datetime && <p className="text-evred text-xs mt-1">{fieldErrs.end_datetime}</p>}
                </div>
              </div>

              <div>
                <label className="label">Registration Deadline <span className="text-evred">*</span></label>
                <input
                  className={fc('registration_deadline')}
                  type="datetime-local"
                  value={form.registration_deadline}
                  onChange={e => set('registration_deadline', e.target.value)}
                />
                {fieldErrs.registration_deadline && <p className="text-evred text-xs mt-1">{fieldErrs.registration_deadline}</p>}
                <p className="text-muted text-xs mt-1">Must be on or before the event start time.</p>
              </div>

              <div>
                <label className="label">Venue <span className="text-evred">*</span></label>
                <select
                  className={fc('venue_id')}
                  value={form.venue_id}
                  onChange={e => set('venue_id', e.target.value)}
                >
                  <option value="">— Select venue —</option>
                  {venues.map(v => (
                    <option key={v.venue_id} value={v.venue_id}>
                      {v.name}{v.building_name ? ` · ${v.building_name}` : ''}{v.capacity ? ` (cap. ${v.capacity})` : ''}
                    </option>
                  ))}
                </select>
                {fieldErrs.venue_id && <p className="text-evred text-xs mt-1">{fieldErrs.venue_id}</p>}
              </div>
            </div>
          )}

          {/* ── Step 3: Registration & Payment ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Fee (₹) <span className="text-evred">*</span></label>
                  <input
                    className="input"
                    type="number" min="0"
                    placeholder="0 for free"
                    value={form.fee}
                    onChange={e => set('fee', e.target.value)}
                  />
                  <p className="text-xs text-muted mt-1">Set to 0 for a free event.</p>
                </div>
                <div>
                  <label className="label">Max Participants <span className="text-evred">*</span></label>
                  <input
                    className={fc('max_participants')}
                    type="number" min="1"
                    value={form.max_participants}
                    onChange={e => set('max_participants', e.target.value)}
                  />
                  {fieldErrs.max_participants && <p className="text-evred text-xs mt-1">{fieldErrs.max_participants}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Min Team Size <span className="text-evred">*</span></label>
                  <input
                    className={fc('min_team_size')}
                    type="number" min="1"
                    value={form.min_team_size}
                    onChange={e => set('min_team_size', e.target.value)}
                  />
                  {fieldErrs.min_team_size && <p className="text-evred text-xs mt-1">{fieldErrs.min_team_size}</p>}
                </div>
                <div>
                  <label className="label">Max Team Size <span className="text-evred">*</span></label>
                  <input
                    className={fc('max_team_size')}
                    type="number" min="1"
                    value={form.max_team_size}
                    onChange={e => set('max_team_size', e.target.value)}
                  />
                  {fieldErrs.max_team_size && <p className="text-evred text-xs mt-1">{fieldErrs.max_team_size}</p>}
                </div>
              </div>
              <p className="text-xs text-muted -mt-2">Set both to 1 for individual/solo participation.</p>

              {/* Payment details — paid events only */}
              {isPaid && (
                <div className="border-t border-[rgba(255,255,255,0.07)] pt-5 space-y-4">
                  <p className="text-xs text-evamber font-medium uppercase tracking-wide">Payment Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">UPI ID <span className="text-evred">*</span></label>
                      <input
                        className={fc('upi_id')}
                        placeholder="yourclub@upi"
                        value={form.upi_id}
                        onChange={e => set('upi_id', e.target.value)}
                      />
                      {fieldErrs.upi_id && <p className="text-evred text-xs mt-1">{fieldErrs.upi_id}</p>}
                    </div>
                    <div>
                      <label className="label">Payee Name <span className="text-evred">*</span></label>
                      <input
                        className={fc('payee_name')}
                        placeholder="Club / Department name"
                        value={form.payee_name}
                        onChange={e => set('payee_name', e.target.value)}
                      />
                      {fieldErrs.payee_name && <p className="text-evred text-xs mt-1">{fieldErrs.payee_name}</p>}
                    </div>
                  </div>

                  {/* QR Upload */}
                  <div>
                    <label className="label">UPI QR Code Image <span className="text-muted text-xs font-normal">(recommended)</span></label>
                    <p className="text-xs text-muted mb-3">
                      Students see this QR in the payment popup. Upload a screenshot of your UPI QR.
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
                          <button type="button" onClick={removeQr}
                            className="text-xs text-evred hover:text-evred/80 transition-colors text-left">
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
                    <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={onQrChange} />
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
              <div className="space-y-2.5 text-sm">
                {[
                  ['Title',        form.title],
                  ['Category',     form.category],
                  ['Eligibility',  form.eligibility],
                  ['Description',  form.description],
                  ['Start',        new Date(form.start_datetime).toLocaleString('en-IN')],
                  ['End',          new Date(form.end_datetime).toLocaleString('en-IN')],
                  ['Reg Deadline', new Date(form.registration_deadline).toLocaleString('en-IN')],
                  ['Venue',        venues.find(v => String(v.venue_id) === String(form.venue_id))?.name || '—'],
                  ['Fee',          isPaid ? `₹${form.fee}` : 'Free'],
                  ['Max Capacity', `${form.max_participants} participants`],
                  ['Team Size',    parseInt(form.max_team_size) > 1 ? `${form.min_team_size}–${form.max_team_size} members` : 'Individual'],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-3 py-1 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                    <span className="text-muted w-28 flex-shrink-0 text-xs">{label}</span>
                    <span className="text-white text-sm">{val}</span>
                  </div>
                ))}
              </div>

              {isPaid && (
                <div className="border-t border-[rgba(255,255,255,0.07)] pt-4 space-y-2.5 text-sm">
                  <p className="text-xs text-evamber font-medium uppercase tracking-wide mb-3">Payment</p>
                  {[
                    ['UPI ID',  form.upi_id],
                    ['Payee',   form.payee_name],
                  ].map(([label, val]) => (
                    <div key={label} className="flex gap-3 py-1 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                      <span className="text-muted w-28 flex-shrink-0 text-xs">{label}</span>
                      <span className="text-white text-sm">{val || '—'}</span>
                    </div>
                  ))}
                  <div className="flex gap-3 items-center pt-1">
                    <span className="text-muted w-28 flex-shrink-0 text-xs">QR Image</span>
                    {qrPreview
                      ? <img src={qrPreview} alt="QR" className="w-16 h-16 object-contain rounded-lg border border-gold/30 bg-white p-0.5" />
                      : <span className="text-muted text-xs italic">Not uploaded</span>
                    }
                  </div>
                </div>
              )}

              <div className="bg-evamber/10 border border-evamber/20 rounded-xl px-4 py-3 text-xs text-evamber mt-2">
                After submission, an Admin will review and approve this event before it goes live for students.
              </div>
            </div>
          )}

          {/* Error banner */}
          {err && (
            <div className="mt-4 flex items-start gap-2 text-evred text-xs bg-evred/10 border border-evred/20 px-3 py-2.5 rounded-lg">
              <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {err}
            </div>
          )}

          {/* Nav buttons */}
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
              <button
                onClick={next}
                className="flex items-center gap-1.5 btn-gold px-6 py-2.5"
              >
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
