import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, requiredRole }) {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (!token) {
        return <Navigate to="/login" />
    }

    if (requiredRole) {
        let user = null
        try {
            user = userStr ? JSON.parse(userStr) : null
        } catch { /* ignore */ }

        if (!user || user.role !== requiredRole) {
            if (user?.role === 'candidate') return <Navigate to="/candidate/dashboard" />
            if (user?.role === 'recruiter') return <Navigate to="/recruiter/dashboard" />
            if (user?.role === 'admin') return <Navigate to="/admin" />
            return <Navigate to="/login" />
        }
    }

    return children
}

export default ProtectedRoute
