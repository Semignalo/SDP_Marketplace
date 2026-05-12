import { createContext, useContext, useEffect, useState } from 'react'
import {
  getMe,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
} from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      getMe()
        .then(({ data }) => setUser(data))
        .catch(() => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password) {
    const result = await authLogin(email, password)
    const { user: userData, token } = result.data
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    setUser(userData)
    return result
  }

  async function register(name, email, password, passwordConfirmation, referralCode) {
    const result = await authRegister(name, email, password, passwordConfirmation, referralCode)
    const { user: userData, token } = result.data
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    setUser(userData)
    return result
  }

  async function logout() {
    try {
      await authLogout()
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
