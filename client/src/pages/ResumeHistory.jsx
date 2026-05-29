import { useEffect, useState } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'

function ResumeHistory() {

    const [resumes, setResumes] = useState([])

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
        }
    }

    useEffect(() => {

        fetchHistory()

    }, [])

    return (

        <Layout>

            <h1 className="text-5xl font-bold text-slate-800">

                Resume History
            </h1>

            <div className="mt-10 space-y-6">

                {
                    resumes.map((resume) => (

                        <div

                            key={resume._id}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <div className="flex justify-between items-center">

                                <div>

                                    <h2 className="text-2xl font-semibold">

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
                                    resume.extractedSkills.map((skill, index) => (

                                        <span

                                            key={index}

                                            className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full"

                                        >
                                            {skill}
                                        </span>
                                    ))
                                }

                            </div>

                        </div>
                    ))
                }

            </div>

        </Layout>
    )
}

export default ResumeHistory