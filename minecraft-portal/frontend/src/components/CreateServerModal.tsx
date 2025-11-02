import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import { minecraftApi } from '../services/minecraftApi'
import { CreateServerRequest } from '../types/server'
import LoadingSpinner from './LoadingSpinner'
import { X, Info } from 'lucide-react'
import toast from 'react-hot-toast'
interface ApiMinecraftVersion {
  id: string
  name: string
  type: 'release' | 'snapshot' | 'legacy'
  recommended?: boolean
  description?: string
  releaseDate?: string
}


const schema = yup.object({
  name: yup.string()
    .min(3, 'Server name must be at least 3 characters')
    .max(50, 'Server name must be less than 50 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/, 'Server name can only contain letters, numbers, spaces, hyphens, and underscores')
    .required('Server name is required'),
  playerCount: yup.string().required('Player count is required'),
  gameVersion: yup.string().required('Minecraft version is required'),
  serverType: yup.string().required('Server type is required'),
})

type FormData = yup.InferType<typeof schema>

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}


const playerCountOptions = [
  { 
    id: 'friends', 
    name: 'Just Friends', 
    emoji: '🏠', 
    players: '1-5 players',
    description: 'Perfect for you and your friends',
    memory: 1024, 
    cpu: 50, 
    disk: 2048 
  },
  { 
    id: 'small', 
    name: 'Small Group', 
    emoji: '🏘️', 
    players: '5-10 players',
    description: 'Great for a small community',
    memory: 2048, 
    cpu: 100, 
    disk: 4096 
  },
  { 
    id: 'big', 
    name: 'Big Server', 
    emoji: '🏙️', 
    players: '10-20 players',
    description: 'For popular servers',
    memory: 4096, 
    cpu: 150, 
    disk: 8192 
  },
  { 
    id: 'massive', 
    name: 'Massive World', 
    emoji: '🌍', 
    players: '20+ players',
    description: 'For huge communities',
    memory: 8192, 
    cpu: 200, 
    disk: 16384 
  },
]


