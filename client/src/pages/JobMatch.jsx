import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import SkillGapCard from '../components/SkillGapCard'

const API_URL = import.meta.env.VITE_API_URL

function JobMatch() {

    const [jobs, setJobs] = useState([])
    const [selectedJob, setSelectedJob] = useState('')

    const [jobText, setJobText] = useState('')
    const [resumeText, setResumeText] = useState('')

    const [result, setResult] = useState(null)

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState('')

    useEffect(() => {

        fetchJobs()

        fetchLatestResume()

    }, [])

    const fetchJobs = async () => {

        try {

            const response = await axios.get(

                `${API_URL}/api/jobs/all`
            )

            setJobs(response.data)

        } catch (error) {

            console.log(error)
        }
    }

    const fetchLatestResume = async () => {

        try {

            const token = localStorage.getItem('token')

            const response = await axios.get(

                `${API_URL}/api/resumes/latest`,

                {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                }
            )

            const skills =

                response.data.extractedSkills || []

            setResumeText(

                skills.join(', ')
            )

        } catch (error) {

            console.log(error)
        }
    }

    const handleJobChange = (e) => {

        const jobId = e.target.value

        setSelectedJob(jobId)

        const selected = jobs.find(

            (job) => job._id === jobId
        )

        if (selected) {

            setJobText(

                selected.description
            )
        }
    }

    const runMatching = async () => {

        try {

            const token = localStorage.getItem('token')

            setLoading(true)

            setError('')

            const response = await axios.post(

                `${API_URL}/api/recruiter/match`,

                {
                    job: jobText,
                    resume: resumeText
                },

                {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setResult(response.data)

        } catch (error) {

            console.log(error)

            setError(

                error?.response?.data?.message ||

                'Matching Failed'
            )

        } finally {

            setLoading(false)
        }
    }

    return (

        <Layout>

            <div>

                <h1 className="text-5xl font-bold text-slate-800">

                    AI Job Matching

                </h1>

                <p className="text-slate-500 mt-3">

                    Select a job and compare it against the latest uploaded resume.

                </p>

                <div className="mt-8">

                    <label className="font-semibold">

                        Select Job
                    </label>

                    <select

                        value={selectedJob}

                        onChange={handleJobChange}

                        className="w-full mt-3 border rounded-xl p-4"

                    >

                        <option value="">

                            Select Job
                        </option>

                        {

                            jobs.map((job) => (

                                <option

                                    key={job._id}

                                    value={job._id}

                                >

                                    {job.title}

                                </option>
                            ))
                        }

                    </select>

                </div>

                <div className="grid lg:grid-cols-2 gap-8 mt-10">

                    <div className="bg-white rounded-3xl shadow-lg p-8">

                        <h2 className="text-2xl font-semibold">

                            Job Description

                        </h2>

                        <textarea

                            rows="12"

                            value={jobText}

                            readOnly

                            className="w-full mt-5 border rounded-2xl p-4"

                        />

                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-8">

                        <h2 className="text-2xl font-semibold">

                            Candidate Skills

                        </h2>

                        <textarea

                            rows="12"

                            value={resumeText}

                            readOnly

                            className="w-full mt-5 border rounded-2xl p-4"

                        />

                    </div>

                </div>

                {

                    error && (

                        <div className="mt-6 text-red-600">

                            {error}

                        </div>
                    )
                }

                <button

                    onClick={runMatching}

                    disabled={loading}

                    className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold"

                >

                    {

                        loading

                            ? 'Analyzing...'

                            : 'Analyze Candidate Match'
                    }

                </button>

                {

                    result && (

                        <div className="grid lg:grid-cols-2 gap-8 mt-10">

                            <MatchCard

                                similarity={result.similarity}

                                finalScore={result.finalScore}

                            />

                            <SkillGapCard

                                matchedSkills={result.matchedSkills || []}

                                missingSkills={result.missingSkills || []}

                            />

                        </div>
                    )
                }

            </div>

        </Layout>
    )
}

export default JobMatch