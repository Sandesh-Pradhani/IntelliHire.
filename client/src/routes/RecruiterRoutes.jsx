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
import Interviews from '../pages/Interviews'
import Portfolio from '../pages/Portfolio'
import Settings from '../pages/Settings'
import Search from '../pages/Search'
import Notifications from '../pages/Notifications'
import RecruiterNotes from '../pages/RecruiterNotes'
import Analytics from '../pages/Analytics'
import AdminPanel from '../pages/AdminPanel'

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
        <Route path="/interviews" element={<Interviews />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/search" element={<Search />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/recruiter-notes" element={<RecruiterNotes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Route>
    </Routes>
  )
}

export default RecruiterRoutes
