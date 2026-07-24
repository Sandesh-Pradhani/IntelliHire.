import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ROUTES, { getDashboardRoute } from '../constants/routes'
import { AuthContext } from '../context/authContext'
import authService from '../services/auth.service'

function Login() {
  const navigate = useNavigate()
  const { login } = useContext(AuthContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await authService.login({ email, password })
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

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

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
        </div>
      </div>
    </div>
  )
}

export default Login