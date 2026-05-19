import { useState } from 'react'
import axios from 'axios'

import { useNavigate } from 'react-router-dom'

function Register() {

    const navigate = useNavigate()

    const [name, setName] = useState('')

    const [email, setEmail] = useState('')

    const [password, setPassword] = useState('')

    const handleRegister = async () => {

        try {

            await axios.post(

                'http://localhost:5000/api/auth/register',

                {
                    name,
                    email,
                    password
                }
            )

            navigate('/login')

        } catch (error) {

            console.log(error)
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

                    <input

                        type="text"

                        placeholder="Full Name"

                        onChange={(e) => setName(e.target.value)}

                        className="w-full border rounded-xl px-4 py-3"
                    />

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

                        onClick={handleRegister}

                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"

                    >
                        Register
                    </button>

                </div>

            </div>

        </div>
    )
}

export default Register