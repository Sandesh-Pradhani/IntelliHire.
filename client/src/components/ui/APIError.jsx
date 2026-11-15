import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * APIError — Displays an error message with an optional retry button.
 *
 * @param {string} message - Error message to display
 * @param {boolean} [retry] - Show retry button
 * @param {Function} [onRetry] - Callback when retry is clicked
 */
function APIError({ message = 'Something went wrong.', retry = false, onRetry }) {
  return (
    <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-12 text-center">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-600 mb-1">Error</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">{message}</p>
      {retry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-5 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}
    </div>
  )
}

export default APIError