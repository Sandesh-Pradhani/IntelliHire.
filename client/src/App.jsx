import { Routes, Route, Navigate } from 'react-router-dom'

import AuthLayout from './components/layouts/AuthLayout'
import CandidateLayout from './components/layouts/CandidateLayout'
import RecruiterLayout from './components/layouts/RecruiterLayout'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Forbidden from './pages/Forbidden'
import ServerError from './pages/ServerError'

import CandidateDashboard from './pages/CandidateDashboard'
import CandidateApplications from './pages/CandidateApplications'
import ResumeUpload from './pages/ResumeUpload'
import ResumeHistory from './pages/ResumeHistory'
import Jobs from './pages/Jobs'
import AcademicProfile from './pages/AcademicProfile'
import Dashboard from './pages/Dashboard'
import JobMatch from './pages/JobMatch'
import CareerInsights from './pages/CareerInsights'
import Interviews from './pages/Interviews'
import Portfolio from './pages/Portfolio'
import Settings from './pages/Settings'
import Search from './pages/Search'
import Notifications from './pages/Notifications'
import Analytics from './pages/Analytics'

import RecruiterDashboard from './pages/RecruiterDashboard'
import Rankings from './pages/Rankings'
import Feedback from './pages/Feedback'
import Applications from './pages/Applications'
import RecruiterNotes from './pages/RecruiterNotes'
import AdminPanel from './pages/AdminPanel'

function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

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

      <Route path="/404" element={<NotFound />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App