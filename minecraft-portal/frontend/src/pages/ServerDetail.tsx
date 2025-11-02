import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import { useUIMode } from '../contexts/UIModeContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ServerConsole from '../components/ServerConsole'
import ServerStats from '../components/ServerStats'
import ServerPropertiesEditor from '../components/ServerPropertiesEditor'
import PlayerManagement from '../components/PlayerManagement'
import WorldManagement from '../components/WorldManagement'
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Activity,
  Users,
  Settings,
  Globe,
  Terminal,
  Package,
  HardDrive
} from 'lucide-react'
import toast from 'react-hot-toast'

const ServerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isSimpleMode } = useUIMode()
  const [activeTab, setActiveTab] = useState('console')

  const { data: server, isLoading, refetch } = useQuery({
    queryKey: ['server', id],
    queryFn: async () => {
      const response = await serverApi.getServer(id!)
      return response.data
    },
    refetchInterval: 3000,
  })

  const actionMutation = useMutation({
    mutationFn: (action: string) => serverApi.performAction(id!, { action }),
    onSuccess: () => {
      toast.success('Action performed successfully!')
      refetch()
    },
    onError: () => {
      toast.error('Failed to perform action')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => serverApi.deleteServer(id!),
    onSuccess: () => {
      toast.success(isSimpleMode ? 'Server gelöscht!' : 'Server deleted!')
      navigate('/')
    },
    onError: () => {
      toast.error('Failed to delete server')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!server) {
    return (
      <div className="text-center text-gray-400 mt-12">
        <p>Server not found</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'stopped': return 'text-gray-400'
      case 'starting': return 'text-yellow-400'
      case 'stopping': return 'text-orange-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const tabs = [
    { id: 'console', name: isSimpleMode ? '💬 Konsole' : 'Console', icon: Terminal },
    { id: 'stats', name: isSimpleMode ? '📊 Statistiken' : 'Statistics', icon: Activity },
    { id: 'players', name: isSimpleMode ? '👥 Spieler' : 'Players', icon: Users },
    { id: 'settings', name: isSimpleMode ? '⚙️ Einstellungen' : 'Settings', icon: Settings },
    { id: 'worlds', name: isSimpleMode ? '🌍 Welten' : 'Worlds', icon: Globe },
    { id: 'backups', name: isSimpleMode ? '💾 Backups' : 'Backups', icon: HardDrive },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{isSimpleMode ? 'Zurück zur Übersicht' : 'Back to Dashboard'}</span>
        </button>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{server.name}</h1>
              <div className="flex items-center space-x-4 text-sm">
                <span className={`font-medium ${getStatusColor(server.status)}`}>
                  ● {server.status.toUpperCase()}
                </span>
                <span className="text-gray-400">
                  {server.gameVersion} • {server.egg}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {server.status === 'stopped' && (
                <button
                  onClick={() => actionMutation.mutate('start')}
                  disabled={actionMutation.isPending}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  <span>{isSimpleMode ? 'Starten' : 'Start'}</span>
                </button>
              )}

              {server.status === 'running' && (
                <button
                  onClick={() => actionMutation.mutate('stop')}
                  disabled={actionMutation.isPending}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  <span>{isSimpleMode ? 'Stoppen' : 'Stop'}</span>
                </button>
              )}

              <button
                onClick={() => actionMutation.mutate('restart')}
                disabled={actionMutation.isPending || server.status === 'stopped'}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isSimpleMode ? 'Neustarten' : 'Restart'}</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(isSimpleMode ? 'Server wirklich löschen?' : 'Are you sure you want to delete this server?')) {
                    deleteMutation.mutate()
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isSimpleMode ? 'Löschen' : 'Delete'}</span>
              </button>
            </div>
          </div>

          {/* Resource Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">RAM</div>
              <div className="text-2xl font-bold text-purple-400">
                {(server.resourceLimits.memory / 1024).toFixed(1)}GB
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">CPU</div>
              <div className="text-2xl font-bold text-blue-400">
                {server.resourceLimits.cpu}%
              </div>
            </div>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Disk</div>
              <div className="text-2xl font-bold text-pink-400">
                {(server.resourceLimits.disk / 1024).toFixed(1)}GB
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-white bg-gray-800'
                    : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'console' && <ServerConsole serverId={id!} />}
        {activeTab === 'stats' && <ServerStats serverId={id!} />}
        {activeTab === 'players' && <PlayerManagement serverId={id!} />}
        {activeTab === 'settings' && <ServerPropertiesEditor serverId={id!} />}
        {activeTab === 'worlds' && <WorldManagement serverId={id!} />}
        {activeTab === 'backups' && (
          <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
            <HardDrive className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {isSimpleMode ? 'Backups kommen bald!' : 'Backup System Coming Soon'}
            </h3>
            <p className="text-gray-500">
              {isSimpleMode
                ? 'Hier kannst du bald Backups erstellen und wiederherstellen'
                : 'Automated backup and restore functionality will be available soon'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServerDetail
