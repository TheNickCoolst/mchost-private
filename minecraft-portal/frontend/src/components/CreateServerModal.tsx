import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import { serverApi } from '../services/api'
import { minecraftApi } from '../services/minecraftApi'
import { CreateServerRequest } from '../types/server'
import { useUIMode } from '../contexts/UIModeContext'
import LoadingSpinner from './LoadingSpinner'
import { X, Info, Cpu, HardDrive, MemoryStick, ChevronRight, Sparkles, Zap } from 'lucide-react'
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
  gameVersion: yup.string().required('Minecraft version is required'),
  serverType: yup.string().required('Server type is required'),
})

type FormData = yup.InferType<typeof schema>

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// Simple Mode - Predefined Plans
const simplePlans = [
  {
    id: 'tiny',
    name: 'Mini Server',
    emoji: '🏠',
    players: '2-3 Spieler',
    description: 'Perfekt für dich und 1-2 Freunde',
    memory: 1024,
    cpu: 50,
    disk: 2048,
    price: '2,99 €',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'small',
    name: 'Freunde Server',
    emoji: '🏘️',
    players: '4-8 Spieler',
    description: 'Spiele mit deinen besten Freunden',
    memory: 2048,
    cpu: 100,
    disk: 5120,
    price: '5,99 €',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'medium',
    name: 'Party Server',
    emoji: '🎉',
    players: '8-15 Spieler',
    description: 'Für größere Gruppen',
    memory: 4096,
    cpu: 150,
    disk: 10240,
    price: '9,99 €',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'large',
    name: 'Mega Server',
    emoji: '🌍',
    players: '15-30 Spieler',
    description: 'Für große Communities',
    memory: 8192,
    cpu: 200,
    disk: 20480,
    price: '17,99 €',
    color: 'from-orange-500 to-red-500'
  },
]

