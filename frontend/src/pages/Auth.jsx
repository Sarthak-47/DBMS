import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const DEPARTMENTS = [
  'Computer Science', 'AI & Machine Learning', 'Information Technology',
  'Electronics & Communication', 'Mechanical', 'Civil', 'Biomedical',
  'Computational Intelligence', 'Chemical', 'Management',
]

const DEMO_USERS = [
  { label: 'Arjun (Student)',  email: 'arjun@srmist.edu.in',        password: 'password123', role: 'student'   },
  { label: 'Karthik (Org)',    email: 'karthik@srmist.edu.in',      password: 'password123', role: 'organiser' },
  { label: 'Vartika (Admin)',  email: 'admin@srmist.edu.in',        password: 'password123', role: 'admin'     },
]

const ROLE_TABS = [
  { id: 'student',         label: 'SRM Student'    },
  { id: 'non_srm_student', label: 'Other College'  },
  { id: 'organiser',       label: 'Organizer'      },
  { id: 'admin',           label: 'Admin'          },
]

const ORG_TYPES  = ['Club', 'Department']
const ORG_ROLES  = ['Club Head', 'Department Head', 'Coordinator', 'Member']
const YEARS      = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const ADMIN_PASSCODE = 'EVENZO-ADMIN-2026'

function dashPath(role) {
  return {
    student:         '/dashboard',
    non_srm_student: '/dashboard',
    organiser:       '/organizer/dashboard',
    admin:           '/admin/dashboard',
    faculty:         '/dashboard',
  }[role] || '/'
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const isRegister = searchParams.get('mode') === 'register' || window.location.pathname === '/register'
  const [mode, setMode] = useState(isRegister ? 'register' : 'login')
  const [tab, setTab]   = useState('student')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user }  = useAuth()
  const navigate         = useNavigate()

  useEffect(() => { if (user) navigate(dashPath(user.role), { replace: true }) }, [user])

  /* ── Login form state ── */
  const [lf, setLf] = useState({ email: '', password: '' })

  /* ── Register form state ── */
  const [rf, setRf] = useState({
    full_name: '', email: '', password: '', phone: '',
    // SRM Student
    reg_no: '', department: '', year: '', course: '',
    // Non-SRM
    college_name: '', college_course: '', college_year: '', city: '',
    // Organiser
    org_type: 'Club', org_role: 'Club Head', org_name: '', org_passcode: '', designation: '', org_department: '',
    // Admin
    admin_passcode: '',
  })

  function upd(k) { return (e) => setRf((p) => ({ ...p, [k]: e.target.value })) }

  function fillDemo(demo) {
    setLf({ email: demo.email, password: demo.password })
    setMode('login')
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: lf.email, password: lf.password, role: '' })
      login(data.access_token, { sub: String(data.user_id), role: data.role, name: data.name })
      navigate(dashPath(data.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.')
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (tab === 'admin' && rf.admin_passcode !== ADMIN_PASSCODE) {
        setError('Invalid admin passcode.'); setLoading(false); return
      }
      if (tab === 'organiser' && !rf.org_passcode) {
        setError('Organizer passcode is required.'); setLoading(false); return
      }

      const [first_name, ...rest] = rf.full_name.trim().split(' ')
      const last_name = rest.join(' ') || '.'

      const payload = {
        first_name, last_name, email: rf.email, password: rf.password,
        phone: rf.phone || undefined,
        role: tab,
      }

      if (tab === 'student') {
        Object.assign(payload, {
          reg_no: rf.reg_no || undefined,
          department: rf.department,
          year: rf.year ? parseInt(rf.year) : undefined,
          course: rf.course,
        })
      } else if (tab === 'non_srm_student') {
        Object.assign(payload, {
          college_name: rf.college_name,
          course: rf.college_course,
          year: rf.college_year ? parseInt(rf.college_year) : undefined,
          city: rf.city,
        })
      } else if (tab === 'organiser') {
        Object.assign(payload, {
          department: rf.org_department,
          designation: rf.designation,
          org_type: rf.org_type,
          org_role: rf.org_role,
          org_name: rf.org_name,
        })
      }

      await api.post('/auth/register', payload)
      const { data } = await api.post('/auth/login', { email: rf.email, password: rf.password, role: '' })
      login(data.access_token, { sub: String(data.user_id), role: data.role, name: data.name })
      navigate(dashPath(data.role), { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  /* ── helpers ── */
  const Input = ({ label, ...props }) => (
    <div>
      <label className="label">{label}</label>
      <input className="input" {...props} />
    </div>
  )
  const Select = ({ label, options, ...props }) => (
    <div>
      <label className="label">{label}</label>
      <select className="input" {...props}>
        {options.map((o) => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex font-body">
      {/* Left panel */}
      <div className="hidden lg:flex w-[42%] bg-gradient-to-br from-surface to-bg flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(200,169,110,0.12)_0%,transparent_60%)]" />
        <Link to="/" className="relative z-10 font-display text-2xl font-bold">
          <span className="text-gold">Ev</span><span className="text-white">enzo</span>
        </Link>
        <div className="relative z-10">
          <p className="text-gold text-xs uppercase tracking-widest mb-3">SRM Institute</p>
          <h2 className="font-display text-4xl text-white leading-tight mb-5">
            Your gateway to<br /><span className="text-gold">campus events.</span>
          </h2>
          <div className="grid grid-cols-3 gap-5 mb-8">
            {[['4,200+','Students'],['38','Clubs'],['124+','Events']].map(([v,l]) => (
              <div key={l}>
                <p className="font-display text-2xl text-gold">{v}</p>
                <p className="text-muted text-xs mt-0.5">{l}</p>
              </div>
            ))}
          </div>
          {/* Demo login shortcuts */}
          {mode === 'login' && (
            <div>
              <p className="text-muted text-xs mb-2 uppercase tracking-wider">Quick demo login</p>
              <div className="flex flex-col gap-2">
                {DEMO_USERS.map((d) => (
                  <button key={d.label} onClick={() => fillDemo(d)}
                    className="text-left px-4 py-2.5 rounded-lg border border-[rgba(200,169,110,0.18)] text-sm text-muted hover:text-white hover:border-gold/40 transition-colors flex items-center justify-between">
                    <span>{d.label}</span>
                    <span className="text-xs text-gold/60 capitalize">{d.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <p className="relative z-10 text-muted text-xs">21CSC205P · DBMS Mini Project · SRM IST</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mode toggle */}
          <div className="flex bg-surface2 rounded-xl p-1 mb-6">
            {[['login','Sign In'],['register','Create Account']].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === m ? 'bg-gold text-bg shadow' : 'text-muted hover:text-white'
                }`}>{l}</button>
            ))}
          </div>

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <h1 className="font-display text-3xl text-white mb-1">Welcome back</h1>
              <p className="text-muted text-sm mb-6">Sign in to access your dashboard</p>

              {/* Mobile demo buttons */}
              <div className="lg:hidden flex gap-2 mb-5 flex-wrap">
                {DEMO_USERS.map((d) => (
                  <button key={d.label} onClick={() => fillDemo(d)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(200,169,110,0.2)] text-muted hover:text-white hover:border-gold/40 transition-colors">
                    {d.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" type="email" required placeholder="you@srmist.edu.in"
                    value={lf.email} onChange={(e) => setLf((p) => ({ ...p, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" required minLength={6} placeholder="••••••••"
                    value={lf.password} onChange={(e) => setLf((p) => ({ ...p, password: e.target.value }))} />
                </div>
                {error && <p className="text-evred text-sm bg-evred/10 px-4 py-2.5 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="btn-gold w-full py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
              <p className="text-center text-xs text-muted mt-5">
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-gold hover:underline">Sign up</button>
              </p>
            </>
          )}

          {/* ── REGISTER ── */}
          {mode === 'register' && (
            <>
              <h1 className="font-display text-3xl text-white mb-1">Create Account</h1>
              <p className="text-muted text-sm mb-5">Join Evenzo — SRM's event platform</p>

              {/* Role tabs */}
              <div className="flex bg-surface2 rounded-xl p-1 mb-5 gap-1">
                {ROLE_TABS.map((t) => (
                  <button key={t.id} onClick={() => { setTab(t.id); setError('') }}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      tab === t.id ? 'bg-gold text-bg' : 'text-muted hover:text-white'
                    }`}>{t.label}</button>
                ))}
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Global fields */}
                <Input label="Full Name" required placeholder="Arjun Nair"
                  value={rf.full_name} onChange={upd('full_name')} />
                <Input label="Email" type="email" required
                  placeholder={tab === 'non_srm_student' ? 'your@email.com' : 'you@srmist.edu.in'}
                  value={rf.email} onChange={upd('email')} />
                <Input label="Password" type="password" required minLength={6} placeholder="Min. 6 characters"
                  value={rf.password} onChange={upd('password')} />
                <Input label="Phone" type="tel" placeholder="+91 9876543210"
                  value={rf.phone} onChange={upd('phone')} />

                {/* SRM Student */}
                {tab === 'student' && (
                  <>
                    <Input label="Registration No." placeholder="RA24XXXXXXXXX"
                      value={rf.reg_no} onChange={(e) => setRf((p) => ({ ...p, reg_no: e.target.value.toUpperCase() }))} />
                    <Input label="Department (e.g. CSE)" placeholder="Computer Science Engineering"
                      value={rf.department} onChange={upd('department')} />
                    <Select label="Year" options={YEARS.map((y,i) => ({ v: String(i+1), l: y }))}
                      value={rf.year} onChange={upd('year')} />
                    <Input label="Course (e.g. B.Tech)" placeholder="B.Tech"
                      value={rf.course} onChange={upd('course')} />
                  </>
                )}

                {/* Non-SRM */}
                {tab === 'non_srm_student' && (
                  <div className="space-y-3.5">
                    <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 text-xs text-muted">
                      <span className="text-gold font-medium">Non-SRM Student — </span>
                      You can register for events open to all colleges.
                    </div>
                    <Input label="College Name" required placeholder="VIT University"
                      value={rf.college_name} onChange={upd('college_name')} />
                    <Input label="Course" required placeholder="B.Tech Computer Science"
                      value={rf.college_course} onChange={upd('college_course')} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Year" type="number" min="1" max="5" placeholder="2"
                        value={rf.college_year} onChange={upd('college_year')} />
                      <Input label="City" placeholder="Chennai"
                        value={rf.city} onChange={upd('city')} />
                    </div>
                  </div>
                )}

                {/* Organiser */}
                {tab === 'organiser' && (
                  <>
                    <Select label="Organization Type" options={ORG_TYPES}
                      value={rf.org_type} onChange={upd('org_type')} />
                    <Select label="Role" options={ORG_ROLES}
                      value={rf.org_role} onChange={upd('org_role')} />
                    <Input label="Organization / Club Name" required placeholder="HackSRM"
                      value={rf.org_name} onChange={upd('org_name')} />
                    <Input label="Organizer Passcode" type="password" required placeholder="Contact admin for passcode"
                      value={rf.org_passcode} onChange={upd('org_passcode')} />
                    <Input label="Department (Academic)" placeholder="Computer Science"
                      value={rf.org_department} onChange={upd('org_department')} />
                    <Input label="Designation" placeholder="Club Head"
                      value={rf.designation} onChange={upd('designation')} />
                  </>
                )}

                {/* Admin */}
                {tab === 'admin' && (
                  <div className="space-y-3.5">
                    <div className="bg-evred/5 border border-evred/20 rounded-xl p-3 text-xs text-evred/80">
                      Admin accounts require a system passcode. Contact the platform administrator.
                    </div>
                    <Input label="Admin Passcode" type="password" required placeholder="EVENZO-ADMIN-****"
                      value={rf.admin_passcode} onChange={upd('admin_passcode')} />
                  </div>
                )}

                {error && <p className="text-evred text-sm bg-evred/10 px-4 py-2.5 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="btn-gold w-full py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
              <p className="text-center text-xs text-muted mt-5">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-gold hover:underline">Sign in instead</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
