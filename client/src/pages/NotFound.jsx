import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function NotFound() {
  const { user } = useContext(AuthContext);

  const homePath = user?.role === 'admin' ? '/admin'
    : user?.role === 'recruiter' ? '/recruiter/dashboard'
    : user?.role === 'candidate' ? '/candidate/dashboard'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <MapPin className="mx-auto mb-6 text-indigo-400" size={48} />
        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-none">
          404
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-800">Page Not Found</h2>
        <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to={homePath} className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
            Go Home
          </Link>
          <button onClick={() => window.history.back()} className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
