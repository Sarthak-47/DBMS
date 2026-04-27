import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

function roleKey(role) {
  if (role === 'admin') return 'admin'
  if (role === 'organizer' || role === 'organiser' || role === 'faculty') return 'organizer'
  return 'student'
}

const ROLE_LABEL = {
  student:   'Student',
  organizer: 'Organizer / Faculty',
  admin:     'Admin',
}

/* ── Command chips per role ─────────────────────────────────── */
const COMMANDS = {
  student: [
    { cmd: '/register',  label: 'How do I register?'      },
    { cmd: '/payment',   label: 'Paying for an event'      },
    { cmd: '/teams',     label: 'Team registration'        },
    { cmd: '/cancel',    label: 'Cancel registration'      },
    { cmd: '/clash',     label: 'Time-clash error?'        },
    { cmd: '/my-regs',   label: 'View my registrations'   },
    { cmd: '/events',    label: 'Find events'              },
    { cmd: '/cert',      label: 'Get my certificate'       },
  ],
  organizer: [
    { cmd: '/create',      label: 'Create a new event'      },
    { cmd: '/approval',    label: 'Event approval process'  },
    { cmd: '/venue',       label: 'Choosing a venue'        },
    { cmd: '/fees',        label: 'Set registration fee'    },
    { cmd: '/team-size',   label: 'Team size settings'      },
    { cmd: '/registrants', label: 'View who registered'     },
    { cmd: '/edit-event',  label: 'Edit or delete event'    },
    { cmd: '/clash-venue', label: 'Venue clash error?'      },
  ],
  admin: [
    { cmd: '/approve',      label: 'Approve an event'           },
    { cmd: '/reject',       label: 'Reject an event'            },
    { cmd: '/add-venue',    label: 'Add a new venue'            },
    { cmd: '/all-events',   label: 'View all events'            },
    { cmd: '/all-regs',     label: 'View all registrations'     },
    { cmd: '/roles',        label: 'How user roles work'        },
    { cmd: '/clash-policy', label: 'Clash detection policy'     },
  ],
}

