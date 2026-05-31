import { useEffect, useState } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import Skeleton from '../components/ui/Skeleton'

import { FileText, History } from 'lucide-react'

function ResumeHistory() {

    const [resumes, setResumes] = useState([])

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')

    const fetchHistory = async () => {

        try {

            const token = localStorage.getItem('token')

            const response = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/ai/history`,

                {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setResumes(response.data)

        } catch (error) {

            console.log(error)
            setError('Failed to load resume history.')

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        fetchHistory()

    }, [])

    return (

        <Layout>

            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                <History className="h-8 w-8 text-blue-600" />
                Resume History
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
                                <div className="space-y-3 flex-1">
                                    <Skeleton width="50%" height="24px" />
                                    <Skeleton width="30%" height="14px" />
                                </div>
                                <div className="text-right space-y-2">
                                    <Skeleton width="60px" height="32px" />
                                    <Skeleton width="70px" height="12px" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} width="80px" height="28px" />
                                ))}
                            </div>
                        </div>
                    ))
                ) : resumes.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-600">No resumes uploaded</h3>
                        <p className="text-sm text-slate-400 mt-1">Upload a resume to see history here.</p>
                    </div>
                ) : (
                    resumes.map((resume) => (

                        <div

                            key={resume._id}

                            className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100 hover:shadow-md transition-shadow duration-300"

                        >

                            <div className="flex justify-between items-center">

                                <div>

                                    <h2 className="text-2xl font-bold text-slate-800">

                                        {resume.filename}
                                    </h2>

                                    <p className="text-slate-500 mt-2">

                                        Uploaded Resume Analysis
                                    </p>

                                </div>

                                <div className="text-right">

                                    <h2 className="text-4xl font-bold text-blue-600">

                                        {resume.atsScore}
                                    </h2>

                                    <p className="text-slate-500">

                                        ATS Score
                                    </p>

                                </div>

                            </div>

                            <div className="flex flex-wrap gap-3 mt-6">

                                {
                                    resume.extractedSkills?.map((skill, index) => (

                                        <span

                                            key={index}

                                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                }

                            </div>

                        </div>
                    ))
                )}

            </div>

        </Layout>
    )
}

export default ResumeHistory