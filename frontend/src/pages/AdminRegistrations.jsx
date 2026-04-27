import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

export default function AdminRegistrations() {
  const [regs, setRegs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/admin/registrations')
      .then(r => setRegs(r.data))
      .catch(() => setRegs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">Registration Audit</h1>
          <p className="text-muted text-sm">{regs.length} registration record{regs.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : regs.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  {['Student', 'Event & Team', 'Status', 'Timestamp'].map(h => (
                    <th key={h} className="text-left text-xs text-muted uppercase tracking-wider px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regs.map(r => (
                  <tr key={r.reg_id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-surface2/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-sm">{r.full_name || '—'}</p>
                      <p className="text-muted text-xs font-mono">{r.reg_no || `#${r.user_id}`}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm">{r.title}</p>
                      {r.team_name && <p className="text-muted text-xs">Team: {r.team_name}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-4 text-muted text-xs font-mono whitespace-nowrap">
                      {r.registered_at
                        ? new Date(r.registered_at).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center text-muted text-sm">No registrations found.</div>
        )}
      </div>
    </Sidebar>
  )
}