// Elite Mode - Resource Sliders
const CreateServerModalNew: React.FC<CreateServerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { isSimpleMode, isEliteMode } = useUIMode()
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('small')

  // Elite mode custom resources
  const [customMemory, setCustomMemory] = useState(2048)
  const [customCpu, setCustomCpu] = useState(100)
  const [customDisk, setCustomDisk] = useState(5120)

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
      gameVersion: '',
      serverType: '',
    },
  })

  const watchedServerType = watch('serverType')
  const watchedGameVersion = watch('gameVersion')

  const createServerMutation = useMutation({
    mutationFn: (data: CreateServerRequest) => serverApi.createServer(data),
    onSuccess: () => {
      toast.success(isSimpleMode ? '🎉 Dein Server wurde erstellt!' : 'Server created successfully!')
      reset()
      setStep(1)
      onSuccess()
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create server'
      toast.error(message)
    },
  })

  const onSubmit = (data: FormData) => {
    let memory, cpu, disk

    if (isSimpleMode) {
      const plan = simplePlans.find(p => p.id === selectedPlan) || simplePlans[1]
      memory = plan.memory
      cpu = plan.cpu
      disk = plan.disk
    } else {
      memory = customMemory
      cpu = customCpu
      disk = customDisk
    }

    const serverData: CreateServerRequest = {
      name: data.name,
      description: '',
      nest: 'minecraft',
      egg: data.serverType || 'vanilla',
      port: 25565,
      gameVersion: data.gameVersion || '1.20.1',
      resourceLimits: {
        memory,
        cpu,
        disk,
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
    if (watchedServerType) {
      minecraftApi.getCompatibleVersions(watchedServerType)
        .then(setAvailableVersions)
        .catch(() => setAvailableVersions(versions))
    } else {
      setAvailableVersions(versions)
    }
  }, [watchedServerType, versions])

  // Calculate price for elite mode
  const calculatePrice = () => {
    const memoryPrice = (customMemory / 1024) * 2.5
    const cpuPrice = (customCpu / 50) * 1.5
    const diskPrice = (customDisk / 1024) * 0.5
    return (memoryPrice + cpuPrice + diskPrice).toFixed(2)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-4xl p-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 bg-gradient-to-br ${isSimpleMode ? 'from-green-500 to-emerald-600' : 'from-purple-500 to-pink-600'} rounded-lg shadow-lg`}>
                {isSimpleMode ? <Sparkles className="h-6 w-6 text-white" /> : <Zap className="h-6 w-6 text-white" />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {isSimpleMode ? '🎮 Erstelle deinen Server' : '⚡ Create Server Instance'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isSimpleMode ? 'Ganz einfach in 3 Schritten!' : 'Configure your server resources'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8 space-x-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s
                    ? isSimpleMode
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {s}
                </div>
                {s < 3 && <ChevronRight className="h-5 w-5 text-gray-600 mx-2" />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Server Name */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-lg font-medium text-white mb-3">
                    {isSimpleMode ? '📝 Wie soll dein Server heißen?' : '📝 Server Name'}
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-lg"
                    placeholder={isSimpleMode ? 'z.B. Meine Welt' : 'Production Server 01'}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all shadow-lg ${
                    isSimpleMode
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  }`}
                >
                  {isSimpleMode ? 'Weiter! 🚀' : 'Next Step →'}
                </button>
              </div>
            )}

            {/* Step 2: Plan Selection */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                {isSimpleMode ? (
                  <>
                    <label className="block text-lg font-medium text-white mb-3">
                      💪 Wähle die Größe deines Servers:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {simplePlans.map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`p-6 rounded-xl border-2 transition-all text-left ${
                            selectedPlan === plan.id
                              ? `border-white bg-gradient-to-br ${plan.color} shadow-xl scale-105`
                              : 'border-gray-700 bg-gray-700/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-4xl mb-2">{plan.emoji}</div>
                          <div className="text-xl font-bold text-white mb-1">{plan.name}</div>
                          <div className="text-sm text-gray-300 mb-2">{plan.players}</div>
                          <div className="text-xs text-gray-400 mb-3">{plan.description}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold text-white">{plan.price}</div>
                            <div className="text-xs text-gray-400">pro Monat</div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-600 text-xs text-gray-400 space-y-1">
                            <div>💾 {(plan.memory / 1024).toFixed(1)}GB RAM</div>
                            <div>⚡ {plan.cpu}% CPU</div>
                            <div>💿 {(plan.disk / 1024).toFixed(1)}GB Speicher</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-lg font-medium text-white mb-3">
                      ⚙️ Configure Server Resources:
                    </label>
                    <div className="space-y-6 bg-gray-700/50 rounded-xl p-6">
                      {/* RAM Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MemoryStick className="h-5 w-5 text-purple-400" />
                            <span className="text-white font-medium">RAM Memory</span>
                          </div>
                          <span className="text-2xl font-bold text-purple-400">
                            {(customMemory / 1024).toFixed(1)}GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1024"
                          max="16384"
                          step="512"
                          value={customMemory}
                          onChange={(e) => setCustomMemory(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-purple"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1GB</span>
                          <span>16GB</span>
                        </div>
                      </div>

                      {/* CPU Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-5 w-5 text-blue-400" />
                            <span className="text-white font-medium">CPU Cores</span>
                          </div>
                          <span className="text-2xl font-bold text-blue-400">
                            {customCpu}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="400"
                          step="50"
                          value={customCpu}
                          onChange={(e) => setCustomCpu(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-blue"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0.5 Core</span>
                          <span>4 Cores</span>
                        </div>
                      </div>

                      {/* Disk Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <HardDrive className="h-5 w-5 text-pink-400" />
                            <span className="text-white font-medium">Disk Storage</span>
                          </div>
                          <span className="text-2xl font-bold text-pink-400">
                            {(customDisk / 1024).toFixed(1)}GB
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2048"
                          max="51200"
                          step="1024"
                          value={customDisk}
                          onChange={(e) => setCustomDisk(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-pink"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>2GB</span>
                          <span>50GB</span>
                        </div>
                      </div>

                      {/* Price Estimate */}
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Estimated Price:</span>
                          <span className="text-3xl font-bold text-white">{calculatePrice()} €<span className="text-sm text-gray-400">/mo</span></span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all"
                  >
                    ← Zurück
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all shadow-lg ${
                      isSimpleMode
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {isSimpleMode ? 'Weiter! 🚀' : 'Next Step →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Game Settings */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                {isSimpleMode ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-300">
                        <strong>Fast fertig!</strong> Wir verwenden automatisch die beste Minecraft-Version
                        und Einstellungen für dich. Du kannst später alles anpassen! 🎮
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Minecraft Version */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minecraft Version ⛏️
                      </label>
                      <select {...register('gameVersion')} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white" disabled={versionsLoading}>
                        <option value="">Select Minecraft Version</option>
                        {versionsLoading ? (
                          <option disabled>Loading versions...</option>
                        ) : (
                          <>
                            <optgroup label="🌟 Recommended">
                              {availableVersions.filter(v => v.recommended).map((version) => (
                                <option key={version.id} value={version.id}>
                                  {version.name} - {version.description}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="📦 Latest Releases">
                              {availableVersions.filter(v => v.type === 'release' && !v.recommended).map((version) => (
                                <option key={version.id} value={version.id}>
                                  {version.name} - {version.description}
                                </option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>

                    {/* Server Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Server Type 🚀
                      </label>
                      <select {...register('serverType')} className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white" disabled={serverTypesLoading}>
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
                          </>
                        )}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all"
                  >
                    ← Zurück
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-4 rounded-lg font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center space-x-2 ${
                      isSimpleMode
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                    disabled={createServerMutation.isPending}
                  >
                    {createServerMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>{isSimpleMode ? 'Erstelle Server...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <span>{isSimpleMode ? '🎉 Server erstellen!' : '🚀 Create Server'}</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateServerModalNew
