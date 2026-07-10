import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Forbidden() {
  const { user } = useContext(AuthContext);

  const homePath = user?.role === 'admin' ? '/admin'
    : user?.role === 'recruiter' ? '/recruiter/dashboard'
    : user?.role === 'candidate' ? '/candidate/dashboard'
    : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <ShieldOff className="mx-auto mb-6 text-rose-400" size={48} />
        <h1 className="text-8xl font-extrabold bg-gradient-to-r from-rose-500 to-red-600 bg-clip-text text-transparent leading-none">
          403
        </h1>
        <h2 className="mt-4 text-2xl font-semibold text-slate-800">Access Denied</h2>
        <p className="mt-2 text-slate-500">You don't have permission to view this page.</p>
        <div className="mt-8">
          <Link to={homePath} className="px-6 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
