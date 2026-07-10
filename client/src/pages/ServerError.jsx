import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function ServerError() {
  const { user } = useContext(AuthContext);

  const homePath = user?.role === 'admin' ? '/admin'
    : user?.role === 'recruiter' ? '/recruiter/dashboard'
    : user?.role === 'candidate' ? '/candidate/dashboard'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto mb-6 text-amber-400" size={48} />
        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent leading-none">
          500
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-800">Server Error</h2>
        <p className="mt-2 text-slate-500">Something went wrong on our end. Please try again later.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors">
            Try Again
          </button>
          <Link to={homePath} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
