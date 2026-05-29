import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'

function Jobs() {

    const [title, setTitle] = useState('')

    const [company, setCompany] = useState('')

    const [description, setDescription] = useState('')

    const [jobs, setJobs] = useState([])

    useEffect(() => {

        fetchJobs()

    }, [])

    const fetchJobs = async () => {

        try {

            const response = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/jobs`
            )

            setJobs(response.data)

        } catch (error) {

            console.log(error)
        }
    }

    const createJob = async () => {

        try {

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/jobs/create`,

                {
                    title,
                    company,
                    description
                }
            )

            fetchJobs()

        } catch (error) {

            console.log(error)
        }
    }

    return (

        <Layout>

            <h1 className="text-5xl font-bold text-slate-800">

                Job Management
            </h1>

            {/* CREATE JOB */}

            <div className="bg-white rounded-3xl shadow-lg p-8 mt-10">

                <h2 className="text-3xl font-semibold">

                    Create New Job
                </h2>

                <div className="mt-6 space-y-5">

                    <input
                        type="text"
                        placeholder="Job Title"
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full border rounded-xl p-4"
                    />

                    <input
                        type="text"
                        placeholder="Company"
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full border rounded-xl p-4"
                    />

                    <textarea
                        rows="5"
                        placeholder="Job Description"
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border rounded-xl p-4"
                    />

                    <button

                        onClick={createJob}

                        className="bg-blue-600 text-white px-8 py-4 rounded-xl"

                    >
                        Create Job
                    </button>

                </div>

            </div>

            {/* JOB LIST */}

            <div className="mt-10 grid gap-6">

                {
                    jobs.map((job) => (

                        <div

                            key={job._id}

                            className="bg-white rounded-3xl shadow-lg p-8"

                        >

                            <h2 className="text-2xl font-semibold">

                                {job.title}
                            </h2>

                            <p className="text-blue-600 mt-2">

                                {job.company}
                            </p>

                            <p className="text-slate-600 mt-4">

                                {job.description}
                            </p>

                        </div>
                    ))
                }

            </div>

        </Layout>
    )
}

export default Jobs