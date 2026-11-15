import { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthContext } from './context/authContext.js'
import ROUTES, { getDashboardRoute } from './constants/routes'
import NotFound from './pages/NotFound'
import AuthRoutes from './routes/AuthRoutes'
import CandidateRoutes from './routes/CandidateRoutes'
import RecruiterRoutes from './routes/RecruiterRoutes'

function App() {
  return (
    <Routes>
      {AuthRoutes()}
      {CandidateRoutes()}
      {RecruiterRoutes()}
      <Route path={ROUTES.ROOT} element={<RootRedirect />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function RootRedirect() {
  const { user, loading } = useContext(AuthContext)

  if (loading) {
    return null
  }

  if (user?.role) {
    return <Navigate to={getDashboardRoute(user.role)} replace />
  }

  return <Navigate to={ROUTES.LOGIN} replace />
}

export default App
