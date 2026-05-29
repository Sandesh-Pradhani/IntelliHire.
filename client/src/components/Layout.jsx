import { Link } from 'react-router-dom'

function Layout({ children }) {

    return (

        <div className="flex min-h-screen bg-slate-100">

            {/* SIDEBAR */}

            <div className="w-72 bg-slate-900 text-white p-8">

                <h1 className="text-3xl font-bold text-blue-400">

                    IntelliHire
                </h1>

                <div className="mt-10 space-y-4">

                    <Link
                        to="/dashboard"
                        className="block hover:text-blue-400"
                    >
                        Dashboard
                    </Link>

                    <Link
                        to="/resume-history"
                        className="block hover:text-blue-400"
                    >
                        Resume History
                    </Link>

                    <Link
                        to="/jobs"
                        className="block hover:text-blue-400"
                    >
                        Jobs
                    </Link>

                    <Link
                        to="/rankings"
                        className="block hover:text-blue-400"
                    >
                        Candidate Rankings
                    </Link>

                    <Link
                        to="/feedback"
                        className="block hover:text-blue-400"
                    >
                        Feedback
                    </Link>

                </div>

            </div>

            {/* MAIN CONTENT */}

            <div className="flex-1 p-10">

                {children}

            </div>

        </div>
    )
}

export default Layout