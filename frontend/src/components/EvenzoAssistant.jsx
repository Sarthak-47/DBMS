import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/* ─────────────────────────────────────────────────────────────
 * Evenzo AI Assistant — role-aware help chatbot
 * No backend dependency; rule-based intent matching.
 * ───────────────────────────────────────────────────────────── */

/** Role key normalization — maps DB roles to our KB buckets. */
function roleKey(role) {
  if (role === 'admin') return 'admin'
  if (role === 'organizer' || role === 'organiser' || role === 'faculty') return 'organizer'
  return 'student' // student + other_student
}

const ROLE_LABEL = {
  student: 'Student',
  organizer: 'Organizer / Faculty',
  admin: 'Admin',
}

/** Help commands shown as quick chips in the launcher. */
const COMMANDS = {
  student: [
    { cmd: '/events',        label: 'Browse events' },
    { cmd: '/register',      label: 'How do I register?' },
    { cmd: '/teams',         label: 'Team registration' },
    { cmd: '/payment',       label: 'Payment help' },
    { cmd: '/my-regs',       label: 'View my registrations' },
    { cmd: '/cancel',        label: 'Cancel registration' },
    { cmd: '/clash',         label: 'Time-clash rule' },
  ],
  organizer: [
    { cmd: '/create',        label: 'Create an event' },
    { cmd: '/approval',      label: 'Approval workflow' },
    { cmd: '/venue',         label: 'Pick a venue' },
    { cmd: '/capacity',      label: 'Capacity rules' },
    { cmd: '/fees',          label: 'Registration fees & UPI' },
    { cmd: '/registrations', label: 'View registrations' },
    { cmd: '/lifecycle',     label: 'Event lifecycle' },
  ],
  admin: [
    { cmd: '/pending',       label: 'Approve pending events' },
    { cmd: '/reject',        label: 'Reject / auto-reject' },
    { cmd: '/venues',        label: 'Manage venues' },
    { cmd: '/users',         label: 'User & role control' },
    { cmd: '/reports',       label: 'Revenue & reports' },
    { cmd: '/clashes',       label: 'Venue clash policy' },
    { cmd: '/archive',       label: 'Archive completed events' },
  ],
}