/* ── Knowledge base ─────────────────────────────────────────── */
const KB = {

  /* ── STUDENT ── */
  student: [
    {
      keys: ['/events', 'find event', 'browse', 'explore', 'discover', 'list events'],
      a: (
        <>
          <p className="mb-1 font-medium">Finding events</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Click <Link to="/events" className="text-gold underline">Explore Events</Link> in the sidebar.</li>
            <li>Use the <b>search bar</b> to find events by name.</li>
            <li>Filter by category — Hackathon, Workshop, Cultural, Technical, etc.</li>
            <li>Each card shows the date, venue, fee, and team size.</li>
            <li>Click <b>View Details</b> for the full description.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Cards marked with a green "Registered" badge are events you have already joined.</p>
        </>
      ),
    },
    {
      keys: ['/register', 'how to register', 'sign up', 'join event', 'register for'],
      a: (
        <>
          <p className="mb-1 font-medium">Registering for an event</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/events" className="text-gold underline">Explore Events</Link> and find the event you want.</li>
            <li>Click <b>Register Now</b> on the event card.</li>
            <li>If it is a <b>team event</b>, enter your team name when prompted.</li>
            <li>If there is a <b>fee</b>, a payment modal will appear — complete UPI payment first.</li>
            <li>Once submitted, your status shows as <b>Registered</b>.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Make sure to register before the deadline shown on the event card.</p>
        </>
      ),
    },
    {
      keys: ['/payment', 'pay', 'fee', 'upi', 'transaction', 'paid event', 'payment failed'],
      a: (
        <>
          <p className="mb-1 font-medium">Paying for a paid event</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Click <b>Register Now</b> — a payment modal opens showing the UPI ID and amount.</li>
            <li>Open your UPI app (PhonePe, GPay, Paytm) and pay to the UPI ID shown.</li>
            <li>Copy the <b>transaction reference / UTR number</b> from your payment app.</li>
            <li>Paste it into the <b>Transaction Reference</b> field in the modal.</li>
            <li>Click <b>I've Paid</b> — your registration is submitted for verification.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Fees are non-refundable unless the organizer cancels the event.</p>
        </>
      ),
    },
    {
      keys: ['/teams', 'team', 'teammate', 'group', 'squad', 'team registration'],
      a: (
        <>
          <p className="mb-1 font-medium">Team registration</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Team events show a <b>min / max team size</b> on the event card.</li>
            <li>When registering, enter a <b>unique team name</b> for that event.</li>
            <li>Your teammates also need to register for the same event using the <b>same team name</b>.</li>
            <li>View your teams anytime at <Link to="/teams" className="text-gold underline">My Teams</Link>.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Solo events (min = max = 1) do not ask for a team name.</p>
        </>
      ),
    },
    {
      keys: ['/cancel', 'cancel', 'withdraw', 'drop out', 'unregister'],
      a: (
        <>
          <p className="mb-1 font-medium">Cancelling your registration</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/my-registrations" className="text-gold underline">My Registrations</Link>.</li>
            <li>Find the event you want to leave.</li>
            <li>Click the <b>Cancel</b> button next to it.</li>
            <li>Your status changes to <i>Cancelled</i> immediately.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Paid fees are not refunded automatically — contact the organizer.</p>
        </>
      ),
    },
    {
      keys: ['/clash', 'clash', 'overlap', 'time conflict', 'already registered', 'conflict'],
      a: (
        <>
          <p className="mb-1 font-medium">Time-clash error</p>
          <p className="mt-1">Evenzo prevents you from registering for two events that run at the same time.</p>
          <p className="mt-1">To fix it:</p>
          <ol className="list-decimal ml-4 space-y-1 mt-1">
            <li>Go to <Link to="/my-registrations" className="text-gold underline">My Registrations</Link> to see which event is clashing.</li>
            <li>Cancel the conflicting event if you no longer need it.</li>
            <li>Then register for the new one.</li>
          </ol>
        </>
      ),
    },
    {
      keys: ['/my-regs', 'my registration', 'view registration', 'registration status', 'registered events'],
      a: (
        <>
          <p className="mb-1 font-medium">Your registrations</p>
          <p>Head to <Link to="/my-registrations" className="text-gold underline">My Registrations</Link> to see:</p>
          <ul className="list-disc ml-4 space-y-1 mt-1">
            <li>All events you have registered for</li>
            <li>Registration status — <b>Registered</b>, <b>Pending</b>, or <b>Cancelled</b></li>
            <li>Payment reference and payment status</li>
            <li>Team name (for team events)</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/cert', 'certificate', 'participation cert', 'download cert'],
      a: (
        <>
          <p className="mb-1 font-medium">Getting your certificate</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>You must have a <b>Registered</b> status for the event (not Pending or Cancelled).</li>
            <li>After the event ends, go to <b>Certificates</b> in the sidebar.</li>
            <li>Click <b>Generate</b> next to the event — your PDF is created.</li>
            <li>Click <b>Download</b> to save it.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Each certificate is a unique PDF with your name, reg. no., and event details.</p>
        </>
      ),
    },
  ],

  /* ── ORGANIZER ── */
  organizer: [
    {
      keys: ['/create', 'create event', 'new event', 'add event', 'how to create', 'make event'],
      a: (
        <>
          <p className="mb-1 font-medium">Creating a new event</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/organizer/create" className="text-gold underline">Create Event</Link> in the sidebar.</li>
            <li>Fill in: <b>Title</b>, <b>Category</b>, <b>Description</b>, <b>Eligibility</b>.</li>
            <li>Set <b>Venue</b>, <b>Start &amp; End date/time</b>, and <b>Registration Deadline</b>.</li>
            <li>Enter <b>Fee</b> (0 for free), <b>UPI ID</b> if paid, and <b>Min/Max Team Size</b>.</li>
            <li>Set <b>Max Participants</b> (cannot exceed venue capacity).</li>
            <li>Click <b>Submit</b> — the event enters <b>Pending</b> status.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">An Admin must approve it before students can see or register for it.</p>
        </>
      ),
    },
    {
      keys: ['/approval', 'approval', 'pending', 'approved', 'how long', 'when approved', 'event status'],
      a: (
        <>
          <p className="mb-1 font-medium">Event approval process</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>After you submit, your event status is <b>Pending</b>.</li>
            <li>An Admin reviews it and either <b>Approves</b> or <b>Rejects</b> it.</li>
            <li>Once <b>Approved</b>, it appears on the Explore Events page for students.</li>
            <li>If <b>Rejected</b>, you can recreate it with corrections.</li>
          </ul>
          <p className="mt-2">Track your events at <Link to="/organizer/events" className="text-gold underline">My Events</Link>.</p>
        </>
      ),
    },
    {
      keys: ['/venue', 'venue', 'choose venue', 'room', 'hall', 'auditorium', 'where'],
      a: (
        <>
          <p className="mb-1 font-medium">Choosing a venue</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>A dropdown in the Create Event form lists all available venues with their capacity.</li>
            <li>Each venue shows its <b>name, building, floor, room no., type, and capacity</b>.</li>
            <li>If another event is already booked at that venue during your time slot, you will see a <b>venue clash error</b> and must pick a different venue or time.</li>
            <li>Your <b>Max Participants</b> cannot exceed the venue capacity.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/fees', 'fee', 'upi', 'paid', 'free event', 'payment', 'set fee', 'charge'],
      a: (
        <>
          <p className="mb-1 font-medium">Setting registration fees</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Set <b>Fee</b> to <code>0</code> for a free event — no payment modal appears for students.</li>
            <li>For paid events, enter the <b>fee amount</b>, your <b>UPI ID</b>, <b>Payee Name</b>, and upload a <b>QR image</b>.</li>
            <li>Students will see the QR and UPI ID and must enter their transaction reference to register.</li>
            <li>You then verify each payment from <b>My Events</b> before their registration is confirmed.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/team-size', 'team size', 'min team', 'max team', 'solo', 'individual', 'group size'],
      a: (
        <>
          <p className="mb-1 font-medium">Team size settings</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Set <b>Min Team Size = Max Team Size = 1</b> for a solo/individual event.</li>
            <li>For team events, set e.g. <b>Min = 2, Max = 4</b> to allow teams of 2 to 4.</li>
            <li>Students registering will be asked to provide a team name matching their teammates entry.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/registrants', 'who registered', 'participants', 'registrations list', 'view registrants'],
      a: (
        <>
          <p className="mb-1 font-medium">Viewing registrations</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/organizer/events" className="text-gold underline">My Events</Link>.</li>
            <li>Click the verify-payments icon on a paid event to see pending payment submissions.</li>
            <li>Each entry shows the student name, reg. no., team, and transaction reference.</li>
            <li>Click <b>Verify and Confirm</b> to confirm payment or <b>Reject</b> to cancel their registration.</li>
          </ol>
        </>
      ),
    },
    {
      keys: ['/edit-event', 'edit event', 'delete event', 'update event', 'change event', 'remove event'],
      a: (
        <>
          <p className="mb-1 font-medium">Editing or deleting an event</p>
          <ul className="list-disc ml-4 space-y-1">
            <li>Only <b>Pending</b> events can be deleted (before Admin approval).</li>
            <li>Go to <Link to="/organizer/events" className="text-gold underline">My Events</Link>, find the event, and click <b>Delete</b>.</li>
            <li>Approved events cannot be deleted directly — contact Admin.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/clash-venue', 'venue clash', 'clash error', 'venue conflict', 'booked', 'time slot taken'],
      a: (
        <>
          <p className="mb-1 font-medium">Venue clash error</p>
          <p className="mt-1">This means another event is already booked at the same venue during the same time slot.</p>
          <p className="mt-1">To resolve:</p>
          <ol className="list-decimal ml-4 space-y-1 mt-1">
            <li>Pick a <b>different venue</b> from the dropdown, or</li>
            <li>Change the <b>start / end time</b> so it does not overlap.</li>
          </ol>
        </>
      ),
    },
  ],

  /* ── ADMIN ── */
  admin: [
    {
      keys: ['/approve', 'approve event', 'how to approve', 'approving'],
      a: (
        <>
          <p className="mb-1 font-medium">Approving an event</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/admin/pending" className="text-gold underline">Pending Events</Link> in the sidebar.</li>
            <li>Review the event — title, organizer, venue, description, dates.</li>
            <li>Click <b>Approve</b> to make it live. Students can now see and register for it.</li>
          </ol>
          <p className="mt-2 text-white/60 text-xs">Your name and timestamp are recorded when you approve.</p>
        </>
      ),
    },
    {
      keys: ['/reject', 'reject event', 'how to reject', 'rejecting', 'decline event'],
      a: (
        <>
          <p className="mb-1 font-medium">Rejecting an event</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/admin/pending" className="text-gold underline">Pending Events</Link>.</li>
            <li>Find the event that violates policy or needs revision.</li>
            <li>Click <b>Reject</b> — the event status is set to <i>Rejected</i>.</li>
            <li>The organizer can see this on their My Events page and resubmit with corrections.</li>
          </ol>
        </>
      ),
    },
    {
      keys: ['/add-venue', 'add venue', 'create venue', 'new venue', 'register venue'],
      a: (
        <>
          <p className="mb-1 font-medium">Adding a new venue</p>
          <ol className="list-decimal ml-4 space-y-1">
            <li>Go to <Link to="/admin/venues" className="text-gold underline">Manage Venues</Link>.</li>
            <li>Click <b>Add Venue</b>.</li>
            <li>Fill in: <b>Venue Name</b>, <b>Building</b>, <b>Floor</b>, <b>Room No.</b>, <b>Type</b> (Auditorium / Lab / Classroom / Ground / Online), and <b>Capacity</b>.</li>
            <li>Submit — the venue is immediately available for organizers to select.</li>
          </ol>
        </>
      ),
    },
    {
      keys: ['/all-events', 'all events', 'view all events', 'events list', 'manage events'],
      a: (
        <>
          <p className="mb-1 font-medium">Viewing all events</p>
          <p>Go to <Link to="/admin/events" className="text-gold underline">All Events</Link> to see every event across the platform — including Pending, Approved, and Rejected ones.</p>
          <ul className="list-disc ml-4 space-y-1 mt-1">
            <li>Use the <b>search bar</b> to filter by title or organizer.</li>
            <li>Each row shows status, category, venue, date, and organizer.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/all-regs', 'all registrations', 'view registrations', 'registrations list', 'who registered'],
      a: (
        <>
          <p className="mb-1 font-medium">Viewing all registrations</p>
          <p>Go to <Link to="/admin/registrations" className="text-gold underline">Registrations</Link> to see every registration across all events:</p>
          <ul className="list-disc ml-4 space-y-1 mt-1">
            <li>Student name and reg. no.</li>
            <li>Event title and team name</li>
            <li>Registration status (Registered / Pending / Cancelled)</li>
            <li>Payment transaction reference</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/roles', 'roles', 'user roles', 'how roles work', 'student vs organizer', 'who can do what'],
      a: (
        <>
          <p className="mb-1 font-medium">User roles on Evenzo</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><b>Student (SRM)</b> — can browse and register for events, join teams, download certificates.</li>
            <li><b>Student (Other college)</b> — same as SRM student but without reg. no.</li>
            <li><b>Organizer / Faculty</b> — can create and manage events; requires the organizer passcode to sign up.</li>
            <li><b>Admin</b> — approves/rejects events, manages venues, views all data. Admin accounts are not self-registered.</li>
          </ul>
        </>
      ),
    },
    {
      keys: ['/clash-policy', 'clash policy', 'time clash', 'venue clash', 'overlap policy', 'conflict rule'],
      a: (
        <>
          <p className="mb-1 font-medium">Clash detection policy</p>
          <ul className="list-disc ml-4 space-y-1">
            <li><b>Venue clash</b> — two events cannot book the same venue in an overlapping time window. Checked when an organizer submits a new event.</li>
            <li><b>Student time-clash</b> — a student cannot register for two events whose times overlap. Checked at registration time.</li>
            <li>Both checks use the rule: clash if <code>A.start &lt; B.end AND A.end &gt; B.start</code>.</li>
          </ul>
        </>
      ),
    },
  ],
}

/* ── Generic fallbacks (any role) ───────────────────────────── */
const GENERIC = [
  {
    keys: ['hi', 'hello', 'hey', 'yo', 'sup'],
    a: "Hi, I'm Evie. Ask me anything or tap a command below to get started.",
  },
  {
    keys: ['help', 'what can you do', 'commands', '?'],
    a: 'Tap any chip below for step-by-step guidance, or type a keyword like "register", "payment", "venue", "approval", "cancel".',
  },
  {
    keys: ['logout', 'sign out', 'log out'],
    a: 'Use the Logout button at the bottom of the sidebar.',
  },
  {
    keys: ['password', 'forgot password', 'reset password'],
    a: "Password reset is not self-service yet — contact your admin.",
  },
  {
    keys: ['profile', 'my profile'],
    a: <><Link to="/profile" className="text-gold underline">My Profile</Link> lets you view and update your account details.</>,
  },
  {
    keys: ['dashboard', 'home'],
    a: 'Your dashboard shows upcoming events, registrations count, and recent activity at a glance.',
  },
  {
    keys: ['thanks', 'thank you', 'ty', 'awesome', 'great'],
    a: 'Happy to help.',
  },
  {
    keys: ['evie', 'who are you', 'what are you'],
    a: "I'm Evie, the Evenzo assistant. I can guide you step-by-step through everything on the platform.",
  },
]

/* ── Intent matching ────────────────────────────────────────── */
function findAnswer(text, role) {
  const q = text.trim().toLowerCase()
  if (!q) return null
  const pool = [...(KB[role] || []), ...GENERIC]
  for (const item of pool) {
    if (item.keys.some(k => k.startsWith('/') && k.toLowerCase() === q)) return item.a
  }
  for (const item of pool) {
    if (item.keys.some(k => !k.startsWith('/') && q.includes(k.toLowerCase()))) return item.a
  }
  return null
}

/* ── Component ──────────────────────────────────────────────── */
export default function EvenzoAssistant() {
  const user = useAuthStore((s) => s.user)
  const role = roleKey(user?.role)
  const { pathname } = useLocation()

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [messages, setMessages] = useState(() => ([
    {
      from: 'bot',
      text: `Hi ${firstName}, I'm Evie. Tap a command below or ask me anything about Evenzo.`,
    },
  ]))
  const endRef  = useRef(null)
  const commands = useMemo(() => COMMANDS[role] || [], [role])

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  function send(raw) {
    const text = (raw ?? input).trim()
    if (!text) return
    const answer = findAnswer(text, role)
    setMessages(m => [
      ...m,
      { from: 'user', text },
      {
        from: 'bot',
        text: answer || (
          <>
            I don't have a specific answer for that. Try tapping a command below, or rephrase using words like{' '}
            {role === 'student'   && <><b>"register"</b>, <b>"payment"</b>, <b>"cancel"</b>, or <b>"team"</b>.</>}
            {role === 'organizer' && <><b>"create"</b>, <b>"venue"</b>, <b>"fees"</b>, or <b>"approval"</b>.</>}
            {role === 'admin'     && <><b>"approve"</b>, <b>"venue"</b>, <b>"registrations"</b>, or <b>"roles"</b>.</>}
          </>
        ),
      },
    ])
    setInput('')
  }

  if (!user) return null
  if (pathname === '/' || pathname === '/login' || pathname === '/register') return null

  return (
    <>
      {/* Launcher button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Evie assistant"
          className="fixed bottom-5 right-5 z-40 rounded-full bg-gold text-bg shadow-lg hover:shadow-gold/30 transition-all px-4 py-3 flex items-center gap-2 font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-bg animate-pulse" />
          Evie · Help
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[370px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-2rem)]
                        bg-surface border border-[rgba(200,169,110,0.25)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(200,169,110,0.18)] bg-surface2/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-sm">E</div>
              <div className="leading-tight">
                <p className="text-white text-sm font-medium">Evie</p>
                <p className="text-muted text-[11px]">{ROLE_LABEL[role]} guide</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-white text-xl leading-none px-1">x</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] text-sm px-3 py-2.5 rounded-xl leading-relaxed
                  ${m.from === 'user'
                    ? 'bg-gold text-bg rounded-br-sm'
                    : 'bg-surface2 text-white/90 border border-[rgba(255,255,255,0.06)] rounded-bl-sm'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Command chips */}
          <div className="px-3 py-2 border-t border-[rgba(200,169,110,0.12)] flex flex-wrap gap-1.5 bg-bg/40">
            {commands.map(c => (
              <button
                key={c.cmd}
                onClick={() => send(c.cmd)}
                className="text-[11px] text-gold border border-[rgba(200,169,110,0.25)] rounded-full px-2.5 py-1 hover:bg-gold/10 transition-colors whitespace-nowrap"
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); send() }}
            className="flex items-center gap-2 px-3 py-2 border-t border-[rgba(200,169,110,0.18)] bg-surface"
          >
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-surface2 text-white text-sm rounded-lg px-3 py-2 outline-none border border-transparent focus:border-gold/40"
            />
            <button
              type="submit"
              className="bg-gold text-bg text-sm font-medium rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
