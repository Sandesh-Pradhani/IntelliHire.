import { useState, useContext } from 'react'
import axios from 'axios'

import { useNavigate } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext'

function Login() {

    const navigate = useNavigate()

    const { login } = useContext(AuthContext)

    const [email, setEmail] = useState('')

    const [password, setPassword] = useState('')

    const handleLogin = async () => {

        try {

            const response = await axios.post(

                'http://localhost:5000/api/auth/login',

                {
                    email,
                    password
                }
            )

            login(

                response.data.user,

                response.data.token
            )

            navigate('/dashboard')

        } catch (error) {

            console.log(error.response.data)
        }
    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-50">

            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">

                <h1 className="text-4xl font-bold text-slate-800">

                    Welcome Back

                </h1>

                <p className="text-slate-500 mt-2">

                    Login to IntelliHire AI
                </p>

                <div className="mt-8 space-y-5">

                    <input

                        type="email"

                        placeholder="Email"

                        onChange={(e) => setEmail(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3"
                    />

                    <input

                        type="password"

                        placeholder="Password"

                        onChange={(e) => setPassword(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3"
                    />

                    <button

                        onClick={handleLogin}

                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"

                    >
                        Login
                    </button>

                </div>

            </div>

        </div>
    )
}

export default Login