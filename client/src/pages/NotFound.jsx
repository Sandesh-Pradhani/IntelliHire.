import { Link, useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

/**
 * NotFound — Professional 404 page.
 * Shown when no route matches.
 * Returns user to their dashboard or login.
 */
function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full text-center">
        {/* Large 404 */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 mb-6">
            <span className="text-5xl font-black text-blue-600">404</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Page Not Found
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Please check the URL or return to your dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/10 transition-all duration-200"
          >
            <Home className="h-4 w-4" />
            Return Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound