import { Routes, Route } from 'react-router-dom'
import RecruiterLayout from '../components/layouts/RecruiterLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import RecruiterDashboard from '../pages/RecruiterDashboard'
import Jobs from '../pages/Jobs'
import Rankings from '../pages/Rankings'
import Feedback from '../pages/Feedback'
import Applications from '../pages/Applications'
import Dashboard from '../pages/Dashboard'
import JobMatch from '../pages/JobMatch'

/**
 * RecruiterRoutes — All recruiter-protected routes.
 * Uses RecruiterLayout (navbar + collapsible sidebar).
 */
function RecruiterRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute requiredRole="recruiter">
            <RecruiterLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/jobs/create" element={<Jobs action="create" />} />
        <Route path="/jobs/manage" element={<Jobs action="manage" />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/job-match" element={<JobMatch />} />
        <Route path="/applications" element={<Applications />} />
      </Route>
    </Routes>
  )
}

export default RecruiterRoutes