import { useContext } from 'react'

import { AuthContext } from '../context/AuthContext'

function Dashboard() {

    const { user } = useContext(AuthContext)

    return (

        <div className="min-h-screen bg-slate-50 p-10">

            <h1 className="text-5xl font-bold text-slate-800">

                Welcome, {user?.name}
            </h1>

            <p className="mt-3 text-slate-500 text-lg">

                AI Recruitment Dashboard
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-10">

                <div className="bg-white p-8 rounded-3xl shadow-lg">

                    <h2 className="text-4xl font-bold text-blue-600">

                        12
                    </h2>

                    <p className="mt-2 text-slate-500">

                        Resumes Analyzed
                    </p>

                </div>

                <div className="bg-white p-8 rounded-3xl shadow-lg">

                    <h2 className="text-4xl font-bold text-indigo-600">

                        86%
                    </h2>

                    <p className="mt-2 text-slate-500">

                        Avg ATS Score
                    </p>

                </div>

                <div className="bg-white p-8 rounded-3xl shadow-lg">

                    <h2 className="text-4xl font-bold text-green-600">

                        AI
                    </h2>

                    <p className="mt-2 text-slate-500">

                        Recruitment Active
                    </p>

                </div>

            </div>

        </div>
    )
}

export default Dashboard