import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { login, register } = useAuth()

  // Validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Benutzername muss mindestens 3 Zeichen haben'
    }

    if (!isLogin || setupRequired) {
      if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Bitte gültige E-Mail eingeben'
      }
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Passwort muss mindestens 6 Zeichen haben'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, isLogin, setupRequired])

  const isFormValid = useMemo(() => {
    return formData.username.length >= 3 &&
           formData.password.length >= 6 &&
           (isLogin || formData.email.includes('@'))
  }, [formData, isLogin])

  // Check if initial setup is required
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/setup-status`)
        setSetupRequired(response.data.setupRequired)
        if (response.data.setupRequired) {
          setIsLogin(false) // Switch to registration mode
        }
      } catch (error) {
        console.error('Setup status check failed:', error)
      }
    }
    checkSetupStatus()
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Bitte alle Felder korrekt ausfüllen')
      return
    }

    setLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        await login(formData.username, formData.password)
        toast.success('🎮 Willkommen zurück!', {
          duration: 3000,
          icon: '👋',
        })
      } else {
        await register(formData.username, formData.email, formData.password)
        toast.success('🎉 Account erfolgreich erstellt!', {
          duration: 3000,
          icon: '✨',
        })
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ein Fehler ist aufgetreten'
      toast.error(errorMessage, {
        duration: 4000,
      })
      setErrors({ form: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [formData, isLogin, login, register, validateForm])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl mb-4">
            <span className="text-4xl">⛏</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">CraftHost Pro</h1>
          <p className="text-gray-400">Dein Minecraft Server Hosting</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700">
          {/* Initial Setup Notice */}
          {setupRequired && (
            <div className="mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-1">🚀 Erstmaliges Setup</h3>
                  <p className="text-gray-300 text-sm">
                    Erstelle deinen Admin-Account um das System zu initialisieren.
                    Der erste Benutzer erhält automatisch Administrator-Rechte.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Switcher - Hide when setup is required */}
          {!setupRequired && (
            <div className="flex mb-6 bg-gray-700/50 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 rounded-md transition-all ${
                  isLogin
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-400'
                }`}
              >
                Anmelden
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 rounded-md transition-all ${
                  !isLogin
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-400'
                }`}
              >
                Registrieren
              </button>
            </div>
          )}

          {/* Setup Mode Title */}
          {setupRequired && (
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Admin-Account erstellen
            </h2>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Benutzername
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value })
                    setErrors({ ...errors, username: '' })
                  }}
                  className={`w-full px-4 py-3 bg-gray-700 border ${
                    errors.username ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition`}
                  placeholder="Dein Benutzername"
                  required
                  minLength={3}
                  autoComplete="username"
                />
                {formData.username.length >= 3 && !errors.username && (
                  <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                )}
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.username}</span>
                </p>
              )}
            </div>

            {/* Email Field */}
            {(!isLogin || setupRequired) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  E-Mail
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setErrors({ ...errors, email: '' })
                    }}
                    className={`w-full px-4 py-3 bg-gray-700 border ${
                      errors.email ? 'border-red-500' : 'border-gray-600'
                    } rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition`}
                    placeholder="deine@email.de"
                    required={!isLogin || setupRequired}
                    autoComplete="email"
                  />
                  {formData.email.includes('@') && !errors.email && (
                    <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-green-500" />
                  )}
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.email}</span>
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Passwort
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setErrors({ ...errors, password: '' })
                  }}
                  className={`w-full px-4 py-3 pr-12 bg-gray-700 border ${
                    errors.password ? 'border-red-500' : 'border-gray-600'
                  } rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition`}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-white transition"
                  aria-label={showPassword ? 'Passwort verstecken' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </p>
              )}
              {!isLogin && formData.password.length > 0 && formData.password.length < 6 && (
                <p className="mt-1 text-xs text-gray-400">
                  Noch {6 - formData.password.length} Zeichen benötigt
                </p>
              )}
            </div>

            {/* Form Error */}
            {errors.form && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.form}</span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${
                (isLogin && !setupRequired)
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-green-500/50'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2`}
              aria-label={setupRequired ? 'Admin Account erstellen' : (isLogin ? 'Anmelden' : 'Account erstellen')}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Laden...</span>
                </>
              ) : (
                <span>
                  {setupRequired
                    ? '👑 Admin-Account erstellen'
                    : (isLogin ? '🎮 Anmelden' : '🚀 Account erstellen')
                  }
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          © 2025 CraftHost Pro - Premium Minecraft Hosting
        </p>
      </div>
    </div>
  )
}

export default Login
