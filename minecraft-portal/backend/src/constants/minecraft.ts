export interface MinecraftVersion {
  id: string
  name: string
  type: 'release' | 'snapshot' | 'legacy'
  recommended?: boolean
  description?: string
}

export interface ServerType {
  id: string
  name: string
  description: string
  supportsPlugins: boolean
  supportsMods: boolean
  modLoaderType?: 'forge' | 'fabric' | 'quilt'
}

export const MINECRAFT_VERSIONS: MinecraftVersion[] = [
  {
    id: '1.21.1',
    name: '1.21.1',
    type: 'release',
    recommended: true,
    description: 'Latest stable release'
  },
  {
    id: '1.21.0',
    name: '1.21.0',
    type: 'release',
    description: 'Tricky Trials Update'
  },
  {
    id: '1.20.6',
    name: '1.20.6',
    type: 'release',
    description: 'Armored Paws Update'
  },
  {
    id: '1.20.4',
    name: '1.20.4',
    type: 'release',
    description: 'Trails & Tales Update'
  },
  {
    id: '1.20.1',
    name: '1.20.1',
    type: 'release',
    description: 'Popular for modded servers'
  },
  {
    id: '1.19.4',
    name: '1.19.4',
    type: 'release',
    description: 'Wild Update - Stable for plugins'
  },
  {
    id: '1.19.2',
    name: '1.19.2',
    type: 'release',
    description: 'Great mod support'
  },
  {
    id: '1.18.2',
    name: '1.18.2',
    type: 'release',
    description: 'Caves & Cliffs Part II'
  },
  {
    id: '1.16.5',
    name: '1.16.5',
    type: 'release',
    description: 'Nether Update - Still popular'
  },
  {
    id: '1.12.2',
    name: '1.12.2',
    type: 'legacy',
    description: 'Legacy version with huge mod ecosystem'
  },
  {
    id: '1.8.9',
    name: '1.8.9',
    type: 'legacy',
    description: 'Classic PvP version'
  }
]

export const SERVER_TYPES: ServerType[] = [
  {
    id: 'vanilla',
    name: 'Vanilla',
    description: 'Pure Minecraft experience - no modifications',
    supportsPlugins: false,
    supportsMods: false
  },
  {
    id: 'paper',
    name: 'Paper',
    description: 'High-performance with plugin support (recommended)',
    supportsPlugins: true,
    supportsMods: false
  },
  {
    id: 'spigot',
    name: 'Spigot',
    description: 'Plugin-friendly with good performance',
    supportsPlugins: true,
    supportsMods: false
  },
  {
    id: 'fabric',
    name: 'Fabric',
    description: 'Modern, lightweight mod loader',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'fabric'
  },
  {
    id: 'forge',
    name: 'Forge',
    description: 'Classic mod loader with huge mod ecosystem',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'forge'
  },
  {
    id: 'quilt',
    name: 'Quilt',
    description: 'Fabric fork with enhanced features',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'quilt'
  }
]

// Helper functions
export const getValidVersionIds = (): string[] => {
  return MINECRAFT_VERSIONS.map(v => v.id)
}

export const getValidServerTypeIds = (): string[] => {
  return SERVER_TYPES.map(t => t.id)
}

export const isValidMinecraftVersion = (version: string): boolean => {
  return MINECRAFT_VERSIONS.some(v => v.id === version)
}

export const isValidServerType = (serverType: string): boolean => {
  return SERVER_TYPES.some(t => t.id === serverType)
}

export const getRecommendedVersion = (): MinecraftVersion => {
  return MINECRAFT_VERSIONS.find(v => v.recommended) || MINECRAFT_VERSIONS[0]
}