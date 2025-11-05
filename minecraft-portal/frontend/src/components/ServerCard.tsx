import React, { memo, useCallback } from 'react'
import { ServerInstance } from '../types/server'
import { Play, Square, RotateCcw, AlertCircle, User, Calendar, HardDrive, Cpu } from 'lucide-react'
import { clsx } from 'clsx'

interface ServerCardProps {
  server: ServerInstance
  onClick?: () => void
  onRefresh?: () => void
}

const ServerCard: React.FC<ServerCardProps> = memo(({ server, onClick, onRefresh }) => {
  const getStatusIcon = useCallback(() => {
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
  }, [server.status])

  const getStatusColor = useCallback(() => {
    switch (server.status) {
      case 'running':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'stopped':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
      case 'starting':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'stopping':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    }
  }, [server.status])

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 MB'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }, [])

  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  return (
    <div
      className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-green-500/50 cursor-pointer group hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`Server ${server.name}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className={clsx(
              'w-3 h-3 rounded-full shadow-lg transition-all',
              server.status === 'running' ? 'bg-green-500 animate-pulse' :
              server.status === 'stopped' ? 'bg-gray-500' :
              server.status === 'error' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
            )}></div>
            <h3 className="text-lg font-bold text-white group-hover:text-green-400 transition-colors truncate">
              {server.name}
            </h3>
          </div>
          {server.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{server.description}</p>
          )}
        </div>
        <div className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 shadow-sm ml-3 flex-shrink-0', getStatusColor())}>
          {getStatusIcon()}
          <span className="capitalize">{server.status}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-gray-700/40 to-gray-700/20 rounded-lg p-3 border border-gray-600/30 hover:border-gray-500/50 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <div className="text-xs text-gray-400 font-medium">Port</div>
            </div>
            <div className="text-sm font-bold text-green-400">:{server.port}</div>
          </div>
          <div className="bg-gradient-to-br from-gray-700/40 to-gray-700/20 rounded-lg p-3 border border-gray-600/30 hover:border-gray-500/50 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <User className="h-3 w-3 text-blue-400" />
              <div className="text-xs text-gray-400 font-medium">Owner</div>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {server.owner.username}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-3 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <HardDrive className="h-3 w-3 text-blue-400" />
              <div className="text-xs text-blue-300 font-medium">RAM</div>
            </div>
            <div className="text-sm font-bold text-blue-400">
              {formatBytes(server.resourceLimits.memory * 1024 * 1024)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1.5">
              <Cpu className="h-3 w-3 text-purple-400" />
              <div className="text-xs text-purple-300 font-medium">CPU</div>
            </div>
            <div className="text-sm font-bold text-purple-400">
              {server.resourceLimits.cpu}%
            </div>
          </div>
        </div>

        {server.gameVersion && (
          <div className="bg-gradient-to-r from-emerald-500/15 to-green-500/15 rounded-lg p-3 border border-green-500/30 hover:border-green-500/50 transition-colors">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="text-base">⛏️</span>
              <div className="text-xs text-green-400 font-medium">Minecraft Version</div>
            </div>
            <div className="text-sm font-bold text-white">{server.gameVersion}</div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-600/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="font-medium">Type:</span>
            <span className="px-2 py-1 bg-gray-700/50 rounded-md font-semibold">
              {server.egg === 'vanilla' ? '🧱 Vanilla' :
               server.egg === 'paper' ? '📜 Paper' :
               server.egg === 'spigot' ? '🔧 Spigot' :
               server.egg === 'forge' ? '⚒️ Forge' :
               server.egg}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{new Date(server.createdAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

ServerCard.displayName = 'ServerCard'

export default ServerCard