import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, type Role } from '../../context/AuthContext'

interface ProtectedRouteProps {
  allowedRoles: Role[]
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
