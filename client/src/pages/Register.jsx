import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Sparkles, User } from 'lucide-react'
import ROUTES from '../constants/routes'
import authService from '../services/auth.service'

function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!role) {
      setError('Please select a role (Candidate or Recruiter).')
      return
    }

    setLoading(true)
    setError('')

    try {
      await authService.register({ name, email, password, role })
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <div className="mb-2 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-xl font-bold text-transparent">
            IntelliHire <span className="text-blue-600">AI</span>
          </span>
        </div>

        <h1 className="text-4xl font-bold text-slate-800">Create Account</h1>
        <p className="mt-2 text-slate-500">Join IntelliHire AI Platform</p>

        <div className="mt-8 space-y-5">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border px-4 py-3 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />

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

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">I am a...</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  role === 'candidate'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <User className={`h-4 w-4 ${role === 'candidate' ? 'text-blue-600' : 'text-slate-400'}`} />
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${
                  role === 'recruiter'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <Briefcase className={`h-4 w-4 ${role === 'recruiter' ? 'text-blue-600' : 'text-slate-400'}`} />
                Recruiter
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegister}
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
                Creating Account...
              </span>
            ) : (
              'Register'
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
