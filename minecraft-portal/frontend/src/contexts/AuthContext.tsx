import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types/auth'
import { authApi } from '../services/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  login: (emailOrUsername: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      validateToken()
    } else {
      setLoading(false)
    }
  }, [])

  const validateToken = async () => {
    try {
      const response = await authApi.getCurrentUser()
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    } finally {
      setLoading(false)
    }
  }

  const login = async (emailOrUsername: string, password: string) => {
    try {
      const response = await authApi.login({ emailOrUsername, password })
      const { user, accessToken, refreshToken } = response.data

      // Only store tokens in localStorage if they are provided (HTTPS disabled)
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      setUser(user)
      
      toast.success(`Welcome back, ${user.username}!`)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed'
      toast.error(message)
      throw error
    }
  }

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authApi.register({ username, email, password })
      const { user, accessToken, refreshToken } = response.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      setUser(user)
      
      toast.success(`Welcome, ${user.username}!`)
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed'
      toast.error(message)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}