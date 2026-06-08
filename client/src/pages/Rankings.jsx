import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import Skeleton from '../components/ui/Skeleton'

import { Award, Users } from 'lucide-react'

function Rankings() {

    const [candidates, setCandidates] = useState([])

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')

    const fetchRankings = async () => {

        try {

            const token = localStorage.getItem('token')

            const response = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/ai/rankings`,

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setCandidates(response.data || [])

        } catch (err) {

            console.log('Rankings API error:', err)
            setCandidates([])

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        fetchRankings()

    }, [])

    const displayCandidates = candidates

    return (

        <Layout>

            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                <Award className="h-8 w-8 text-blue-600" />
                Candidate Rankings
            </h1>

            {error && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="mt-8 space-y-6">

                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                            <div className="flex justify-between items-center">
                                <div className="space-y-3">
                                    <Skeleton width="200px" height="24px" />
                                    <div className="flex gap-2">
                                        {[...Array(3)].map((_, j) => (
                                            <Skeleton key={j} width="80px" height="28px" />
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <Skeleton width="60px" height="40px" />
                                    <Skeleton width="80px" height="12px" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : displayCandidates.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-600">No candidates ranked yet</h3>
                        <p className="text-sm text-slate-400 mt-1">Upload and evaluate resumes to see rankings here.</p>
                    </div>
                ) : (
                    displayCandidates.map((candidate, index) => {
                        // Support both API response formats: AI Engine (candidateName/candidateId) and fallback (name/_id)
                        const name = candidate.candidateName || candidate.name || 'Unknown'
                        const cid = candidate.candidateId || candidate._id || index
                        const score = candidate.score || 0
                        const skills = candidate.matchedSkills || candidate.skills || []
                        return (

                        <div

                            key={index}

                            className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100 flex justify-between items-center hover:shadow-md transition-all duration-300"

                        >

                            <div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                                        #{index + 1}
                                    </span>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {name}
                                    </h2>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">

                                    {
                                        skills?.map((skill, idx) => (

                                            <span

                                                key={idx}

                                                className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))
                                    }

                                </div>

                            </div>

                            <div className="text-right">

                                <h2 className="text-5xl font-bold text-blue-600">

                                    {score}
                                </h2>

                                <p className="text-slate-500 text-sm mt-1">

                                    Match Score
                                </p>

                            </div>

                        </div>
                        )
                    })
                )}

            </div>

        </Layout>
    )
}

export default Rankings