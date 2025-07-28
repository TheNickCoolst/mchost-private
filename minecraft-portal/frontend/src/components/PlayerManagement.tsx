import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  ShieldCheck, 
  Ban, 
  Clock, 
  Search,
  Crown,
  Sword,
  Eye,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'

interface Player {
  uuid: string
  username: string
  isOnline: boolean
  lastSeen: string
  playTime: number
  isOperator: boolean
  isBanned: boolean
  isWhitelisted: boolean
  location?: {
    world: string
    x: number
    y: number
    z: number
  }
}

interface BanRequest {
  username: string
  reason?: string
  duration?: number // in minutes, 0 for permanent
}

interface WhitelistRequest {
  username: string
}

const banSchema = yup.object({
  username: yup.string().required('Username is required'),
  reason: yup.string().max(255, 'Reason must be less than 255 characters'),
  duration: yup.number().min(0, 'Duration must be positive').optional(),
})

const whitelistSchema = yup.object({
  username: yup.string().required('Username is required'),
})

interface PlayerManagementProps {
  serverId: string
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ serverId }) => {
  const [activeTab, setActiveTab] = useState<'online' | 'operators' | 'whitelist' | 'banned'>('online')
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Mock data - replace with actual API calls
  const mockPlayers: Player[] = [
    {
      uuid: '123e4567-e89b-12d3-a456-426614174000',
      username: 'Steve',
      isOnline: true,
      lastSeen: new Date().toISOString(),
      playTime: 12345,
      isOperator: true,
      isBanned: false,
      isWhitelisted: true,
      location: { world: 'world', x: 100, y: 64, z: 200 }
    },
    {
      uuid: '123e4567-e89b-12d3-a456-426614174001',
      username: 'Alex',
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      playTime: 8765,
      isOperator: false,
      isBanned: false,
      isWhitelisted: true,
    },
    {
      uuid: '123e4567-e89b-12d3-a456-426614174002',
      username: 'Notch',
      isOnline: true,
      lastSeen: new Date().toISOString(),
      playTime: 999999,
      isOperator: true,
      isBanned: false,
      isWhitelisted: true,
      location: { world: 'world_nether', x: 50, y: 70, z: 150 }
    }
  ]

  const {
    data: players = mockPlayers,
    isLoading: playersLoading,
  } = useQuery({
    queryKey: ['players', serverId],
    queryFn: () => Promise.resolve(mockPlayers), // Replace with actual API call
  })

  const banForm = useForm<BanRequest>({
    resolver: yupResolver(banSchema),
  })

  const whitelistForm = useForm<WhitelistRequest>({
    resolver: yupResolver(whitelistSchema),
  })

  const banPlayerMutation = useMutation({
    mutationFn: (data: BanRequest) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Player banned successfully')
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
      banForm.reset()
    },
    onError: () => {
      toast.error('Failed to ban player')
    },
  })

  const unbanPlayerMutation = useMutation({
    mutationFn: (username: string) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Player unbanned successfully')
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
    },
    onError: () => {
      toast.error('Failed to unban player')
    },
  })

  const toggleOpMutation = useMutation({
    mutationFn: ({ username, isOp }: { username: string; isOp: boolean }) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: (_, { isOp }) => {
      toast.success(`Player ${isOp ? 'promoted to' : 'demoted from'} operator`)
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
    },
    onError: () => {
      toast.error('Failed to update operator status')
    },
  })

  const whitelistPlayerMutation = useMutation({
    mutationFn: (data: WhitelistRequest) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Player added to whitelist')
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
      whitelistForm.reset()
    },
    onError: () => {
      toast.error('Failed to add player to whitelist')
    },
  })

  const removeFromWhitelistMutation = useMutation({
    mutationFn: (username: string) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Player removed from whitelist')
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
    },
    onError: () => {
      toast.error('Failed to remove player from whitelist')
    },
  })

  const kickPlayerMutation = useMutation({
    mutationFn: ({ username, reason }: { username: string; reason?: string }) => {
      // Replace with actual API call
      return Promise.resolve()
    },
    onSuccess: () => {
      toast.success('Player kicked from server')
      queryClient.invalidateQueries({ queryKey: ['players', serverId] })
    },
    onError: () => {
      toast.error('Failed to kick player')
    },
  })

  const formatPlayTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    switch (activeTab) {
      case 'online':
        return matchesSearch && player.isOnline
      case 'operators':
        return matchesSearch && player.isOperator
      case 'whitelist':
        return matchesSearch && player.isWhitelisted
      case 'banned':
        return matchesSearch && player.isBanned
      default:
        return matchesSearch
    }
  })

  const tabs = [
    { id: 'online', name: 'Online Players', icon: Users, count: players.filter(p => p.isOnline).length },
    { id: 'operators', name: 'Operators', icon: Crown, count: players.filter(p => p.isOperator).length },
    { id: 'whitelist', name: 'Whitelist', icon: ShieldCheck, count: players.filter(p => p.isWhitelisted).length },
    { id: 'banned', name: 'Banned', icon: Ban, count: players.filter(p => p.isBanned).length },
  ]

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Player Management</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-field"
            />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                <span className="bg-gray-600 px-2 py-1 rounded-full text-xs">{tab.count}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Action Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ban Player */}
        <div className="card">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <Ban className="h-5 w-5 mr-2 text-red-400" />
            Ban Player
          </h4>
          <form onSubmit={banForm.handleSubmit((data) => banPlayerMutation.mutate(data))} className="space-y-4">
            <div>
              <input
                {...banForm.register('username')}
                placeholder="Player username"
                className="input-field"
              />
              {banForm.formState.errors.username && (
                <p className="mt-1 text-sm text-red-400">{banForm.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <input
                {...banForm.register('reason')}
                placeholder="Reason (optional)"
                className="input-field"
              />
            </div>
            <div>
              <input
                {...banForm.register('duration')}
                type="number"
                placeholder="Duration in minutes (0 for permanent)"
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={banPlayerMutation.isPending}
              className="btn-danger w-full"
            >
              {banPlayerMutation.isPending ? 'Banning...' : 'Ban Player'}
            </button>
          </form>
        </div>

        {/* Add to Whitelist */}
        <div className="card">
          <h4 className="text-lg font-medium text-white mb-4 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-green-400" />
            Add to Whitelist
          </h4>
          <form onSubmit={whitelistForm.handleSubmit((data) => whitelistPlayerMutation.mutate(data))} className="space-y-4">
            <div>
              <input
                {...whitelistForm.register('username')}
                placeholder="Player username"
                className="input-field"
              />
              {whitelistForm.formState.errors.username && (
                <p className="mt-1 text-sm text-red-400">{whitelistForm.formState.errors.username.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={whitelistPlayerMutation.isPending}
              className="btn-primary w-full"
            >
              {whitelistPlayerMutation.isPending ? 'Adding...' : 'Add to Whitelist'}
            </button>
          </form>
        </div>
      </div>

      {/* Players List */}
      <div className="card">
        <div className="space-y-4">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No players found</h3>
              <p className="text-gray-400">
                {searchTerm ? 'No players match your search criteria.' : `No ${activeTab} players.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.uuid}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img
                        src={`https://mc-heads.net/avatar/${player.username}/32`}
                        alt={player.username}
                        className="w-8 h-8 rounded"
                      />
                      {player.isOnline && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{player.username}</span>
                        {player.isOperator && <Crown className="h-4 w-4 text-yellow-400" />}
                        {player.isWhitelisted && <ShieldCheck className="h-4 w-4 text-green-400" />}
                        {player.isBanned && <Ban className="h-4 w-4 text-red-400" />}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {player.isOnline ? 'Online' : `Last seen ${formatLastSeen(player.lastSeen)}`}
                        </span>
                        <span>Playtime: {formatPlayTime(player.playTime)}</span>
                        {player.location && (
                          <span>
                            {player.location.world} ({Math.round(player.location.x)}, {Math.round(player.location.y)}, {Math.round(player.location.z)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {player.isOnline && (
                      <>
                        <button
                          onClick={() => {/* Open chat */}}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                          title="Send message"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {/* Teleport to player */}}
                          className="p-2 text-purple-400 hover:text-purple-300 hover:bg-gray-600 rounded transition-colors"
                          title="Teleport to player"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => kickPlayerMutation.mutate({ username: player.username })}
                          className="p-2 text-orange-400 hover:text-orange-300 hover:bg-gray-600 rounded transition-colors"
                          title="Kick player"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => toggleOpMutation.mutate({ 
                        username: player.username, 
                        isOp: !player.isOperator 
                      })}
                      className={`p-2 hover:bg-gray-600 rounded transition-colors ${
                        player.isOperator ? 'text-yellow-400 hover:text-yellow-300' : 'text-gray-400 hover:text-yellow-400'
                      }`}
                      title={player.isOperator ? 'Remove operator' : 'Make operator'}
                    >
                      <Shield className="h-4 w-4" />
                    </button>

                    {player.isBanned ? (
                      <button
                        onClick={() => unbanPlayerMutation.mutate(player.username)}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
                        title="Unban player"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => banPlayerMutation.mutate({ username: player.username })}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
                        title="Ban player"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}

                    {player.isWhitelisted ? (
                      <button
                        onClick={() => removeFromWhitelistMutation.mutate(player.username)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded transition-colors"
                        title="Remove from whitelist"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => whitelistPlayerMutation.mutate({ username: player.username })}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
                        title="Add to whitelist"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PlayerManagement