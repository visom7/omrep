import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Redirects unauthenticated users to /login.
 * §3.3: Only authenticated routes can access user data.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
