import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, usersApi } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await usersApi.me()
      setUser(data)
    } catch {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const register = async (userData) => {
    const { data } = await authApi.register(userData)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { await authApi.logout(refreshToken) } catch {}
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }

  const updateUser  = (u) => setUser(prev => ({ ...prev, ...u }))
  const setProfile  = async (profile) => {
    const { data } = await usersApi.updateProfile({ profile })
    setUser(prev => ({ ...prev, profile: data.profile }))
    return data
  }

  const isAdmin      = user?.role === 'ADMIN'
  const isEnseignant = user?.role === 'ENSEIGNANT' || user?.profile === 'ENSEIGNANT'
  const hasAllAccess = isAdmin || isEnseignant
  const needsProfile = !!user && !user.profile

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser, setProfile,
      isAdmin, isEnseignant, hasAllAccess, needsProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
