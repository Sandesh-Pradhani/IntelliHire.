import { Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from '../components/layouts/AuthLayout'
import Login from '../pages/Login'
import Register from '../pages/Register'

/**
 * AuthRoutes — Public authentication routes.
 * Uses AuthLayout (navbar only, no sidebar).
 */
function AuthRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>
    </Routes>
  )
}

export default AuthRoutes