/** Knowledge base — role × keyword → answer (JSX allowed). */
const KB = {
  student: [
    {
      keys: ['event', 'browse', 'explore', 'list', '/events'],
      a: (
        <>
          Head to <Link to="/events" className="text-gold underline">Explore Events</Link>. You'll see all
          <b> approved</b> and <b>upcoming</b> events with venue, fee, team size, and deadline.
        </>
      ),
    },
    {
      keys: ['register', 'sign up for event', 'join event', '/register'],
      a: (
        <>
          Open the event card → click <b>Register</b>. If it has a team size &gt; 1, you'll be asked for a
          team name and teammates. You must register <b>before the registration deadline</b>.
        </>
      ),
    },
    {
      keys: ['team', 'teammate', 'squad', '/teams'],
      a: (
        <>
          Team events require a unique team name per event. Add teammates by their SRM email / reg. no.
          You can view all your teams under <Link to="/teams" className="text-gold underline">My Teams</Link>.
          Team size must satisfy <code>min_team_size ≤ N ≤ max_team_size</code>.
        </>
      ),
    },
    {
      keys: ['pay', 'payment', 'fee', 'upi', 'txn', '/payment'],
      a: (
        <>
          Paid events show a UPI ID + QR. Pay, then paste the <b>transaction reference</b> into the
          registration modal. Your status flips from <i>Pending</i> → <i>Registered</i> once payment is verified.
        </>
      ),
    },
    {
      keys: ['my registration', 'status', 'registered', '/my-regs'],
      a: (
        <>
          See <Link to="/my-registrations" className="text-gold underline">My Registrations</Link> for every
          event you've joined, payment status, and team info.
        </>
      ),
    },
    {
      keys: ['cancel', 'withdraw', 'leave', '/cancel'],
      a: (
        <>
          Open <Link to="/my-registrations" className="text-gold underline">My Registrations</Link> → click
          <b> Cancel</b> on the event. Paid fees are non-refundable unless the event itself is cancelled by the organizer.
        </>
      ),
    },
    {
      keys: ['clash', 'overlap', 'conflict', '/clash'],
      a: (
        <>
          Evenzo blocks you from registering for two events whose times overlap. If you hit a clash error,
          cancel the earlier one first or pick an event in a different time slot.
        </>
      ),
    },
    {
      keys: ['profile', 'edit profile', 'password'],
      a: (
        <>
          Update your details under <Link to="/profile" className="text-gold underline">My Profile</Link>.
          Changing password requires you to know your current one.
        </>
      ),
    },
  ],

  organizer: [
    {
      keys: ['create', 'new event', 'add event', '/create'],
      a: (
        <>
          Go to <Link to="/organizer/create" className="text-gold underline">Create Event</Link>. Fill in title,
          category, description, venue, start/end, <b>registration deadline</b>, fee, min/max team size, and
          max participants. Submit — the event enters <i>Pending</i> until an Admin approves it.
        </>
      ),
    },
    {
      keys: ['approve', 'approval', 'pending', '/approval'],
      a: (
        <>
          New events start as <code>approval_status = Pending</code>. Only after Admin marks them
          <b> Approved</b> do they appear to students. You'll see the state on
          <Link to="/organizer/events" className="text-gold underline"> My Events</Link>.
        </>
      ),
    },
    {
      keys: ['venue', 'where', 'room', 'hall', '/venue'],
      a: (
        <>
          Pick from the <b>VENUE</b> list (Auditorium / Lab / Classroom / Ground / Online). The system
          rejects a venue booking that overlaps in time with an existing event at the same venue.
        </>
      ),
    },
    {
      keys: ['capacity', 'max participants', 'limit', '/capacity'],
      a: (
        <>
          <code>max_participants</code> must be ≤ <code>venue.capacity</code>. Once reached, further
          registrations are auto-blocked by <code>proc_register_student</code>.
        </>
      ),
    },
    {
      keys: ['fee', 'upi', 'money', 'revenue', 'payment', '/fees'],
      a: (
        <>
          Set <code>reg_fee</code> to 0 for free events. For paid events, add UPI ID, payee name, and a QR image
          under EVENT_PAYMENT_DETAILS. Revenue is visible in <code>vw_event_revenue_report</code>.
        </>
      ),
    },
    {
      keys: ['registrant', 'who registered', 'participant', '/registrations'],
      a: (
        <>
          Open <Link to="/organizer/events" className="text-gold underline">My Events</Link> → click an event
          → <b>Registrations</b>. You'll see confirmed + pending entries and teams.
        </>
      ),
    },
    {
      keys: ['lifecycle', 'status', 'ongoing', 'completed', 'archive', '/lifecycle'],
      a: (
        <>
          Events move Upcoming → Ongoing → Completed → Archived. When you mark an event Completed past its
          deadline, the <code>trg_cancel_unpaid_on_event_complete</code> trigger auto-cancels unpaid registrations.
        </>
      ),
    },
    {
      keys: ['passcode', 'organizer passcode'],
      a: <>Organizer/faculty accounts can only be created with a passcode provided by Admin during registration.</>,
    },
  ],

  admin: [
    {
      keys: ['pending', 'approve', 'approval', '/pending'],
      a: (
        <>
          Review submissions at <Link to="/admin/pending" className="text-gold underline">Pending Events</Link>.
          Approving sets <code>approval_status = Approved</code>, <code>approved_by_admin_id</code>, and
          <code> approved_at</code>.
        </>
      ),
    },
    {
      keys: ['reject', 'auto reject', 'stale', '/reject'],
      a: (
        <>
          Reject individually from the pending list, or run
          <code> CALL auto_reject_stale_events(N)</code> to bulk-reject anything pending for more than N days.
        </>
      ),
    },
    {
      keys: ['venue', 'add venue', 'capacity', '/venues'],
      a: (
        <>
          Manage venues at <Link to="/admin/venues" className="text-gold underline">Venues</Link>. Capacity is
          enforced against every event's <code>max_participants</code>.
        </>
      ),
    },
    {
      keys: ['user', 'role', 'organizer', 'faculty', '/users'],
      a: (
        <>
          Admins cannot self-register — they must be inserted directly into the <code>users</code> table.
          Organizer/faculty signups require the organizer passcode. Students and other-college students can
          self-register freely.
        </>
      ),
    },
    {
      keys: ['report', 'revenue', 'analytics', 'summary', '/reports'],
      a: (
        <>
          Use the built-in views:
          <ul className="list-disc ml-5 mt-1 space-y-0.5">
            <li><code>vw_upcoming_approved_events</code></li>
            <li><code>vw_student_registration_summary</code></li>
            <li><code>vw_event_revenue_report</code></li>
          </ul>
        </>
      ),
    },
    {
      keys: ['clash', 'venue clash', 'conflict', '/clashes'],
      a: (
        <>
          Overlap detection uses <code>A.start &lt; B.end AND A.end &gt; B.start</code> on both
          (user-time-clash) and (venue-clash). Enforced inside <code>proc_register_no_time_clash</code> and
          <code> proc_create_event_no_venue_clash</code>.
        </>
      ),
    },
    {
      keys: ['archive', 'close', 'deadline', '/archive'],
      a: (
        <>
          Run <code>CALL close_event_registrations()</code> to archive any Upcoming event whose
          <code> reg_last_date</code> has passed.
        </>
      ),
    },
    {
      keys: ['registration list', 'all registrations'],
      a: (
        <>
          See every registration across the system at
          <Link to="/admin/registrations" className="text-gold underline"> Registrations</Link>.
        </>
      ),
    },
  ],
}

