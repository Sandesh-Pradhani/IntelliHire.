import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CandidateDashboard from './pages/CandidateDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateApplications from './pages/CandidateApplications'
import ResumeUpload from './pages/ResumeUpload'
import ResumeHistory from './pages/ResumeHistory'
import Jobs from './pages/Jobs'
import Rankings from './pages/Rankings'
import Feedback from './pages/Feedback'
import JobMatch from './pages/JobMatch'
import Applications from './pages/Applications'
import AcademicProfile from './pages/AcademicProfile'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* PUBLIC */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* LEGACY DASHBOARD (redirects based on role) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* CANDIDATE ROUTES */}
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute requiredRole="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <ProtectedRoute requiredRole="candidate">
              <CandidateApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-upload"
          element={
            <ProtectedRoute requiredRole="candidate">
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-history"
          element={
            <ProtectedRoute requiredRole="candidate">
              <ResumeHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/academic-profile"
          element={
            <ProtectedRoute requiredRole="candidate">
              <AcademicProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute requiredRole="candidate">
              <Jobs action="browse" />
            </ProtectedRoute>
          }
        />

        {/* RECRUITER ROUTES */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Jobs action="create" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/manage"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Jobs action="manage" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rankings"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Rankings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/job-match"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <JobMatch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute requiredRole="recruiter">
              <Applications />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App