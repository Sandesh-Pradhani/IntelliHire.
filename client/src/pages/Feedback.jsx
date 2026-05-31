import { useState, useEffect } from 'react'
import axios from 'axios'

import Layout from '../components/Layout'
import FeedbackCard from '../components/FeedbackCard'
import Skeleton from '../components/ui/Skeleton'

import { MessageSquare, ThumbsUp } from 'lucide-react'

function Feedback() {

    const [feedbacks, setFeedbacks] = useState([])

    const [loading, setLoading] = useState(true)

    const [error, setError] = useState('')

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
            setError('Failed to load feedback.')

        } finally {

            setLoading(false)
        }
    }

    useEffect(() => {

        fetchFeedback()

    }, [])

    return (

        <Layout>

            <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                Feedback
            </h1>

            {error && (
                <div className="mt-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <FeedbackCard onFeedbackSubmitted={fetchFeedback} />

            <div className="mt-10">
                <h2 className="text-xl font-bold text-slate-800 mb-4">Previous Feedback</h2>

                <div className="space-y-6">

                    {loading ? (
                        [...Array(2)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <div className="space-y-3 flex-1">
                                        <Skeleton width="30%" height="20px" />
                                        <Skeleton width="70%" height="14px" />
                                    </div>
                                    <div className="text-right space-y-2">
                                        <Skeleton width="50px" height="28px" />
                                        <Skeleton width="40px" height="12px" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : feedbacks.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                            <ThumbsUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-600">No feedback yet</h3>
                            <p className="text-sm text-slate-400 mt-1">Be the first to share your experience.</p>
                        </div>
                    ) : (
                        feedbacks.map((fb) => (

                            <div

                                key={fb._id}

                                className="bg-white rounded-3xl shadow-lg p-8 border border-slate-100 hover:shadow-md transition-shadow duration-300"
                            >

                                <div className="flex justify-between items-center">

                                    <div>

                                        <h2 className="text-xl font-bold text-slate-800">

                                            Feedback #{fb._id?.slice(-6) || 'Item'}
                                        </h2>

                                        <p className="text-slate-500 mt-2 leading-relaxed">

                                            {fb.message || 'No message provided.'}
                                        </p>

                                    </div>

                                    {fb.rating !== undefined && (

                                        <div className="text-right shrink-0 ml-6">

                                            <h2 className="text-4xl font-bold text-green-600">

                                                {fb.rating}/5
                                            </h2>

                                            <p className="text-slate-500 text-sm mt-1">

                                                Rating
                                            </p>

                                        </div>
                                    )}

                                </div>

                            </div>
                        ))
                    )}

                </div>
            </div>

        </Layout>
    )
}

export default Feedback