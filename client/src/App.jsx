import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ResumeUpload from './pages/ResumeUpload'
import ResumeHistory from './pages/ResumeHistory'
import Jobs from './pages/Jobs'
import Rankings from './pages/Rankings'
import Feedback from './pages/Feedback'

function App() {

  return (

    <BrowserRouter>

      <Navbar />

      <Routes>
        
        <Route
          path="/"
          element={<Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route

          path="/dashboard"

          element={

            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>
          }
        />

        <Route

          path="/resume-upload"

          element={

            <ProtectedRoute>

              <ResumeUpload />

            </ProtectedRoute>
          }
        />

      <Route

        path="/resume-history"

        element={

          <ProtectedRoute>

            <ResumeHistory />

          </ProtectedRoute>
        }
      />

      <Route

        path="/jobs"

        element={

          <ProtectedRoute>

            <Jobs />

          </ProtectedRoute>
        }
      />

      <Route

        path="/rankings"

        element={

          <ProtectedRoute>

            <Rankings />

          </ProtectedRoute>
        }
      />

      <Route

        path="/feedback"

        element={

          <ProtectedRoute>

            <Feedback />

          </ProtectedRoute>
        }
      />
      
      </Routes>

    </BrowserRouter>
  )
}

export default App