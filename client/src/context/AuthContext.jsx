import { useMemo, useState } from 'react'
import { AuthContext } from './authContext'

function getStoredUser() {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const loading = false

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

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
