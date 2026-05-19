import { createContext, useState } from 'react'

export const AuthContext = createContext()

function AuthProvider({ children }) {

    /*
    PERSIST LOGIN

    localStorage survives refresh.
    */

    const [user, setUser] = useState(

        JSON.parse(localStorage.getItem('user'))

    )

    const login = (userData, token) => {

        localStorage.setItem('user', JSON.stringify(userData))

        localStorage.setItem('token', token)

        setUser(userData)
    }

    const logout = () => {

        localStorage.removeItem('user')

        localStorage.removeItem('token')

        setUser(null)
    }

    return (

        <AuthContext.Provider

            value={{
                user,
                login,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>
    )
}

export default AuthProvider