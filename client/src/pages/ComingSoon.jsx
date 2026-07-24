import { useLocation, Link, useSearchParams } from 'react-router-dom'
import { Construction, ArrowLeft } from 'lucide-react'
import ROUTES from '../constants/routes'

function ComingSoon() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const pageFromQuery = searchParams.get('page')
  const pageName = pageFromQuery || location.pathname
    .split('/')
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, c => c.toUpperCase()) || 'Feature'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center max-w-md">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="h-10 w-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{pageName}</h2>
        <p className="text-slate-500 mb-6 leading-relaxed">
          Feature Coming Soon
          <br />
          <span className="text-slate-400">Available in Phase 2</span>
        </p>
        <Link
          to={ROUTES.ROOT}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-5 py-2.5 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default ComingSoon
