import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import EventCard from '../components/EventCard'
import client from '../api/client'

const FEATURES = [
  { title: 'Smart Registration',   desc: 'One-click registration with automatic team formation and waitlist management.' },
  { title: 'Payment Verification', desc: 'UPI-based payment flow with transaction reference validation.' },
  { title: 'Role-based Access',    desc: 'Tailored dashboards for students, organizers, faculty, and admins.' },
  { title: 'Event Approval',       desc: 'Structured approval workflow keeps event quality consistent.' },
  { title: 'PDF Certificates',     desc: 'Auto-generate gold-framed participation certificates with one click.' },
  { title: 'Live Notifications',   desc: 'Real-time alerts for registration updates and event changes.' },
]

const TESTIMONIALS = [
  { name: 'Arjun Sharma',  role: 'CSE · 3rd Year',  text: 'Registering for HackSRM was seamless. Love the team management feature.' },
  { name: 'Priya Menon',   role: 'ECE · 2nd Year',  text: 'The notification system kept me updated without any hassle.' },
  { name: 'Rahul Verma',   role: 'MECH · 4th Year', text: 'Got my certificate instantly after the workshop. Super convenient.' },
]

export default function Landing() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    // Public endpoint — no auth needed; client handles missing token gracefully
    client.get('/events', { params: { limit: 3 } })
      .then(r => setEvents(r.data))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-bg min-h-screen font-body">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block bg-gold/10 border border-gold/20 text-gold text-xs px-4 py-1.5 rounded-full mb-6 font-medium tracking-widest uppercase">
            SRM Institute · Campus Events
          </span>

          <h1 className="font-display text-5xl md:text-7xl text-white leading-tight mb-6">
            Where Campus Life<br />
            <span className="text-gold">Comes Alive.</span>
          </h1>

          <p className="text-muted text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Discover, register, and manage events across clubs and departments — all in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link to="/register" className="btn-gold text-base px-8 py-3">Get Started</Link>
            <Link to="/login"    className="btn-outline text-base px-8 py-3">Sign In</Link>
          </div>

          <div className="flex flex-wrap justify-center gap-10 text-center">
            {[['124+', 'Events'], ['38', 'Clubs'], ['4,200', 'Students']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="font-display text-2xl text-gold">{val}</p>
                <p className="text-muted text-sm">{lbl}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Events Preview ── */}
      <section className="bg-surface border-y border-[rgba(200,169,110,0.12)] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-2 font-medium">Happening Now</p>
          <h2 className="font-display text-4xl text-white mb-10">Featured Events</h2>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map(ev => <EventCard key={ev.event_id} event={ev} />)}
            </div>
          ) : (
            <p className="text-muted text-center py-12">Start the server and seed the database to see live events here.</p>
          )}

          <div className="text-center mt-10">
            <Link to="/register" className="btn-outline px-8">See All Events</Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6">
        <p className="text-gold text-xs uppercase tracking-widest mb-2 font-medium">Why Evenzo</p>
        <h2 className="font-display text-4xl text-white mb-10">Everything You Need</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ title, desc }) => (
            <div key={title} className="card p-6 hover:border-gold/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 mb-4" />
              <h3 className="font-display text-lg text-white mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-surface border-y border-[rgba(200,169,110,0.12)] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-2 font-medium text-center">Students Love It</p>
          <h2 className="font-display text-4xl text-white mb-10 text-center">What They Say</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <div key={name} className="card p-6">
                <p className="text-muted text-sm leading-relaxed mb-5 italic">"{text}"</p>
                <div>
                  <p className="text-white font-medium text-sm">{name}</p>
                  <p className="text-muted text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 max-w-3xl mx-auto px-6 text-center">
        <h2 className="font-display text-5xl text-white mb-5">Ready to explore?</h2>
        <p className="text-muted text-lg mb-8">Join thousands of students already on the platform.</p>
        <Link to="/register" className="btn-gold text-base px-10 py-3.5">Create Your Account</Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(200,169,110,0.12)] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-gold">Evenzo</p>
          <p className="text-muted text-sm">SRM Institute of Science and Technology · 21CSC205P</p>
          <p className="text-muted text-xs">&copy; 2026 Evenzo</p>
        </div>
      </footer>
    </div>
  )
}
