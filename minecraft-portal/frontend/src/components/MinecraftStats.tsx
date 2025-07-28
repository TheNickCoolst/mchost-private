import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Clock, 
  Zap, 
  HardDrive, 
  Globe, 
  Activity,
  TrendingUp,
  Server,
  Eye,
  MessageSquare,
  Calendar,
  Timer
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'

interface MinecraftServerStats {
  // Server Performance
  tps: number // Ticks per second
  averageTps: number
  mspt: number // Milliseconds per tick
  
  // Player Stats
  playersOnline: number
  maxPlayers: number
  playersToday: number
  totalPlayersEver: number
  averagePlaytime: number
  
  // World Stats
  worldSize: number // in MB
  totalChunksLoaded: number
  entitiesCount: number
  tilesEntitiesCount: number
  
  // Server Uptime
  uptime: number // in seconds
  lastRestart: string
  
  // Performance Metrics
  memoryUsed: number
  memoryMax: number
  cpuUsage: number
  diskUsage: number
  
  // Minecraft Specific
  gameVersion: string
  serverType: string
  difficulty: string
  gamemode: string
  
  // Chat & Activity
  chatMessagesPerHour: number
  blocksPlacedPerHour: number
  blocksMinedPerHour: number
  mobsKilledPerHour: number
}

interface MinecraftStatsProps {
  serverId: string
}

const MinecraftStats: React.FC<MinecraftStatsProps> = ({ serverId }) => {
  // Mock data - replace with actual API call
  const mockStats: MinecraftServerStats = {
    tps: 19.8,
    averageTps: 19.5,
    mspt: 12.3,
    
    playersOnline: 5,
    maxPlayers: 20,
    playersToday: 12,
    totalPlayersEver: 847,
    averagePlaytime: 145, // minutes
    
    worldSize: 2048,
    totalChunksLoaded: 1247,
    entitiesCount: 456,
    tilesEntitiesCount: 89,
    
    uptime: 86400 * 3 + 3600 * 4, // 3 days 4 hours
    lastRestart: new Date(Date.now() - 86400000 * 3).toISOString(),
    
    memoryUsed: 1536,
    memoryMax: 2048,
    cpuUsage: 35.7,
    diskUsage: 45.2,
    
    gameVersion: '1.20.4',
    serverType: 'Paper',
    difficulty: 'Normal',
    gamemode: 'Survival',
    
    chatMessagesPerHour: 127,
    blocksPlacedPerHour: 2456,
    blocksMinedPerHour: 3789,
    mobsKilledPerHour: 245,
  }

  const {
    data: stats = mockStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['minecraftStats', serverId],
    queryFn: () => Promise.resolve(mockStats), // Replace with actual API call
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getTpsColor = (tps: number) => {
    if (tps >= 19.0) return 'text-green-400'
    if (tps >= 17.0) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getTpsStatus = (tps: number) => {
    if (tps >= 19.0) return 'Excellent'
    if (tps >= 17.0) return 'Good'
    if (tps >= 15.0) return 'Poor'
    return 'Critical'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Server className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Failed to load server statistics</h3>
          <p className="text-gray-400">Unable to retrieve server performance data.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Server TPS</p>
              <p className={`text-2xl font-bold ${getTpsColor(stats.tps)}`}>
                {stats.tps.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">{getTpsStatus(stats.tps)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Players Online</p>
              <p className="text-2xl font-bold text-white">
                {stats.playersOnline}/{stats.maxPlayers}
              </p>
              <p className="text-xs text-gray-500">{stats.playersToday} today</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Memory Usage</p>
              <p className="text-2xl font-bold text-white">
                {((stats.memoryUsed / stats.memoryMax) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(stats.memoryUsed * 1024 * 1024)} / {formatBytes(stats.memoryMax * 1024 * 1024)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
              <HardDrive className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Uptime</p>
              <p className="text-2xl font-bold text-white">
                {formatUptime(stats.uptime)}
              </p>
              <p className="text-xs text-gray-500">Since last restart</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-400" />
            Server Performance
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Current TPS:</span>
              <span className={`font-bold ${getTpsColor(stats.tps)}`}>{stats.tps.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Average TPS:</span>
              <span className={`font-bold ${getTpsColor(stats.averageTps)}`}>{stats.averageTps.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">MSPT:</span>
              <span className="text-white font-bold">{stats.mspt.toFixed(1)}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">CPU Usage:</span>
              <span className="text-white font-bold">{stats.cpuUsage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Disk Usage:</span>
              <span className="text-white font-bold">{stats.diskUsage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <Globe className="h-5 w-5 mr-2 text-green-400" />
            World Information
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Game Version:</span>
              <span className="text-white font-bold">⛏️ {stats.gameVersion}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Server Type:</span>
              <span className="text-white font-bold">{stats.serverType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Difficulty:</span>
              <span className="text-white font-bold">{stats.difficulty}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Game Mode:</span>
              <span className="text-white font-bold">{stats.gamemode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">World Size:</span>
              <span className="text-white font-bold">{formatBytes(stats.worldSize * 1024 * 1024)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Loaded Chunks:</span>
              <span className="text-white font-bold">{stats.totalChunksLoaded.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Statistics */}
      <div className="card">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-purple-400" />
          Player Statistics
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Players Today</p>
                <p className="text-xl font-bold text-white">{stats.playersToday}</p>
              </div>
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Players</p>
                <p className="text-xl font-bold text-white">{stats.totalPlayersEver.toLocaleString()}</p>
              </div>
              <Eye className="h-5 w-5 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Avg. Playtime</p>
                <p className="text-xl font-bold text-white">{Math.floor(stats.averagePlaytime / 60)}h</p>
              </div>
              <Timer className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Chat Messages/h</p>
                <p className="text-xl font-bold text-white">{stats.chatMessagesPerHour}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-pink-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="card">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-yellow-400" />
          Server Activity (Per Hour)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.blocksPlacedPerHour.toLocaleString()}</p>
              <p className="text-sm text-gray-400">🧱 Blocks Placed</p>
            </div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{stats.blocksMinedPerHour.toLocaleString()}</p>
              <p className="text-sm text-gray-400">⛏️ Blocks Mined</p>
            </div>
          </div>
          
          <div className="bg-gray-700/30 rounded-lg p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{stats.mobsKilledPerHour.toLocaleString()}</p>
              <p className="text-sm text-gray-400">⚔️ Mobs Defeated</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card">
        <h4 className="text-lg font-medium text-white mb-4 flex items-center">
          <Server className="h-5 w-5 mr-2 text-cyan-400" />
          System Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Entities Loaded:</span>
              <span className="text-white font-bold">{stats.entitiesCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tile Entities:</span>
              <span className="text-white font-bold">{stats.tilesEntitiesCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Last Restart:</span>
              <span className="text-white font-bold">
                {new Date(stats.lastRestart).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Server Uptime:</span>
              <span className="text-white font-bold">{formatUptime(stats.uptime)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MinecraftStats