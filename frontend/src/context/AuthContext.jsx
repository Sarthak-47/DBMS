import { createContext, useContext, useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('evenzo_token')
    if (stored) {
      try {
        const decoded = jwtDecode(stored)
        if (decoded.exp * 1000 > Date.now()) {
          setToken(stored)
          setUser(decoded)
        } else {
          localStorage.removeItem('evenzo_token')
        }
      } catch {
        localStorage.removeItem('evenzo_token')
      }
    }
    setLoading(false)
  }, [])

  function login(tokenStr, userData) {
    localStorage.setItem('evenzo_token', tokenStr)
    setToken(tokenStr)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('evenzo_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
