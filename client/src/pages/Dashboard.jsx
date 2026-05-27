import { useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const STAT_CARDS = [
    { label: 'Resumes Analyzed', value: '12', color: 'text-blue-600' },
    { label: 'Avg ATS Score', value: '86%', color: 'text-indigo-600' },
    { label: 'Recruitment Active', value: 'AI', color: 'text-green-600' },
]

function Dashboard() {
    const { user } = useContext(AuthContext)

    const greeting = useMemo(() => {
        if (!user?.name) return 'Welcome'
        const hour = new Date().getHours()
        const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
        return `${prefix}, ${user.name}`
    }, [user?.name])

    return (
        <main className="min-h-screen bg-slate-50 p-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-5xl font-bold text-slate-800">
                        {greeting}
                    </h1>
                    <p className="mt-3 text-slate-500 text-lg">
                        AI Recruitment Dashboard
                    </p>
                </div>
                <Link
                    to="/resume-upload"
                    className="inline-block bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                    Upload Resume
                </Link>
            </header>

            <section
                className="grid md:grid-cols-3 gap-8 mt-10"
                aria-label="Recruitment statistics"
            >
                {STAT_CARDS.map(({ label, value, color }) => (
                    <article
                        key={label}
                        className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <h2 className={`text-4xl font-bold ${color}`}>
                            {value}
                        </h2>
                        <p className="mt-2 text-slate-500">
                            {label}
                        </p>
                    </article>
                ))}
            </section>
        </main>
    )
}

export default Dashboard