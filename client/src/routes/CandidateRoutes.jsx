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
import Interviews from '../pages/Interviews'
import Portfolio from '../pages/Portfolio'
import Settings from '../pages/Settings'
import Search from '../pages/Search'
import Notifications from '../pages/Notifications'
import Analytics from '../pages/Analytics'

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
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/search" element={<Search />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}

export default CandidateRoutes
