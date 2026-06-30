import { Routes, Route } from 'react-router-dom'
import CandidateLayout from '../components/layouts/CandidateLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import CandidateDashboard from '../pages/CandidateDashboard'
import CandidateApplications from '../pages/CandidateApplications'
import ResumeUpload from '../pages/ResumeUpload'
import ResumeHistory from '../pages/ResumeHistory'
import Jobs from '../pages/Jobs'
import AcademicProfile from '../pages/AcademicProfile'
import Dashboard from '../pages/Dashboard'
import JobMatch from '../pages/JobMatch'
import CareerInsights from '../pages/CareerInsights'

/**
 * CandidateRoutes — All candidate-protected routes.
 * Uses CandidateLayout (navbar + collapsible sidebar).
 */
function CandidateRoutes() {
  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute requiredRole="candidate">
            <CandidateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/applications" element={<CandidateApplications />} />
        <Route path="/resume-upload" element={<ResumeUpload />} />
        <Route path="/resume-history" element={<ResumeHistory />} />
        <Route path="/academic-profile" element={<AcademicProfile />} />
        <Route path="/jobs" element={<Jobs action="browse" />} />
        <Route path="/job-match" element={<JobMatch />} />
        <Route path="/career-insights" element={<CareerInsights />} />
      </Route>
    </Routes>
  )
}

export default CandidateRoutes