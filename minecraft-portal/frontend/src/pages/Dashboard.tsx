import React, { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import { useUIMode } from '../contexts/UIModeContext'
import { useNavigate } from 'react-router-dom'
import CreateServerModal from '../components/CreateServerModal'
import ServerCard from '../components/ServerCard'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  Plus,
  Server,
  Activity,
  Database,
  TrendingUp,
  Users,
  Zap,
  BookOpen,
  Sparkles,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { isSimpleMode } = useUIMode()
  const navigate = useNavigate()

  const { data: servers = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await serverApi.getServers()
      return response.data
    },
    refetchInterval: 5000,
    staleTime: 2000,
  })

  // Memoize expensive calculations
  const stats = useMemo(() => {
    const runningServers = servers.filter(s => s.status === 'running').length
    const totalMemory = servers.reduce((acc, s) => acc + s.resourceLimits.memory, 0)
    const totalDisk = servers.reduce((acc, s) => acc + s.resourceLimits.disk, 0)
    const stoppedServers = servers.filter(s => s.status === 'stopped').length

    return {
      total: servers.length,
      running: runningServers,
      stopped: stoppedServers,
      memory: totalMemory,
      disk: totalDisk
    }
  }, [servers])

  const handleOpenModal = useCallback(() => setShowCreateModal(true), [])
  const handleCloseModal = useCallback(() => setShowCreateModal(false), [])
  const handleServerClick = useCallback((id: string) => navigate(`/servers/${id}`), [navigate])
  const handleModalSuccess = useCallback(() => {
    setShowCreateModal(false)
    refetch()
    toast.success(isSimpleMode ? '🎉 Server erstellt!' : '✅ Server created!')
  }, [refetch, isSimpleMode])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Different for Simple/Elite Mode */}
      {isSimpleMode ? (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center space-x-3">
                <span>🎮</span>
                <span>Willkommen bei CraftHost!</span>
              </h1>
              <p className="text-xl text-green-100">
                Hier kannst du ganz einfach deinen eigenen Minecraft Server erstellen! 🚀
              </p>
            </div>
            <div className="text-6xl animate-bounce">⛏</div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-2xl p-6 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center space-x-2">
                <Zap className="h-8 w-8" />
                <span>Elite Control Panel</span>
              </h1>
              <p className="text-lg text-purple-100">
                Volle Kontrolle über deine Server-Infrastruktur
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                {isSimpleMode ? '🎮 Deine Server' : 'Total Servers'}
              </p>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              {stats.stopped > 0 && (
                <p className="text-xs text-gray-500 mt-1">{stats.stopped} gestoppt</p>
              )}
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500/30 to-green-500/10 rounded-xl">
              <Server className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                {isSimpleMode ? '⚡ Laufende' : 'Running'}
              </p>
              <p className="text-3xl font-bold text-white">{stats.running}</p>
              <p className="text-xs text-gray-500 mt-1">von {stats.total}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-500/10 rounded-xl relative">
              <Activity className="h-8 w-8 text-blue-400" />
              {stats.running > 0 && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                {isSimpleMode ? '💾 Gesamt RAM' : 'Total Memory'}
              </p>
              <p className="text-3xl font-bold text-white">{(stats.memory / 1024).toFixed(1)}<span className="text-lg text-gray-400">GB</span></p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500/30 to-purple-500/10 rounded-xl">
              <Database className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-pink-500 hover:shadow-lg hover:shadow-pink-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">
                {isSimpleMode ? '💿 Speicher' : 'Total Storage'}
              </p>
              <p className="text-3xl font-bold text-white">{(stats.disk / 1024).toFixed(1)}<span className="text-lg text-gray-400">GB</span></p>
            </div>
            <div className="p-3 bg-gradient-to-br from-pink-500/30 to-pink-500/10 rounded-xl">
              <TrendingUp className="h-8 w-8 text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Simple Mode */}
      {isSimpleMode && stats.total === 0 && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 transition-all">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
              <Sparkles className="h-10 w-10 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 Erstelle deinen ersten Server!
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              Es ist ganz einfach! Klicke auf den Button und wähle, wie viele Spieler
              mitspielen sollen. Den Rest erledigen wir für dich! 🚀
            </p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-3 mx-auto"
            >
              <Plus className="h-6 w-6" />
              <span>Jetzt Server erstellen!</span>
            </button>
          </div>
        </div>
      )}

      {/* Tutorials Section - Simple Mode */}
      {isSimpleMode && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <BookOpen className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">📚 Erste Schritte</h3>
                <p className="text-sm text-gray-400">
                  Lerne, wie du deinen Server startest und Freunde einlädst
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Play className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">▶️ Tutorials</h3>
                <p className="text-sm text-gray-400">
                  Video-Anleitungen für coole Mods und Plugins
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">👥 Hilfe</h3>
                <p className="text-sm text-gray-400">
                  Brauchst du Hilfe? Wir helfen dir gerne weiter!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Servers Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Server className="h-7 w-7 text-green-400" />
            <span>{isSimpleMode ? 'Deine Server' : 'Server Instances'}</span>
          </h2>
          {isFetching && (
            <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        <button
          onClick={handleOpenModal}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105 active:scale-95 ${
            isSimpleMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 hover:shadow-green-500/50'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:shadow-purple-500/50'
          } text-white`}
          aria-label={isSimpleMode ? 'Neuen Server erstellen' : 'Create new server'}
        >
          <Plus className="h-5 w-5" />
          <span>{isSimpleMode ? 'Neuer Server' : 'Create Server'}</span>
        </button>
      </div>

      {stats.total > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onClick={() => handleServerClick(server.id)}
              onRefresh={refetch}
            />
          ))}
        </div>
      ) : (
        !isSimpleMode && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-12 text-center border border-gray-700 hover:border-gray-600 transition-all">
            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No servers yet</h3>
            <p className="text-gray-500 mb-6">Create your first server to get started</p>
            <button
              onClick={handleOpenModal}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center space-x-2 hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-500/50"
            >
              <Plus className="h-5 w-5" />
              <span>Create Server</span>
            </button>
          </div>
        )
      )}

      {/* Create Server Modal */}
      <CreateServerModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default Dashboard
