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
  emoji: string
  description: string
  supportsPlugins: boolean
  supportsMods: boolean
  modLoaderType?: 'forge' | 'fabric' | 'quilt'
}

export const MINECRAFT_VERSIONS: MinecraftVersion[] = [
  // Latest Releases (1.21.x - Tricky Trials)
  {
    id: '1.21.10',
    name: '1.21.10',
    type: 'release',
    recommended: true,
    description: 'Latest stable release - Best compatibility'
  },
  {
    id: '1.21.9',
    name: '1.21.9',
    type: 'release',
    description: 'Bug fixes and performance improvements'
  },
  {
    id: '1.21.8',
    name: '1.21.8',
    type: 'release',
    description: 'Stability improvements'
  },
  {
    id: '1.21.7',
    name: '1.21.7',
    type: 'release',
    description: 'Bug fixes'
  },
  {
    id: '1.21.6',
    name: '1.21.6',
    type: 'release',
    description: 'Performance updates'
  },
  {
    id: '1.21.5',
    name: '1.21.5',
    type: 'release',
    description: 'Stability improvements'
  },
  {
    id: '1.21.4',
    name: '1.21.4',
    type: 'release',
    description: 'Winter Drop - Bug fixes'
  },
  {
    id: '1.21.3',
    name: '1.21.3',
    type: 'release',
    description: 'Bug fixes and improvements'
  },
  {
    id: '1.21.2',
    name: '1.21.2',
    type: 'release',
    description: 'Stable release'
  },
  {
    id: '1.21.1',
    name: '1.21.1',
    type: 'release',
    description: 'Tricky Trials - Very stable'
  },
  {
    id: '1.21',
    name: '1.21.0',
    type: 'release',
    description: 'Tricky Trials Update'
  },

  // 1.20.x Releases - Trails & Tales
  {
    id: '1.20.6',
    name: '1.20.6',
    type: 'release',
    description: 'Armored Paws Update'
  },
  {
    id: '1.20.5',
    name: '1.20.5',
    type: 'release',
    description: 'Bug fixes and improvements'
  },
  {
    id: '1.20.4',
    name: '1.20.4',
    type: 'release',
    description: 'Trails & Tales - Stable for plugins'
  },
  {
    id: '1.20.3',
    name: '1.20.3',
    type: 'release',
    description: 'Performance improvements'
  },
  {
    id: '1.20.2',
    name: '1.20.2',
    type: 'release',
    description: 'Bug fixes and stability'
  },
  {
    id: '1.20.1',
    name: '1.20.1',
    type: 'release',
    description: 'Very popular for modded servers'
  },
  {
    id: '1.20',
    name: '1.20.0',
    type: 'release',
    description: 'Trails & Tales major update'
  },

  // 1.19.x Releases - The Wild Update
  {
    id: '1.19.4',
    name: '1.19.4',
    type: 'release',
    description: 'Wild Update - Excellent plugin stability'
  },
  {
    id: '1.19.3',
    name: '1.19.3',
    type: 'release',
    description: 'Creative inventory improvements'
  },
  {
    id: '1.19.2',
    name: '1.19.2',
    type: 'release',
    description: 'Great mod support and stability'
  },
  {
    id: '1.19.1',
    name: '1.19.1',
    type: 'release',
    description: 'Bug fixes for The Wild Update'
  },
  {
    id: '1.19',
    name: '1.19.0',
    type: 'release',
    description: 'The Wild Update - Deep Dark'
  },

  // 1.18.x Releases - Caves & Cliffs Part II
  {
    id: '1.18.2',
    name: '1.18.2',
    type: 'release',
    description: 'Caves & Cliffs Part II - Very stable'
  },
  {
    id: '1.18.1',
    name: '1.18.1',
    type: 'release',
    description: 'Bug fixes and improvements'
  },
  {
    id: '1.18',
    name: '1.18.0',
    type: 'release',
    description: 'Caves & Cliffs Part II - New world height'
  },

  // 1.17.x Releases - Caves & Cliffs Part I
  {
    id: '1.17.1',
    name: '1.17.1',
    type: 'release',
    description: 'Caves & Cliffs Part I - Stable'
  },
  {
    id: '1.17',
    name: '1.17.0',
    type: 'release',
    description: 'Caves & Cliffs Part I'
  },

  // 1.16.x Releases - Nether Update
  {
    id: '1.16.5',
    name: '1.16.5',
    type: 'release',
    description: 'Nether Update - Still very popular for mods'
  },
  {
    id: '1.16.4',
    name: '1.16.4',
    type: 'release',
    description: 'Social interactions screen'
  },
  {
    id: '1.16.3',
    name: '1.16.3',
    type: 'release',
    description: 'Bug fixes'
  },
  {
    id: '1.16.2',
    name: '1.16.2',
    type: 'release',
    description: 'Piglin brute added'
  },
  {
    id: '1.16.1',
    name: '1.16.1',
    type: 'release',
    description: 'Bug fixes for Nether Update'
  },

  // 1.15.x Releases - Buzzy Bees
  {
    id: '1.15.2',
    name: '1.15.2',
    type: 'legacy',
    description: 'Buzzy Bees - Good performance'
  },
  {
    id: '1.15.1',
    name: '1.15.1',
    type: 'legacy',
    description: 'Bug fixes'
  },

  // 1.14.x Releases - Village & Pillage
  {
    id: '1.14.4',
    name: '1.14.4',
    type: 'legacy',
    description: 'Village & Pillage - Most stable'
  },
  {
    id: '1.14.3',
    name: '1.14.3',
    type: 'legacy',
    description: 'Bug fixes'
  },
  {
    id: '1.14.2',
    name: '1.14.2',
    type: 'legacy',
    description: 'Performance improvements'
  },
  {
    id: '1.14.1',
    name: '1.14.1',
    type: 'legacy',
    description: 'Bug fixes'
  },
  {
    id: '1.14',
    name: '1.14.0',
    type: 'legacy',
    description: 'Village & Pillage Update'
  },

  // 1.13.x Releases - Update Aquatic
  {
    id: '1.13.2',
    name: '1.13.2',
    type: 'legacy',
    description: 'Update Aquatic - Most stable'
  },
  {
    id: '1.13.1',
    name: '1.13.1',
    type: 'legacy',
    description: 'Bug fixes'
  },
  {
    id: '1.13',
    name: '1.13.0',
    type: 'legacy',
    description: 'Update Aquatic - Dolphins and underwater features'
  },

  // 1.12.x Releases - World of Color
  {
    id: '1.12.2',
    name: '1.12.2',
    type: 'legacy',
    description: 'Legendary mod ecosystem - Most popular legacy version'
  },
  {
    id: '1.12.1',
    name: '1.12.1',
    type: 'legacy',
    description: 'Bug fixes'
  },
  {
    id: '1.12',
    name: '1.12.0',
    type: 'legacy',
    description: 'World of Color Update'
  },

  // 1.11.x Releases - Exploration Update
  {
    id: '1.11.2',
    name: '1.11.2',
    type: 'legacy',
    description: 'Exploration Update'
  },

  // 1.10.x Releases - Frostburn Update
  {
    id: '1.10.2',
    name: '1.10.2',
    type: 'legacy',
    description: 'Frostburn Update'
  },

  // 1.9.x Releases - Combat Update
  {
    id: '1.9.4',
    name: '1.9.4',
    type: 'legacy',
    description: 'Combat Update'
  },

  // 1.8.x Releases - Bountiful Update
  {
    id: '1.8.9',
    name: '1.8.9',
    type: 'legacy',
    description: 'Classic PvP version - Still popular for minigames'
  },
  {
    id: '1.8.8',
    name: '1.8.8',
    type: 'legacy',
    description: 'Bountiful Update'
  }
]

