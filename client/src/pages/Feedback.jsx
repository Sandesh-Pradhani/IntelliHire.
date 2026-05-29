import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'

function Feedback() {

    const [feedbacks, setFeedbacks] = useState([])

    useEffect(() => {

        fetchFeedback()

    }, [])

    const fetchFeedback = async () => {

        try {

            const token = localStorage.getItem('token')

            const response = await axios.get(

                `${import.meta.env.VITE_API_URL}/api/feedback`,

                {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setFeedbacks(response.data)

        } catch (error) {

            console.log(error)
        }
    }

    return (

        <Layout>

            <h1 className="text-5xl font-bold text-slate-800">

                Feedback
            </h1>

            <div className="mt-10 space-y-6">

                {
                    feedbacks.length === 0 ? (

                        <p className="text-slate-500 text-lg">No feedback available yet.</p>

                    ) : (

                        feedbacks.map((fb) => (

                            <div

                                key={fb._id}

                                className="bg-white rounded-3xl shadow-lg p-8"
                            >

                                <div className="flex justify-between items-center">

                                    <div>

                                        <h2 className="text-2xl font-semibold">

                                            Feedback #{fb._id?.slice(-6) || 'Item'}
                                        </h2>

                                        <p className="text-slate-500 mt-2">

                                            {fb.message || 'No message provided.'}
                                        </p>

                                    </div>

                                    {fb.rating !== undefined && (

                                        <div className="text-right">

                                            <h2 className="text-4xl font-bold text-green-600">

                                                {fb.rating}/5
                                            </h2>

                                            <p className="text-slate-500">

                                                Rating
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </div>
                        ))
                    )
                }

            </div>

        </Layout>
    )
}

export default Feedback