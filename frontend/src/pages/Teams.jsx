import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import client from '../api/client'

export default function Teams() {
  const [teams, setTeams]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/teams/my')
      .then(r => setTeams(r.data))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Sidebar>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-7">
          <h1 className="font-display text-3xl text-white mb-1">My Teams</h1>
          <p className="text-muted text-sm">Teams you are part of across events</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {teams.map(t => <TeamCard key={t.team_id} team={t} />)}
          </div>
        ) : (
          <div className="card p-12 text-center text-muted">
            <p className="mb-1 font-medium text-white text-sm">No teams yet</p>
            <p className="text-xs">Register for a team event to see your teams here.</p>
          </div>
        )}
      </div>
    </Sidebar>
  )
}

function TeamCard({ team }) {
  const members = team.members || []
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-mono text-muted bg-surface2 px-2 py-0.5 rounded">
          #{String(team.team_id).padStart(4, '0')}
        </span>
        <span className={`badge-${team.status}`}>{team.status}</span>
      </div>

      <h3 className="text-white font-medium text-sm mb-0.5 line-clamp-1">{team.team_name}</h3>
      <p className="text-muted text-xs mb-4 line-clamp-1">{team.event_title}</p>

      {members.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {members.map((m, i) => (
            <span key={i} className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full font-mono">
              {m.full_name || m.reg_no || m}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-muted text-xs italic">No member details</p>
      )}
    </div>
  )
}
