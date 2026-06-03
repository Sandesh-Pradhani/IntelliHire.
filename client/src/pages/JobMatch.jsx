import { useState } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import MatchCard from '../components/MatchCard'
import SkillGapCard from '../components/SkillGapCard'

function JobMatch() {

    const [jobText, setJobText] = useState('')

    const [resumeText, setResumeText] = useState('')

    const [result, setResult] = useState(null)

    const [loading, setLoading] = useState(false)

    const runMatching = async () => {

        try {

            setLoading(true)

            const response = await axios.post(

                `${import.meta.env.VITE_API_URL}/api/recruiter/match`,

                {
                    job: jobText,

                    resume: resumeText,

                    candidateSkills: [

                        'python',
                        'react',
                        'mongodb'
                    ],

                    requiredSkills: [

                        'python',
                        'react',
                        'docker',
                        'aws'
                    ]
                }
            )

            setResult(response.data)

            setLoading(false)

        } catch (error) {

            console.log(error)

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

                    Compare candidate resumes against job requirements using semantic matching.
                </p>

                {/* INPUT SECTION */}

                <div className="grid lg:grid-cols-2 gap-8 mt-10">

                    <div className="bg-white rounded-3xl shadow-lg p-8">

                        <h2 className="text-2xl font-semibold">

                            Job Description
                        </h2>

                        <textarea

                            rows="12"

                            className="w-full mt-5 border rounded-2xl p-4"

                            placeholder="Paste Job Description..."

                            onChange={(e) =>

                                setJobText(e.target.value)
                            }

                        />

                    </div>

                    <div className="bg-white rounded-3xl shadow-lg p-8">

                        <h2 className="text-2xl font-semibold">

                            Candidate Resume
                        </h2>

                        <textarea

                            rows="12"

                            className="w-full mt-5 border rounded-2xl p-4"

                            placeholder="Paste Resume Content..."

                            onChange={(e) =>

                                setResumeText(e.target.value)
                            }

                        />

                    </div>

                </div>

                {/* ACTION */}

                <button

                    onClick={runMatching}

                    className="mt-8 bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-4 rounded-2xl font-semibold shadow-lg"

                >

                    Analyze Candidate Match

                </button>

                {/* LOADING */}

                {
                    loading && (

                        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">

                            <p className="text-blue-600 font-medium">

                                AI is evaluating candidate compatibility...
                            </p>

                        </div>
                    )
                }

                {/* RESULTS */}

                {
                    result && (

                        <div className="grid lg:grid-cols-2 gap-8 mt-10">

                            <MatchCard

                                similarity={result.similarity}

                                finalScore={result.finalScore}

                            />

                            <SkillGapCard

                                matchedSkills={result.matchedSkills}

                                missingSkills={result.missingSkills}

                            />

                        </div>
                    )
                }

            </div>

        </Layout>
    )
}

export default JobMatch