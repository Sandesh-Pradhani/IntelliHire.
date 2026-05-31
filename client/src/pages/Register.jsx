import { useState } from 'react'
import axios from 'axios'

import { useNavigate } from 'react-router-dom'

function Register() {

    const navigate = useNavigate()

    const [name, setName] = useState('')

    const [email, setEmail] = useState('')

    const [password, setPassword] = useState('')

    const [error, setError] = useState('')

    const [loading, setLoading] = useState(false)

    const handleRegister = async () => {

        setLoading(true)
        setError('')

        try {

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/auth/register`,

                {
                    name,
                    email,
                    password
                }
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

                <h1 className="text-4xl font-bold text-slate-800">

                    Create Account

                </h1>

                <p className="text-slate-500 mt-2">

                    Join IntelliHire AI
                </p>

                <div className="mt-8 space-y-5">

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <input

                        type="text"

                        placeholder="Full Name"

                        onChange={(e) => setName(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <input

                        type="email"

                        placeholder="Email"

                        onChange={(e) => setEmail(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

                    <input

                        type="password"

                        placeholder="Password"

                        onChange={(e) => setPassword(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />

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

                </div>

            </div>

        </div>
    )
}

export default Register