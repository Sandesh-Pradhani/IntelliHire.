import { useState } from 'react'

import axios from 'axios'

function FeedbackCard() {

    const [message, setMessage] = useState('')

    const [rating, setRating] = useState(5)

    const submitFeedback = async () => {

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

            alert('Feedback Submitted')

        } catch (error) {

            console.log(error)
        }
    }

    return (

        <div className="bg-white rounded-3xl shadow-lg p-8 mt-10">

            <h2 className="text-3xl font-semibold text-slate-800">

                User Feedback
            </h2>

            <textarea

                rows="5"

                placeholder="Share your experience..."

                onChange={(e) => setMessage(e.target.value)}

                className="w-full border rounded-2xl p-4 mt-6"

            />

            <select

                onChange={(e) => setRating(e.target.value)}

                className="mt-4 border rounded-xl px-4 py-2"

            >
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
            </select>

            <button

                onClick={submitFeedback}

                className="block mt-6 bg-blue-600 text-white px-6 py-3 rounded-xl"

            >
                Submit Feedback
            </button>

        </div>
    )
}

export default FeedbackCard