import { useEffect, useState } from 'react'
import axios from 'axios'
import { MessageSquare, ThumbsUp } from 'lucide-react'
import FeedbackCard from '../components/FeedbackCard'
import Skeleton from '../components/ui/Skeleton'
import { normalizeArray } from '../utils/apiNormalizer'

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setFeedbacks(normalizeArray(response.data))
    } catch (requestError) {
      console.log(requestError)
      setError('Failed to load feedback.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="flex items-center gap-3 text-4xl font-bold text-slate-800">
        <MessageSquare className="h-8 w-8 text-blue-600" />
        Feedback
      </h1>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <FeedbackCard onFeedbackSubmitted={fetchFeedback} />

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-bold text-slate-800">Previous Feedback</h2>

        <div className="space-y-6">
          {loading ? (
            [...Array(2)].map((_, index) => (
              <div key={index} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <Skeleton width="30%" height="20px" />
                    <Skeleton width="70%" height="14px" />
                  </div>
                  <div className="space-y-2 text-right">
                    <Skeleton width="50px" height="28px" />
                    <Skeleton width="40px" height="12px" />
                  </div>
                </div>
              </div>
            ))
          ) : feedbacks.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <ThumbsUp className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-600">No feedback yet</h3>
              <p className="mt-1 text-sm text-slate-400">Be the first to share your experience.</p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <div key={feedback._id} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-lg transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Feedback #{feedback._id?.slice(-6) || 'Item'}</h2>
                    <p className="mt-2 leading-relaxed text-slate-500">{feedback.message || 'No message provided.'}</p>
                  </div>
                  {feedback.rating !== undefined ? (
                    <div className="ml-6 shrink-0 text-right">
                      <h2 className="text-4xl font-bold text-green-600">{feedback.rating}/5</h2>
                      <p className="mt-1 text-sm text-slate-500">Rating</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Feedback
