import { useState } from 'react'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { User, Briefcase, Sparkles } from 'lucide-react'

function Register() {
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('candidate')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async () => {
        setLoading(true)
        setError('')
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/auth/register`,
                { name, email, password, role }
            )
            navigate('/login')
        } catch (error) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                        <Sparkles className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 bg-clip-text text-transparent">
                        IntelliHire <span className="text-blue-600">AI</span>
                    </span>
                </div>
                <h1 className="text-4xl font-bold text-slate-800">Create Account</h1>
                <p className="text-slate-500 mt-2">Join IntelliHire AI Platform</p>

                <div className="mt-8 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    {/* ROLE SELECTOR */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('candidate')}
                                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
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
                                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
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
                        onClick={handleRegister}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                            loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
                        <Link to="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Register