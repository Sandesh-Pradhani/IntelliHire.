import { useContext } from 'react'
import { Link } from 'react-router-dom'

import { AuthContext } from '../context/AuthContext'

function Navbar() {

    const { user, logout } = useContext(AuthContext)

    return (

        <nav className="bg-white shadow-md border-b">

            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

                <Link
                    to="/"
                    className="text-3xl font-bold text-blue-600"
                >
                    IntelliHire AI
                </Link>

                <div className="flex gap-6 items-center">

                    {
                        user ? (

                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-slate-700 font-medium"
                                >
                                    Dashboard
                                </Link>

                                <button

                                    onClick={logout}

                                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                                >
                                    Logout
                                </button>
                            </>

                        ) : (

                            <>
                                <Link
                                    to="/login"
                                    className="text-slate-700 font-medium"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                                >
                                    Register
                                </Link>
                            </>
                        )
                    }

                </div>

            </div>

        </nav>
    )
}

export default Navbar