/** Common fallback answers independent of role. */
const GENERIC = [
  {
    keys: ['hi', 'hello', 'hey', 'yo'],
    a: "Hey! Ask me anything about Evenzo — or tap a quick command below.",
  },
  {
    keys: ['help', 'commands', '?'],
    a: 'Use the chips below for quick help, or type a keyword like "payment", "venue", "approval", "clash".',
  },
  {
    keys: ['logout', 'sign out'],
    a: 'Use the Logout button at the bottom of the sidebar.',
  },
  {
    keys: ['password', 'forgot'],
    a: 'Password reset isn\'t self-service yet — contact admin.',
  },
  {
    keys: ['thanks', 'thank you', 'ty'],
    a: "Anytime ✨",
  },
]

function findAnswer(text, role) {
  const q = text.trim().toLowerCase()
  if (!q) return null
  const pool = [...(KB[role] || []), ...GENERIC]
  // exact /command match first
  for (const item of pool) {
    if (item.keys.some((k) => k.startsWith('/') && k.toLowerCase() === q)) return item.a
  }
  // keyword match
  for (const item of pool) {
    if (item.keys.some((k) => !k.startsWith('/') && q.includes(k.toLowerCase()))) return item.a
  }
  return null
}

/* ─────────────────────────────── Component ─────────────────────────────── */

export default function EvenzoAssistant() {
  const user = useAuthStore((s) => s.user)
  const role = roleKey(user?.role)
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [messages, setMessages] = useState(() => ([
    { from: 'bot', text: `Hi ${user?.full_name?.split(' ')[0] || 'there'} 👋 I'm Evie, your Evenzo assistant. I know help for ${ROLE_LABEL[role]} accounts. Pick a command or ask me something.` },
  ]))
  const endRef = useRef(null)

  const commands = useMemo(() => COMMANDS[role] || [], [role])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function send(raw) {
    const text = (raw ?? input).trim()
    if (!text) return
    const answer = findAnswer(text, role)
    setMessages((m) => [
      ...m,
      { from: 'user', text },
      { from: 'bot',  text: answer || "I don't have a canned answer for that — try a /command below, or rephrase using keywords like 'payment', 'team', 'approval', 'venue'." },
    ])
    setInput('')
  }

  function runCommand(cmd) {
    send(cmd)
  }

  // Don't render on login/register pages or when not authenticated
  const { pathname } = useLocation()
  if (!user) return null
  if (pathname === '/login' || pathname === '/register' || pathname === '/') return null

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Evenzo assistant"
          className="fixed bottom-5 right-5 z-40 rounded-full bg-gold text-bg shadow-lg hover:shadow-gold/30 transition-all px-4 py-3 flex items-center gap-2 font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-bg animate-pulse" />
          Evie · Help
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)]
                        bg-surface border border-[rgba(200,169,110,0.25)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(200,169,110,0.18)] bg-surface2/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-sm">E</div>
              <div className="leading-tight">
                <p className="text-white text-sm font-medium">Evie</p>
                <p className="text-muted text-[11px]">{ROLE_LABEL[role]} help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-white text-xl leading-none px-1">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] text-sm px-3 py-2 rounded-xl
                  ${m.from === 'user'
                    ? 'bg-gold text-bg rounded-br-sm'
                    : 'bg-surface2 text-white/90 border border-[rgba(255,255,255,0.06)] rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Commands */}
          <div className="px-3 py-2 border-t border-[rgba(200,169,110,0.12)] flex flex-wrap gap-1.5 bg-bg/40">
            {commands.map((c) => (
              <button key={c.cmd} onClick={() => runCommand(c.cmd)}
                className="text-[11px] text-gold border border-[rgba(200,169,110,0.25)] rounded-full px-2.5 py-1 hover:bg-gold/10 transition-colors">
                {c.cmd}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send() }}
            className="flex items-center gap-2 px-3 py-2 border-t border-[rgba(200,169,110,0.18)] bg-surface">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events, payment, approval…"
              className="flex-1 bg-surface2 text-white text-sm rounded-lg px-3 py-2 outline-none border border-transparent focus:border-gold/40" />
            <button type="submit"
              className="bg-gold text-bg text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition-opacity">
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
