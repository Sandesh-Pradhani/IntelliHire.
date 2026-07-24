import { Route } from 'react-router-dom'
import ROUTES from '../constants/routes'
import ProtectedRoute from '../components/ProtectedRoute'
import RecruiterLayout from '../components/layouts/RecruiterLayout'
import Applications from '../pages/Applications'
import Feedback from '../pages/Feedback'
import RecruiterJobMatch from '../pages/RecruiterJobMatch'
import Jobs from '../pages/Jobs'
import Portfolio from '../pages/Portfolio'
import Rankings from '../pages/Rankings'
import RecruiterDashboard from '../pages/RecruiterDashboard'
import Settings from '../pages/Settings'
import Notifications from '../pages/Notifications'
import Analytics from '../pages/RecruiterAnalytics'

function RecruiterRoutes() {
  return (
    <Route
      element={(
        <ProtectedRoute requiredRole="recruiter">
          <RecruiterLayout />
        </ProtectedRoute>
      )}
    >
      <Route path={ROUTES.RECRUITER.DASHBOARD} element={<RecruiterDashboard />} />
      <Route path={ROUTES.RECRUITER.JOBS} element={<Jobs action="manage" />} />
      <Route path={ROUTES.RECRUITER.JOB_CREATE} element={<Jobs action="create" />} />
      <Route path={ROUTES.RECRUITER.JOB_MANAGE} element={<Jobs action="manage" />} />
      <Route path={ROUTES.RECRUITER.CANDIDATES} element={<Rankings view="candidates" />} />
      <Route path={ROUTES.RECRUITER.APPLICATIONS} element={<Applications />} />
      <Route path={ROUTES.RECRUITER.RANKINGS} element={<Rankings view="rankings" />} />
      <Route path={ROUTES.RECRUITER.JOB_MATCH} element={<RecruiterJobMatch />} />
      <Route path={ROUTES.RECRUITER.PORTFOLIO} element={<Portfolio role="recruiter" section="overview" />} />
      <Route path={ROUTES.RECRUITER.SETTINGS} element={<Settings role="recruiter" />} />
      <Route path={ROUTES.RECRUITER.FEEDBACK} element={<Feedback />} />
      <Route path={ROUTES.RECRUITER.NOTIFICATIONS} element={<Notifications />} />
      <Route path={ROUTES.RECRUITER.ANALYTICS} element={<Analytics />} />
    </Route>
  )
}

export default RecruiterRoutes
