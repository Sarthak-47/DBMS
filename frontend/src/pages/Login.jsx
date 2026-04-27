import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import client from '../api/client'
import GhostCursor from '../components/GhostCursor/GhostCursor'

const DEMOS = [
  { label: 'Arjun (Student)',  email: 'arjun@srmist.edu.in',   password: 'password123', dash: '/dashboard' },
  { label: 'Ramesh (Org)',     email: 'ramesh@srmist.edu.in',  password: 'password123', dash: '/organizer/dashboard' },
  { label: 'Vartika (Admin)',  email: 'vartika@srmist.edu.in', password: 'password123', dash: '/admin/dashboard' },
]

const DASH = {
  student: '/dashboard', other_student: '/dashboard',
  organizer: '/organizer/dashboard', faculty: '/organizer/dashboard',
  admin: '/admin/dashboard',
}

export default function Login() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const { data } = await client.post('/auth/login', { email, password })
      setAuth(data.access_token, data.user)
      navigate(DASH[data.user.role] || '/dashboard')
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  function fillDemo({ email, password, dash }) {
    setEmail(email); setPassword(password); setErr('')
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
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
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl text-gold">Evenzo</Link>
          <p className="text-muted text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Demo buttons */}
        <div className="card p-4 mb-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">Demo Accounts</p>
          <div className="flex gap-2 flex-wrap">
            {DEMOS.map((d) => (
              <button key={d.label} onClick={() => fillDemo(d)}
                className="text-xs border border-[rgba(200,169,110,0.2)] text-gold px-3 py-1.5 rounded-lg hover:bg-gold/10 transition-colors">
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" required autoComplete="email"
                placeholder="you@srmist.edu.in"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" required autoComplete="current-password"
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {err && <p className="text-evred text-xs bg-evred/10 px-3 py-2 rounded-lg">{err}</p>}

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3 disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-muted text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-gold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
