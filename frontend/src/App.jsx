import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import EvenzoAssistant from './components/EvenzoAssistant'

import Landing           from './pages/Landing'
import Login             from './pages/Login'
import Register          from './pages/Register'

import StudentDashboard  from './pages/StudentDashboard'
import EventsBrowser     from './pages/EventsBrowser'
import EventDetail       from './pages/EventDetail'
import MyRegistrations   from './pages/MyRegistrations'
import Teams             from './pages/Teams'

import OrganizerDashboard from './pages/OrganizerDashboard'
import OrganizerEvents    from './pages/OrganizerEvents'
import CreateEvent        from './pages/CreateEvent'

import AdminDashboard     from './pages/AdminDashboard'
import AdminPending       from './pages/AdminPending'
import AdminEvents        from './pages/AdminEvents'
import AdminVenues        from './pages/AdminVenues'
import AdminRegistrations from './pages/AdminRegistrations'

import Profile            from './pages/Profile'

const S  = (c) => <ProtectedRoute roles={['student','other_student']}>{c}</ProtectedRoute>
const O  = (c) => <ProtectedRoute roles={['organizer','faculty']}>{c}</ProtectedRoute>
const A  = (c) => <ProtectedRoute roles={['admin']}>{c}</ProtectedRoute>
const AU = (c) => <ProtectedRoute>{c}</ProtectedRoute>

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Student */}
        <Route path="/dashboard"        element={S(<StudentDashboard />)} />
        <Route path="/events"           element={S(<EventsBrowser />)} />
        <Route path="/events/:id"       element={S(<EventDetail />)} />
        <Route path="/my-registrations" element={S(<MyRegistrations />)} />
        <Route path="/teams"            element={S(<Teams />)} />

        {/* Organizer */}
        <Route path="/organizer/dashboard" element={O(<OrganizerDashboard />)} />
        <Route path="/organizer/events"    element={O(<OrganizerEvents />)} />
        <Route path="/organizer/create"    element={O(<CreateEvent />)} />

        {/* Admin */}
        <Route path="/admin/dashboard"     element={A(<AdminDashboard />)} />
        <Route path="/admin/pending"       element={A(<AdminPending />)} />
        <Route path="/admin/events"        element={A(<AdminEvents />)} />
        <Route path="/admin/venues"        element={A(<AdminVenues />)} />
        <Route path="/admin/registrations" element={A(<AdminRegistrations />)} />

        {/* Shared auth */}
        <Route path="/profile" element={AU(<Profile />)} />

        {/* Legacy redirects */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />
        <Route path="*"     element={<Navigate to="/"     replace />} />
      </Routes>

      {/* Global floating AI assistant (self-hides if user is not logged in) */}
      <EvenzoAssistant />
    </BrowserRouter>
  )
}
