import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Save, RotateCcw, Settings, Globe, Shield, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface ServerProperties {
  // World Settings
  'level-name': string
  'level-seed': string
  'level-type': string
  'generate-structures': boolean
  'generator-settings': string
  
  // Gameplay Settings
  gamemode: string
  difficulty: string
  hardcore: boolean
  'max-players': number
  'white-list': boolean
  'enforce-whitelist': boolean
  
  // Server Settings
  motd: string
  'server-port': number
  'max-world-size': number
  'view-distance': number
  'simulation-distance': number
  
  // Security Settings
  'online-mode': boolean
  'prevent-proxy-connections': boolean
  'enable-status': boolean
  'hide-online-players': boolean
  
  // Performance Settings
  'spawn-protection': number
  'max-tick-time': number
  'entity-broadcast-range-percentage': number
  'sync-chunk-writes': boolean
}

const schema = yup.object({
  'level-name': yup.string().required('World name is required'),
  'level-seed': yup.string(),
  'level-type': yup.string().required(),
  'generate-structures': yup.boolean().required(),
  'generator-settings': yup.string(),
  
  gamemode: yup.string().oneOf(['survival', 'creative', 'adventure', 'spectator']).required(),
  difficulty: yup.string().oneOf(['peaceful', 'easy', 'normal', 'hard']).required(),
  hardcore: yup.boolean().required(),
  'max-players': yup.number().min(1).max(100).required(),
  'white-list': yup.boolean().required(),
  'enforce-whitelist': yup.boolean().required(),
  
  motd: yup.string().max(255),
  'server-port': yup.number().min(1024).max(65535).required(),
  'max-world-size': yup.number().min(1).max(29999984).required(),
  'view-distance': yup.number().min(2).max(32).required(),
  'simulation-distance': yup.number().min(3).max(32).required(),
  
  'online-mode': yup.boolean().required(),
  'prevent-proxy-connections': yup.boolean().required(),
  'enable-status': yup.boolean().required(),
  'hide-online-players': yup.boolean().required(),
  
  'spawn-protection': yup.number().min(0).max(29999984).required(),
  'max-tick-time': yup.number().min(-1).required(),
  'entity-broadcast-range-percentage': yup.number().min(10).max(1000).required(),
  'sync-chunk-writes': yup.boolean().required(),
})

interface ServerPropertiesEditorProps {
  serverId: string
  currentProperties: Partial<ServerProperties>
  onSave: (properties: ServerProperties) => Promise<void>
  isLoading?: boolean
}