const CreateServerModal: React.FC<CreateServerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [selectedPlayerCount, setSelectedPlayerCount] = useState('friends')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [availableVersions, setAvailableVersions] = useState<ApiMinecraftVersion[]>([])
  
  // Fetch Minecraft versions and server types
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['minecraft-versions'],
    queryFn: minecraftApi.getVersions
  })
  
  const { data: serverTypes = [], isLoading: serverTypesLoading } = useQuery({
    queryKey: ['server-types'],
    queryFn: minecraftApi.getServerTypes
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      playerCount: 'friends',
      gameVersion: '',
      serverType: '',
    },
  })

  const watchedPlayerCount = watch('playerCount')
  const watchedServerType = watch('serverType')
  const watchedGameVersion = watch('gameVersion')

  const createServerMutation = useMutation({
    mutationFn: (data: CreateServerRequest) => serverApi.createServer(data),
    onSuccess: () => {
      toast.success('Server created successfully!')
      reset()
      onSuccess()
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create server'
      toast.error(message)
    },
  })

  const onSubmit = (data: FormData) => {
    const selectedConfig = playerCountOptions.find(option => option.id === data.playerCount) || playerCountOptions[0]
    
    const serverData: CreateServerRequest = {
      name: data.name,
      description: '',
      nest: 'minecraft',
      egg: data.serverType || 'vanilla',
      port: 25565,
      gameVersion: data.gameVersion || '1.20.1',
      resourceLimits: {
        memory: selectedConfig.memory,
        cpu: selectedConfig.cpu,
        disk: selectedConfig.disk,
        swap: 0,
        io: 500,
      },
    }

    createServerMutation.mutate(serverData)
  }

  // Set default values when data loads
  React.useEffect(() => {
    if (versions.length > 0 && !watchedGameVersion) {
      const recommended = versions.find(v => v.recommended) || versions[0]
      setValue('gameVersion', recommended.id)
    }
  }, [versions, setValue, watchedGameVersion])
  
  React.useEffect(() => {
    if (serverTypes.length > 0 && !watchedServerType) {
      const paper = serverTypes.find(t => t.id === 'paper') || serverTypes[0]
      setValue('serverType', paper.id)
    }
  }, [serverTypes, setValue, watchedServerType])
  
  React.useEffect(() => {
    if (watchedPlayerCount !== selectedPlayerCount) {
      setSelectedPlayerCount(watchedPlayerCount)
    }
  }, [watchedPlayerCount, selectedPlayerCount])
  
  // Update available versions when server type changes
  React.useEffect(() => {
    if (watchedServerType) {
      minecraftApi.getCompatibleVersions(watchedServerType)
        .then(setAvailableVersions)
        .catch(() => setAvailableVersions(versions))
    } else {
      setAvailableVersions(versions)
    }
  }, [watchedServerType, versions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-3xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">🚀 Create Your Minecraft World</h3>
                <p className="text-sm text-gray-400">Simple setup, endless possibilities!</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Main Simple Form */}
            <div className="space-y-6">
              {/* Server Name */}
              <div>
                <label className="block text-lg font-medium text-white mb-3">
                  🎮 What should we call your world?
                </label>
                <input
                  {...register('name')}
                  className="input-field-large"
                  placeholder="My Epic World"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* Player Count Selection */}
              <div>
                <label className="block text-lg font-medium text-white mb-3">
                  👥 How many players will join?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {playerCountOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`relative cursor-pointer`}
                    >
                      <input
                        {...register('playerCount')}
                        type="radio"
                        value={option.id}
                        className="sr-only"
                      />
                      <div className={`player-count-card ${
                        selectedPlayerCount === option.id ? 'selected' : ''
                      }`}>
                        <div className="text-center">
                          <div className="text-2xl mb-2">{option.emoji}</div>
                          <div className="font-medium text-white">{option.name}</div>
                          <div className="text-sm text-gray-400">{option.players}</div>
                          <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.playerCount && (
                  <p className="mt-2 text-sm text-red-400">{errors.playerCount.message}</p>
                )}
              </div>
            </div>

            {/* Advanced Settings Toggle */}
            <div className="border-t border-gray-700 pt-6">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
                  ▶
                </span>
                <span>⚙️ Advanced Settings</span>
                <span className="text-xs text-gray-500">(optional)</span>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4 bg-gray-800/50 rounded-lg p-4">
                  {/* Minecraft Version */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Minecraft Version ⛏️
                    </label>
                    <select {...register('gameVersion')} className="input-field" disabled={versionsLoading}>
                      <option value="">Select Minecraft Version</option>
                      {versionsLoading ? (
                        <option disabled>Loading versions...</option>
                      ) : (
                        <>
                          <optgroup label="⭐ Recommended Version">
                            {availableVersions.filter(v => v.recommended).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🎮 1.21.x - Tricky Trials">
                            {availableVersions.filter(v => v.id.startsWith('1.21') && !v.recommended).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🌸 1.20.x - Trails & Tales">
                            {availableVersions.filter(v => v.id.startsWith('1.20')).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🌲 1.19.x - The Wild Update">
                            {availableVersions.filter(v => v.id.startsWith('1.19')).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="⛰️ 1.18.x - Caves & Cliffs II">
                            {availableVersions.filter(v => v.id.startsWith('1.18')).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🏔️ 1.17.x - Caves & Cliffs I">
                            {availableVersions.filter(v => v.id.startsWith('1.17')).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🔥 1.16.x - Nether Update">
                            {availableVersions.filter(v => v.id.startsWith('1.16')).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🕰️ Legacy Versions (1.15 and older)">
                            {availableVersions.filter(v =>
                              v.type === 'legacy' ||
                              v.id.startsWith('1.15') ||
                              v.id.startsWith('1.14') ||
                              v.id.startsWith('1.13') ||
                              v.id.startsWith('1.12') ||
                              v.id.startsWith('1.11') ||
                              v.id.startsWith('1.10') ||
                              v.id.startsWith('1.9') ||
                              v.id.startsWith('1.8')
                            ).map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.name} - {version.description}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    <div className="flex items-center space-x-1 mt-1">
                      <Info className="h-3 w-3 text-blue-400" />
                      <p className="text-xs text-gray-500">
                        {availableVersions.length} versions available - Latest versions have newest features, legacy versions have more mods
                      </p>
                    </div>
                    {errors.gameVersion && (
                      <p className="mt-1 text-sm text-red-400">{errors.gameVersion.message}</p>
                    )}
                  </div>

                  {/* Server Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Server Type 🚀
                    </label>
                    <select {...register('serverType')} className="input-field" disabled={serverTypesLoading}>
                      <option value="">Select Server Type</option>
                      {serverTypesLoading ? (
                        <option disabled>Loading server types...</option>
                      ) : (
                        <>
                          <optgroup label="🔌 Plugin Support">
                            {serverTypes.filter(t => t.supportsPlugins).map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name} - {type.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🔧 Mod Support">
                            {serverTypes.filter(t => t.supportsMods).map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name} - {type.description}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="🧱 Vanilla">
                            {serverTypes.filter(t => !t.supportsPlugins && !t.supportsMods).map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name} - {type.description}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    <div className="flex items-center space-x-1 mt-1">
                      <Info className="h-3 w-3 text-blue-400" />
                      <p className="text-xs text-gray-500">
                        Paper is recommended for most servers. Choose Forge/Fabric for mods.
                      </p>
                    </div>
                    {errors.serverType && (
                      <p className="mt-1 text-sm text-red-400">{errors.serverType.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-6">
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors px-4 py-2"
                disabled={createServerMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="minecraft-button text-xl px-8 py-4 flex items-center space-x-3"
                disabled={createServerMutation.isPending}
              >
                {createServerMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Creating your world...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Create My World!</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateServerModal