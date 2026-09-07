import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/stores/auth'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