export const SERVER_TYPES: ServerType[] = [
  {
    id: 'vanilla',
    name: 'Vanilla',
    emoji: '🧱',
    description: 'Pure Minecraft experience - no modifications',
    supportsPlugins: false,
    supportsMods: false
  },
  {
    id: 'paper',
    name: 'Paper',
    emoji: '📜',
    description: 'High-performance with plugin support (recommended)',
    supportsPlugins: true,
    supportsMods: false
  },
  {
    id: 'spigot',
    name: 'Spigot',
    emoji: '🔧',
    description: 'Plugin-friendly with good performance',
    supportsPlugins: true,
    supportsMods: false
  },
  {
    id: 'fabric',
    name: 'Fabric',
    emoji: '🧵',
    description: 'Modern, lightweight mod loader',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'fabric'
  },
  {
    id: 'forge',
    name: 'Forge',
    emoji: '⚒️',
    description: 'Classic mod loader with huge mod ecosystem',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'forge'
  },
  {
    id: 'quilt',
    name: 'Quilt',
    emoji: '🪡',
    description: 'Fabric fork with enhanced features',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: 'quilt'
  }
]

// Helper functions
export const getRecommendedVersion = (): MinecraftVersion => {
  return MINECRAFT_VERSIONS.find(v => v.recommended) || MINECRAFT_VERSIONS[0]
}

export const getVersionsByType = (type: MinecraftVersion['type']) => {
  return MINECRAFT_VERSIONS.filter(v => v.type === type)
}

export const getCompatibleVersions = (serverType: string): MinecraftVersion[] => {
  // Some server types have version restrictions
  if (serverType === 'forge') {
    // Forge might not be available for the newest versions immediately
    return MINECRAFT_VERSIONS.filter(v => !['1.21.4', '1.21.3'].includes(v.id))
  }

  return MINECRAFT_VERSIONS
}

export const isValidMinecraftVersion = (version: string): boolean => {
  return MINECRAFT_VERSIONS.some(v => v.id === version)
}