import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import client from '../api/client'
import GhostCursor from '../components/GhostCursor/GhostCursor'

const TABS = ['SRM Student', 'Other College', 'Organizer']

const YEARS_SRM = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const ORG_TYPES = ['Club', 'Department']
const ORG_ROLES = ['Club Head', 'Department Head', 'Coordinator', 'Member']

const ROLE_MAP = {
  'SRM Student': 'student',
  'Other College': 'other_student',
  'Organizer': 'organizer',
}

export default function Register() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState('SRM Student')
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')
  const [form, setForm]     = useState({
    full_name: '', email: '', password: '', phone: '',
    reg_no: '', department: '', year: '', course: '',
    college_name: '', city: '',
    org_type: 'Club', org_role: 'Club Head', org_name: '', designation: '',
    org_passcode: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      const role = ROLE_MAP[tab]
      const payload = {
        full_name: form.full_name, email: form.email,
        password: form.password,  phone: form.phone,
        role,
      }
      if (tab === 'SRM Student') {
        Object.assign(payload, {
          reg_no: form.reg_no.toUpperCase(), department: form.department,
          year: form.year, course: form.course,
        })
      } else if (tab === 'Other College') {
        Object.assign(payload, {
          college_name: form.college_name, city: form.city, course: form.course,
          year: form.year,
        })
      } else if (tab === 'Organizer') {
        Object.assign(payload, {
          org_type: form.org_type, org_role: form.org_role,
          org_name: form.org_name, department: form.department,
          designation: form.designation, org_passcode: form.org_passcode,
        })
      }

      await client.post('/auth/register', payload)
      navigate('/login')
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <GhostCursor
        trailLength={40}
        inertia={0.5}
        grainIntensity={0.06}
        bloomStrength={0.1}
        bloomRadius={1}
        brightness={1.2}
        color="#c8a963"
        edgeIntensity={0}
        zIndex={0}
      />
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl text-gold">Evenzo</Link>
          <p className="text-muted text-sm mt-2">Create your account</p>
        </div>

        {/* Role Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-[rgba(200,169,110,0.18)] mb-5">
          {TABS.map(t => (
            <button key={t} onClick={() => { setTab(t); setErr('') }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t ? 'bg-gold text-bg' : 'text-muted hover:text-white hover:bg-surface2'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Full Name</label>
                <input className="input" required placeholder="Arjun Sharma"
                  value={form.full_name} onChange={e => set('full_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" required placeholder="you@srmist.edu.in"
                  value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" type="tel" placeholder="9876543210"
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Password</label>
                <input className="input" type="password" required minLength={6} placeholder="Min 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} />
              </div>
            </div>

            {/* SRM Student */}
            {tab === 'SRM Student' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Registration Number</label>
                  <input className="input uppercase" required placeholder="RA2211003010001"
                    value={form.reg_no} onChange={e => set('reg_no', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="CSE"
                    value={form.department} onChange={e => set('department', e.target.value)} />
                </div>
                <div>
                  <label className="label">Year</label>
                  <select className="input" value={form.year} onChange={e => set('year', e.target.value)}>
                    <option value="">Select year</option>
                    {YEARS_SRM.map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Course</label>
                  <input className="input" placeholder="B.Tech"
                    value={form.course} onChange={e => set('course', e.target.value)} />
                </div>
              </div>
            )}

            {/* Other College */}
            {tab === 'Other College' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">College Name</label>
                  <input className="input" required placeholder="IIT Madras"
                    value={form.college_name} onChange={e => set('college_name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Course</label>
                  <input className="input" placeholder="B.Tech"
                    value={form.course} onChange={e => set('course', e.target.value)} />
                </div>
                <div>
                  <label className="label">Year</label>
                  <input className="input" type="number" min="1" max="5" placeholder="3"
                    value={form.year} onChange={e => set('year', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">City</label>
                  <input className="input" placeholder="Chennai"
                    value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
              </div>
            )}

            {/* Organizer */}
            {tab === 'Organizer' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Organization Type</label>
                  <select className="input" value={form.org_type} onChange={e => set('org_type', e.target.value)}>
                    {ORG_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={form.org_role} onChange={e => set('org_role', e.target.value)}>
                    {ORG_ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Organization / Club Name</label>
                  <input className="input" required placeholder="Robotics Club SRM"
                    value={form.org_name} onChange={e => set('org_name', e.target.value)} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="CSE"
                    value={form.department} onChange={e => set('department', e.target.value)} />
                </div>
                <div>
                  <label className="label">Designation</label>
                  <input className="input" placeholder="Club Head"
                    value={form.designation} onChange={e => set('designation', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="label">Organizer Passcode</label>
                  <input className="input" required type="password" placeholder="Contact admin for passcode"
                    value={form.org_passcode} onChange={e => set('org_passcode', e.target.value)} />
                </div>
              </div>
            )}

            {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-gold hover:underline">Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
