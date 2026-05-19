import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {

    const token = localStorage.getItem('token')

    /*
    NO TOKEN?
    REDIRECT LOGIN
    */

    if (!token) {

        return <Navigate to="/login" />
    }

    return children
}

export default ProtectedRoute