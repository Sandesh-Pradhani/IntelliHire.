import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute — Guards routes by authentication + optional role.
 *
 * @param {object}   props
 * @param {string}   [props.requiredRole] - 'candidate' | 'recruiter' | undefined (any authenticated user)
 * @param {ReactNode} props.children
 */
function ProtectedRoute({ children, requiredRole }) {

    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    /*
    NO TOKEN?
    REDIRECT LOGIN
    */

    if (!token) {
        return <Navigate to="/login" />
    }

    /*
    ROLE CHECK?
    */

    if (requiredRole) {
        let user = null
        try {
            user = userStr ? JSON.parse(userStr) : null
        } catch {
            /* ignore parse errors */
        }

        if (!user || user.role !== requiredRole) {
            // If the user exists but has the wrong role, redirect to their correct dashboard
            if (user?.role === 'candidate') return <Navigate to="/candidate/dashboard" />
            if (user?.role === 'recruiter') return <Navigate to="/recruiter/dashboard" />
            return <Navigate to="/login" />
        }
    }

    return children
}

export default ProtectedRoute