const ServerPropertiesEditor: React.FC<ServerPropertiesEditorProps> = ({
  serverId,
  currentProperties,
  onSave,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'world' | 'gameplay' | 'server' | 'security' | 'performance'>('world')
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<ServerProperties>({
    resolver: yupResolver(schema),
    defaultValues: {
      'level-name': 'world',
      'level-seed': '',
      'level-type': 'default',
      'generate-structures': true,
      'generator-settings': '',
      
      gamemode: 'survival',
      difficulty: 'normal',
      hardcore: false,
      'max-players': 20,
      'white-list': false,
      'enforce-whitelist': false,
      
      motd: 'A Minecraft Server',
      'server-port': 25565,
      'max-world-size': 29999984,
      'view-distance': 10,
      'simulation-distance': 10,
      
      'online-mode': true,
      'prevent-proxy-connections': false,
      'enable-status': true,
      'hide-online-players': false,
      
      'spawn-protection': 16,
      'max-tick-time': 60000,
      'entity-broadcast-range-percentage': 100,
      'sync-chunk-writes': true,
      
      ...currentProperties
    }
  })

  useEffect(() => {
    reset({ ...currentProperties })
  }, [currentProperties, reset])

  const onSubmit = async (data: ServerProperties) => {
    setSaving(true)
    try {
      await onSave(data)
      toast.success('Server properties updated successfully')
    } catch (error) {
      toast.error('Failed to update server properties')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'world', name: 'World', icon: Globe },
    { id: 'gameplay', name: 'Gameplay', icon: Users },
    { id: 'server', name: 'Server', icon: Settings },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'performance', name: 'Performance', icon: RotateCcw },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Server Properties</h3>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => reset()}
            disabled={!isDirty || saving}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty || saving || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
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
              </button>
            )
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* World Settings */}
        {activeTab === 'world' && (
          <div className="card space-y-4">
            <h4 className="text-lg font-medium text-white mb-4">World Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  World Name
                </label>
                <input
                  {...register('level-name')}
                  className="input-field"
                  placeholder="world"
                />
                {errors['level-name'] && (
                  <p className="mt-1 text-sm text-red-400">{errors['level-name'].message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  World Seed
                </label>
                <input
                  {...register('level-seed')}
                  className="input-field"
                  placeholder="Leave empty for random"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  World Type
                </label>
                <select {...register('level-type')} className="input-field">
                  <option value="default">Default</option>
                  <option value="flat">Superflat</option>
                  <option value="largeBiomes">Large Biomes</option>
                  <option value="amplified">Amplified</option>
                  <option value="buffet">Buffet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max World Size
                </label>
                <input
                  {...register('max-world-size')}
                  type="number"
                  className="input-field"
                  min="1"
                  max="29999984"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  {...register('generate-structures')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">Generate Structures (Villages, Dungeons, etc.)</span>
              </label>
            </div>
          </div>
        )}

        {/* Gameplay Settings */}
        {activeTab === 'gameplay' && (
          <div className="card space-y-4">
            <h4 className="text-lg font-medium text-white mb-4">Gameplay Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Mode
                </label>
                <select {...register('gamemode')} className="input-field">
                  <option value="survival">🗡️ Survival</option>
                  <option value="creative">🎨 Creative</option>
                  <option value="adventure">🗺️ Adventure</option>
                  <option value="spectator">👻 Spectator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <select {...register('difficulty')} className="input-field">
                  <option value="peaceful">😇 Peaceful</option>
                  <option value="easy">😊 Easy</option>
                  <option value="normal">😐 Normal</option>
                  <option value="hard">😈 Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Players
                </label>
                <input
                  {...register('max-players')}
                  type="number"
                  className="input-field"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Spawn Protection (blocks)
                </label>
                <input
                  {...register('spawn-protection')}
                  type="number"
                  className="input-field"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  {...register('hardcore')}
                  type="checkbox"
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">💀 Hardcore Mode (Ban on death)</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('white-list')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">📋 Enable Whitelist</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('enforce-whitelist')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">🔒 Enforce Whitelist (Kick non-whitelisted players)</span>
              </label>
            </div>
          </div>
        )}

        {/* Server Settings */}
        {activeTab === 'server' && (
          <div className="card space-y-4">
            <h4 className="text-lg font-medium text-white mb-4">Server Settings</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message of the Day (MOTD)
                </label>
                <input
                  {...register('motd')}
                  className="input-field"
                  placeholder="A Minecraft Server"
                  maxLength={255}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use § for color codes (e.g., §aGreen §bBlue)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server Port
                  </label>
                  <input
                    {...register('server-port')}
                    type="number"
                    className="input-field"
                    min="1024"
                    max="65535"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    View Distance (chunks)
                  </label>
                  <input
                    {...register('view-distance')}
                    type="number"
                    className="input-field"
                    min="2"
                    max="32"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Simulation Distance (chunks)
                  </label>
                  <input
                    {...register('simulation-distance')}
                    type="number"
                    className="input-field"
                    min="3"
                    max="32"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="card space-y-4">
            <h4 className="text-lg font-medium text-white mb-4">Security Settings</h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  {...register('online-mode')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm text-gray-300">🔐 Online Mode (Mojang Authentication)</span>
                  <p className="text-xs text-gray-500">Requires players to have legitimate Minecraft accounts</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('prevent-proxy-connections')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm text-gray-300">🚫 Prevent Proxy Connections</span>
                  <p className="text-xs text-gray-500">Block connections through proxies</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('enable-status')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm text-gray-300">📊 Enable Status</span>
                  <p className="text-xs text-gray-500">Allow server to appear in server lists</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  {...register('hide-online-players')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm text-gray-300">👤 Hide Online Players</span>
                  <p className="text-xs text-gray-500">Don't show player list in server status</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Performance Settings */}
        {activeTab === 'performance' && (
          <div className="card space-y-4">
            <h4 className="text-lg font-medium text-white mb-4">Performance Settings</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Tick Time (ms)
                </label>
                <input
                  {...register('max-tick-time')}
                  type="number"
                  className="input-field"
                  min="-1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  -1 to disable watchdog, 60000 default
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entity Broadcast Range (%)
                </label>
                <input
                  {...register('entity-broadcast-range-percentage')}
                  type="number"
                  className="input-field"
                  min="10"
                  max="1000"
                />
                <p className="mt-1 text-xs text-gray-500">
                  100% = normal, lower = better performance
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  {...register('sync-chunk-writes')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <div>
                  <span className="text-sm text-gray-300">💾 Sync Chunk Writes</span>
                  <p className="text-xs text-gray-500">Enable for better data safety, disable for performance</p>
                </div>
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default ServerPropertiesEditor