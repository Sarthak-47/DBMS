import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const DASH = {
  student:       '/dashboard',
  other_student: '/dashboard',
  organizer:     '/organizer/dashboard',
  faculty:       '/organizer/dashboard',
  admin:         '/admin/dashboard',
}

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={DASH[user.role] || '/login'} replace />
  }

  return children
}
