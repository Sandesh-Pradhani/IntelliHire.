import { Navigate } from 'react-router-dom'
import AuthRoutes from './routes/AuthRoutes'
import CandidateRoutes from './routes/CandidateRoutes'
import RecruiterRoutes from './routes/RecruiterRoutes'

/**
 * App — Routes are organized by role:
 * - AuthRoutes   → /login, /register (AuthLayout, no sidebar)
 * - CandidateRoutes → /candidate/*, /resume-*, /jobs, /academic-profile (CandidateLayout)
 * - RecruiterRoutes → /recruiter/*, /jobs/create|manage, /rankings, /applications (RecruiterLayout)
 *
 * Everything not matched redirects to /login.
 */
function App() {
  return (
    <>
      <AuthRoutes />
      <CandidateRoutes />
      <RecruiterRoutes />
    </>
  )
}

export default App