import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { getDashboardRoute } from '../constants/routes'
import { AuthContext } from '../context/authContext'
import authService from '../services/auth.service'

function Login() {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [detectedRole, setDetectedRole] = useState(null)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await authService.login({ email, password })
      setDetectedRole(data.user?.role)
      login(data.user, data.token)
      navigate(getDashboardRoute(data.user?.role), { replace: true })
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <h1 className="text-4xl font-bold text-slate-800">Welcome Back</h1>
        <p className="mt-2 text-slate-500">Login to IntelliHire AI</p>

        <div className="mt-8 space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border px-4 py-3 pr-12 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className={`w-full rounded-xl py-3 font-semibold transition-all duration-200 ${
              loading
                ? 'cursor-not-allowed bg-blue-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing In...
              </span>
            ) : (
              'Login'
            )}
          </button>

          {detectedRole && (
            <div
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
                detectedRole === 'recruiter'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-blue-200 bg-blue-50 text-blue-700'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              Logging in as:{' '}
              <span className="capitalize">{detectedRole}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
