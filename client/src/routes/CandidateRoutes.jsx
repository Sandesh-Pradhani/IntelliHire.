import { Navigate, Route } from 'react-router-dom'
import ROUTES from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute'
import CandidateLayout from '../components/layouts/CandidateLayout'
import CandidateApplications from '../pages/CandidateApplications'
import CandidateDashboard from '../pages/CandidateDashboard'
import CareerInsights from '../pages/CareerInsights'
import CandidateJobMatch from '../pages/CandidateJobMatch'
import Jobs from '../pages/Jobs'
import Portfolio from '../pages/Portfolio'
import ResumeUpload from '../pages/ResumeUpload'
import Settings from '../pages/Settings'
import Notifications from '../pages/Notifications'
import Analytics from '../pages/CandidateAnalytics'

function CandidateRoutes() {
  return (
    <Route
      element={(
        <ProtectedRoute requiredRole="candidate">
          <CandidateLayout />
        </ProtectedRoute>
      )}
    >
      <Route path={ROUTES.CANDIDATE.DASHBOARD} element={<CandidateDashboard />} />
      <Route path={ROUTES.CANDIDATE.JOBS} element={<Jobs action="browse" />} />
      <Route path={ROUTES.CANDIDATE.APPLICATIONS} element={<CandidateApplications />} />
      <Route path={ROUTES.CANDIDATE.RESUME_ANALYSIS} element={<ResumeUpload />} />
      <Route path={ROUTES.CANDIDATE.JOB_MATCH} element={<CandidateJobMatch />} />
      <Route path={ROUTES.CANDIDATE.CAREER_INSIGHTS} element={<CareerInsights />} />
      <Route path={ROUTES.CANDIDATE.PROFILE} element={<Navigate to={ROUTES.CANDIDATE.PORTFOLIO} replace />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO} element={<Portfolio role="candidate" section="overview" />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO_RESUME} element={<Portfolio role="candidate" section="resume" />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO_ACADEMIC} element={<Portfolio role="candidate" section="academic" />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO_PROJECTS} element={<Portfolio role="candidate" section="projects" />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO_CERTIFICATES} element={<Portfolio role="candidate" section="certificates" />} />
      <Route path={ROUTES.CANDIDATE.PORTFOLIO_CODING_PROFILES} element={<Portfolio role="candidate" section="codingProfiles" />} />
      <Route path={ROUTES.CANDIDATE.SETTINGS} element={<Settings role="candidate" />} />
      <Route path={ROUTES.CANDIDATE.NOTIFICATIONS} element={<Notifications />} />
      <Route path={ROUTES.CANDIDATE.ANALYTICS} element={<Analytics />} />
    </Route>
  )
}

export default CandidateRoutes
