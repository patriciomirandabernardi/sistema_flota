import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate replace to="/login" />
  }

  return <Outlet />
}

export default ProtectedRoute
