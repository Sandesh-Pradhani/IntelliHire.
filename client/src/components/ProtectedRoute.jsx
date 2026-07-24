import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import ROUTES, { getDashboardRoute } from '../constants/routes'
import { AuthContext } from '../context/authContext'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useContext(AuthContext)
  const token = localStorage.getItem('token')

  if (loading) {
    return null
  }

  if (!token || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  return children
}

export default ProtectedRoute
