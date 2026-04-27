import { Link } from 'react-router-dom'

const CAT_COLORS = {
  Hackathon:  { bg: 'from-blue-900/40 to-purple-900/40',  accent: 'text-purple-300' },
  Workshop:   { bg: 'from-teal-900/40 to-cyan-900/40',    accent: 'text-cyan-300'   },
  Cultural:   { bg: 'from-pink-900/40 to-rose-900/40',    accent: 'text-pink-300'   },
  Technical:  { bg: 'from-blue-900/40 to-indigo-900/40',  accent: 'text-indigo-300' },
  Ideathon:   { bg: 'from-orange-900/40 to-amber-900/40', accent: 'text-amber-300'  },
  Makeathon:  { bg: 'from-green-900/40 to-emerald-900/40',accent: 'text-emerald-300'},
  Other:      { bg: 'from-surface2 to-surface3',           accent: 'text-muted'      },
}

function fmtDate(d) {
  if (!d) return 'TBD'
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function EventCard({ event, onRegister, registering }) {
  const { bg, accent } = CAT_COLORS[event.category] || CAT_COLORS.Other
  const isPaid = parseFloat(event.fee || 0) > 0

  return (
    <div className="card flex flex-col overflow-hidden hover:border-gold/30 transition-colors">
      {/* Thumbnail */}
      <div className={`h-28 bg-gradient-to-br ${bg} flex items-end px-4 pb-3 relative`}>
        <span className={`text-xs font-medium ${accent}`}>{event.category}</span>
        <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${
          isPaid ? 'bg-evamber/20 text-evamber' : 'bg-evgreen/20 text-evgreen'
        }`}>
          {isPaid ? `₹${event.fee}` : 'Free'}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-white text-base mb-1 line-clamp-2 leading-snug">
          {event.title}
        </h3>
        {event.description && (
          <p className="text-muted text-xs leading-relaxed line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        <div className="space-y-1 text-xs text-muted mb-4 mt-auto">
          <p>{fmtDate(event.start_datetime)}</p>
          {event.venue_name && <p>{event.venue_name}</p>}
          {event.organizer_name && <p>by {event.organizer_name}</p>}
        </div>

        <div className="flex gap-2">
          <Link to={`/events/${event.event_id}`}
            className="flex-1 text-center text-xs border border-[rgba(200,169,110,0.3)] text-gold py-2 rounded-lg hover:bg-gold/10 transition-colors">
            View Details
          </Link>
          {onRegister && (
            <button
              onClick={() => onRegister(event)}
              disabled={registering}
              className="flex-1 text-xs btn-gold py-2 disabled:opacity-60">
              {registering ? 'Registering…' : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
