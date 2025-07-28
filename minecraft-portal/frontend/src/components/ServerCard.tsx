import React from 'react'
import { ServerInstance } from '../types/server'
import { Play, Square, RotateCcw, AlertCircle, User, Calendar, HardDrive } from 'lucide-react'
import { clsx } from 'clsx'

interface ServerCardProps {
  server: ServerInstance
}

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  const getStatusIcon = () => {
    switch (server.status) {
      case 'running':
        return <Play className="h-4 w-4" />
      case 'stopped':
        return <Square className="h-4 w-4" />
      case 'starting':
      case 'stopping':
        return <RotateCcw className="h-4 w-4 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (server.status) {
      case 'running':
        return 'status-running'
      case 'stopped':
        return 'status-stopped'
      case 'starting':
        return 'status-starting'
      case 'stopping':
        return 'status-stopping'
      case 'error':
        return 'status-error'
      default:
        return 'status-stopped'
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="hosting-card cursor-pointer group hover:shadow-2xl transform hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
            <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors">
              {server.name}
            </h3>
          </div>
          {server.description && (
            <p className="text-sm text-gray-400 mt-1">{server.description}</p>
          )}
        </div>
        <div className={clsx('px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-sm', getStatusColor())}>
          {getStatusIcon()}
          <span className="capitalize">{server.status}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Connection</div>
            <div className="text-sm font-bold text-green-400">:{server.port}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Owner</div>
            <div className="text-sm font-bold text-white flex items-center">
              <User className="h-3 w-3 mr-1" />
              {server.owner.username}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Memory</div>
            <div className="text-sm font-bold text-blue-400">
              <HardDrive className="h-3 w-3 inline mr-1" />
              {formatBytes(server.resourceLimits.memory * 1024 * 1024)}
            </div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">CPU</div>
            <div className="text-sm font-bold text-purple-400">
              {server.resourceLimits.cpu}%
            </div>
          </div>
        </div>

        {server.gameVersion && (
          <div className="bg-gradient-to-r from-emerald-600/20 to-green-600/20 rounded-lg p-3 border border-green-500/30">
            <div className="text-xs text-green-400 mb-1">Minecraft Version</div>
            <div className="text-sm font-bold text-white">⛏️ {server.gameVersion}</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-medium">Server Type:</span> 
            <span className="ml-1">
              {server.egg === 'vanilla' ? '🧱 Vanilla' : 
               server.egg === 'paper' ? '📜 Paper' : 
               server.egg === 'spigot' ? '🔧 Spigot' : 
               server.egg === 'forge' ? '⚒️ Forge' :
               server.egg}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{new Date(server.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerCard