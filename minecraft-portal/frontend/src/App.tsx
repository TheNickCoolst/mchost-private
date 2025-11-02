import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { UIModeProvider } from './contexts/UIModeContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ServerDetail from './pages/ServerDetail'
import UserManagement from './pages/UserManagement'
import Help from './pages/Help'
import Plugins from './pages/Plugins'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <UIModeProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/servers/:id" element={<ServerDetail />} />
            <Route path="/help" element={<Help />} />
            <Route path="/plugins" element={<Plugins />} />
            {(user.role === 'admin' || user.role === 'moderator') && (
              <Route path="/users" element={<UserManagement />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </UIModeProvider>
    </ThemeProvider>
  )
}

export default App