import React, { useState } from 'react'
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
  Pause
} from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { isSimpleMode } = useUIMode()
  const navigate = useNavigate()

  const { data: servers = [], isLoading, refetch } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await serverApi.getServers()
      return response.data
    },
    refetchInterval: 5000,
  })

  const runningServers = servers.filter(s => s.status === 'running').length
  const totalMemory = servers.reduce((acc, s) => acc + s.resourceLimits.memory, 0)
  const totalDisk = servers.reduce((acc, s) => acc + s.resourceLimits.disk, 0)

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
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                {isSimpleMode ? 'Deine Server' : 'Total Servers'}
              </p>
              <p className="text-3xl font-bold text-white mt-1">{servers.length}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Server className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                {isSimpleMode ? 'Laufende Server' : 'Running'}
              </p>
              <p className="text-3xl font-bold text-white mt-1">{runningServers}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                {isSimpleMode ? 'Gesamt RAM' : 'Total Memory'}
              </p>
              <p className="text-3xl font-bold text-white mt-1">{(totalMemory / 1024).toFixed(1)}GB</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-pink-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">
                {isSimpleMode ? 'Gesamt Speicher' : 'Total Storage'}
              </p>
              <p className="text-3xl font-bold text-white mt-1">{(totalDisk / 1024).toFixed(1)}GB</p>
            </div>
            <div className="p-3 bg-pink-500/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-pink-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Simple Mode */}
      {isSimpleMode && servers.length === 0 && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border-2 border-dashed border-blue-500/30">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 Erstelle deinen ersten Server!
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Es ist ganz einfach! Klicke auf den Button und wähle, wie viele Spieler
              mitspielen sollen. Den Rest erledigen wir für dich! 🚀
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center space-x-3 mx-auto"
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
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Server className="h-7 w-7" />
          <span>{isSimpleMode ? 'Deine Server' : 'Server Instances'}</span>
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
            isSimpleMode
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          } text-white`}
        >
          <Plus className="h-5 w-5" />
          <span>{isSimpleMode ? 'Neuer Server' : 'Create Server'}</span>
        </button>
      </div>

      {servers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => (
            <ServerCard
              key={server.id}
              server={server}
              onClick={() => navigate(`/servers/${server.id}`)}
              onRefresh={refetch}
            />
          ))}
        </div>
      ) : (
        !isSimpleMode && (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
            <Server className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No servers yet</h3>
            <p className="text-gray-500 mb-6">Create your first server to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center space-x-2"
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
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          refetch()
        }}
      />
    </div>
  )
}

export default Dashboard
