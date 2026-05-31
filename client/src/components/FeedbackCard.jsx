import { useState } from 'react'

import axios from 'axios'

function FeedbackCard({ onFeedbackSubmitted }) {

    const [message, setMessage] = useState('')

    const [rating, setRating] = useState(5)

    const [submitting, setSubmitting] = useState(false)

    const [success, setSuccess] = useState('')

    const [error, setError] = useState('')

    const submitFeedback = async () => {

        if (!message.trim()) {
            setError('Please enter a feedback message.')
            return
        }

        setSubmitting(true)
        setError('')
        setSuccess('')

        try {

            const token = localStorage.getItem('token')

            await axios.post(

                `${import.meta.env.VITE_API_URL}/api/feedback/submit`,

                {
                    message,
                    rating
                },

                {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                }
            )

            setSuccess('Feedback submitted successfully!')
            setMessage('')
            setRating(5)
            
            if (onFeedbackSubmitted) onFeedbackSubmitted()

        } catch (error) {

            console.log(error)
            setError(error.response?.data?.message || 'Failed to submit feedback.')
        } finally {

            setSubmitting(false)
        }
    }

    return (

        <div className="bg-white rounded-3xl shadow-lg p-8 mt-8 border border-slate-100">

            <h2 className="text-2xl font-bold text-slate-800">

                Share Your Feedback
            </h2>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
                    {success}
                </div>
            )}

            <textarea

                rows="5"

                placeholder="Share your experience..."

                value={message}

                onChange={(e) => setMessage(e.target.value)}

                className="w-full border rounded-2xl p-4 mt-6 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"

            />

            <select

                value={rating}

                onChange={(e) => setRating(Number(e.target.value))}

                className="mt-4 border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"

            >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Below Average</option>
                <option value={1}>1 Star - Poor</option>
            </select>

            <button

                onClick={submitFeedback}
                disabled={submitting}

                className={`block mt-6 px-8 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    submitting
                        ? 'bg-blue-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white'
                }`}

            >
                {submitting ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                    </span>
                ) : (
                    'Submit Feedback'
                )}
            </button>

        </div>
    )
}

export default FeedbackCard