import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import LoadingSpinner from './LoadingSpinner'
import { 
  Activity, 
  HardDrive, 
  Cpu, 
  Network, 
  Clock,
  TrendingUp,
  Database
} from 'lucide-react'

interface ServerStatsProps {
  serverId: string
}

const ServerStats: React.FC<ServerStatsProps> = ({ serverId }) => {
  const { data: server } = useQuery({
    queryKey: ['server', serverId],
    queryFn: () => serverApi.getServer(serverId).then(res => res.data),
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['logs', serverId],
    queryFn: () => serverApi.getLogs(serverId, 100).then(res => res.data),
    refetchInterval: 30000,
  })

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatUptime = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h ${diffMinutes}m`
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  const getLogStats = () => {
    if (!logs) return { total: 0, errors: 0, warnings: 0 }
    
    return {
      total: logs.length,
      errors: logs.filter(log => log.level === 'error').length,
      warnings: logs.filter(log => log.level === 'warn').length,
    }
  }

  const logStats = getLogStats()

  if (!server) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resource Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-white">
                {formatBytes(server.resourceLimits.memory * 1024 * 1024)}
              </p>
              <p className="text-xs text-gray-500">Allocated</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
              <HardDrive className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">CPU Limit</p>
              <p className="text-2xl font-bold text-white">{server.resourceLimits.cpu}%</p>
              <p className="text-xs text-gray-500">Max Usage</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-full border border-green-500/20">
              <Cpu className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Disk Space</p>
              <p className="text-2xl font-bold text-white">
                {formatBytes(server.resourceLimits.disk * 1024 * 1024)}
              </p>
              <p className="text-xs text-gray-500">Allocated</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/20">
              <Database className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Network Port</p>
              <p className="text-2xl font-bold text-white">{server.port}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-full border border-orange-500/20">
              <Network className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Server Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Server Information</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                server.status === 'running' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                server.status === 'stopped' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
              }`}>
                {server.status}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Uptime</span>
              <span className="text-white">{formatUptime(server.createdAt)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Created</span>
              <span className="text-white">{new Date(server.createdAt).toLocaleDateString()}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white">{new Date(server.updatedAt).toLocaleDateString()}</span>
            </div>

            {server.gameVersion && (
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Game Version</span>
                <span className="text-white">{server.gameVersion}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-medium text-white">Log Statistics</h3>
          </div>

          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Total Log Entries</span>
                <span className="text-white font-medium">{logStats.total}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Errors</span>
                <span className="text-red-400 font-medium">{logStats.errors}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-gray-400">Warnings</span>
                <span className="text-yellow-400 font-medium">{logStats.warnings}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-400">Info Messages</span>
                <span className="text-blue-400 font-medium">
                  {logStats.total - logStats.errors - logStats.warnings}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resource Limits */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">Resource Limits</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <HardDrive className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Memory</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatBytes(server.resourceLimits.memory * 1024 * 1024)}
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">CPU</span>
            </div>
            <p className="text-lg font-bold text-white">{server.resourceLimits.cpu}%</p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Disk</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatBytes(server.resourceLimits.disk * 1024 * 1024)}
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <HardDrive className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-medium text-white">Swap</span>
            </div>
            <p className="text-lg font-bold text-white">
              {formatBytes(server.resourceLimits.swap * 1024 * 1024)}
            </p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium text-white">I/O Weight</span>
            </div>
            <p className="text-lg font-bold text-white">{server.resourceLimits.io}</p>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Network className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">Port</span>
            </div>
            <p className="text-lg font-bold text-white">{server.port}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServerStats