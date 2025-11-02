// Server Templates inspired by Aternos and Minehut
export interface ServerTemplate {
  id: string
  name: string
  emoji: string
  description: string
  category: 'survival' | 'creative' | 'minigames' | 'modded' | 'adventure'
  recommendedVersion: string
  recommendedServerType: string
  features: string[]
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard'
  gameMode?: 'survival' | 'creative' | 'adventure'
  preInstalledPlugins?: string[]
  worldType?: 'default' | 'flat' | 'large_biomes' | 'amplified'
}

export const SERVER_TEMPLATES: ServerTemplate[] = [
  // Survival Templates
  {
    id: 'vanilla-survival',
    name: 'Vanilla Survival',
    emoji: '⛏️',
    description: 'Classic Minecraft survival experience - pure and simple',
    category: 'survival',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    difficulty: 'normal',
    gameMode: 'survival',
    worldType: 'default',
    features: [
      'Pure vanilla gameplay',
      'No modifications',
      'Classic survival',
      'Perfect for beginners'
    ]
  },
  {
    id: 'enhanced-survival',
    name: 'Enhanced Survival',
    emoji: '🎮',
    description: 'Survival with quality of life plugins for better gameplay',
    category: 'survival',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    difficulty: 'normal',
    gameMode: 'survival',
    preInstalledPlugins: ['EssentialsX', 'WorldEdit', 'CoreProtect'],
    features: [
      'Home & warps',
      'Economy system',
      'Land protection',
      'Better commands',
      'Grief protection'
    ]
  },
  {
    id: 'hardcore-survival',
    name: 'Hardcore Survival',
    emoji: '💀',
    description: 'Extreme difficulty for experienced players',
    category: 'survival',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    difficulty: 'hard',
    gameMode: 'survival',
    features: [
      'Hard difficulty',
      'Permanent death',
      'Limited resources',
      'Challenging gameplay'
    ]
  },
  {
    id: 'skyblock',
    name: 'Skyblock',
    emoji: '☁️',
    description: 'Start on a small island in the sky and expand',
    category: 'survival',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    gameMode: 'survival',
    worldType: 'flat',
    preInstalledPlugins: ['ASkyBlock', 'EssentialsX'],
    features: [
      'Island challenges',
      'Economy system',
      'PvP arenas',
      'Custom shops',
      'Leaderboards'
    ]
  },

  // Creative Templates
  {
    id: 'creative-building',
    name: 'Creative Building',
    emoji: '🏗️',
    description: 'Unlimited resources for your architectural masterpieces',
    category: 'creative',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    gameMode: 'creative',
    preInstalledPlugins: ['WorldEdit', 'VoxelSniper'],
    features: [
      'WorldEdit tools',
      'Plot system',
      'Unlimited blocks',
      'Flying enabled',
      'Advanced building tools'
    ]
  },
  {
    id: 'creative-plots',
    name: 'Creative Plots',
    emoji: '📐',
    description: 'Individual plots for players to build on',
    category: 'creative',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    gameMode: 'creative',
    worldType: 'flat',
    preInstalledPlugins: ['PlotSquared', 'WorldEdit'],
    features: [
      'Personal plots',
      'Plot management',
      'WorldEdit',
      'Plot ratings',
      'Plot homes'
    ]
  },

  // Minigames Templates
  {
    id: 'pvp-arena',
    name: 'PvP Arena',
    emoji: '⚔️',
    description: 'Competitive player vs player combat',
    category: 'minigames',
    recommendedVersion: '1.8.9',
    recommendedServerType: 'spigot',
    preInstalledPlugins: ['KitPvP', 'Multiverse'],
    features: [
      'Multiple arenas',
      'Kit selection',
      'Leaderboards',
      'Kill tracking',
      'Custom kits'
    ]
  },
  {
    id: 'bedwars',
    name: 'BedWars',
    emoji: '🛏️',
    description: 'Popular team-based strategy minigame',
    category: 'minigames',
    recommendedVersion: '1.8.9',
    recommendedServerType: 'spigot',
    preInstalledPlugins: ['BedWars1058'],
    features: [
      'Team gameplay',
      'Multiple maps',
      'Upgrades shop',
      'Spectator mode',
      'Statistics'
    ]
  },
  {
    id: 'spleef',
    name: 'Spleef Arena',
    emoji: '❄️',
    description: 'Classic Spleef minigame - break blocks beneath players',
    category: 'minigames',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    features: [
      'Multiple arenas',
      'Queue system',
      'Rewards',
      'Leaderboards'
    ]
  },

  // Modded Templates
  {
    id: 'forge-modded',
    name: 'Forge Modpack',
    emoji: '⚒️',
    description: 'Server ready for Forge mods',
    category: 'modded',
    recommendedVersion: '1.20.1',
    recommendedServerType: 'forge',
    features: [
      'Forge mod support',
      'Mod compatibility',
      'Large mod ecosystem',
      'Tech & magic mods'
    ]
  },
  {
    id: 'fabric-modded',
    name: 'Fabric Modpack',
    emoji: '🧵',
    description: 'Lightweight modern mod loader',
    category: 'modded',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'fabric',
    features: [
      'Fabric mod support',
      'Better performance',
      'Modern mods',
      'Quick updates'
    ]
  },
  {
    id: 'tech-modpack',
    name: 'Tech & Engineering',
    emoji: '🔧',
    description: 'Industrial mods with machines and automation',
    category: 'modded',
    recommendedVersion: '1.20.1',
    recommendedServerType: 'forge',
    features: [
      'Industrial machines',
      'Energy systems',
      'Automation',
      'Tech mods',
      'Engineering challenges'
    ]
  },
  {
    id: 'magic-modpack',
    name: 'Magic & Wizardry',
    emoji: '🔮',
    description: 'Magical mods with spells and mystical items',
    category: 'modded',
    recommendedVersion: '1.20.1',
    recommendedServerType: 'forge',
    features: [
      'Magic spells',
      'Enchantments',
      'Mystical items',
      'Magical dimensions',
      'Wizardry'
    ]
  },

  // Adventure Templates
  {
    id: 'rpg-adventure',
    name: 'RPG Adventure',
    emoji: '🗡️',
    description: 'Role-playing server with quests and classes',
    category: 'adventure',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    preInstalledPlugins: ['McMMO', 'Quests', 'Jobs'],
    features: [
      'Custom quests',
      'Class system',
      'Skills & leveling',
      'Custom items',
      'Economy'
    ]
  },
  {
    id: 'adventure-map',
    name: 'Adventure Map',
    emoji: '🗺️',
    description: 'Custom adventure maps and parkour',
    category: 'adventure',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    gameMode: 'adventure',
    features: [
      'Custom maps',
      'Parkour courses',
      'Puzzle challenges',
      'Story mode',
      'Checkpoints'
    ]
  },
  {
    id: 'prison-server',
    name: 'Prison Server',
    emoji: '⛓️',
    description: 'Rankup prison server with mining',
    category: 'adventure',
    recommendedVersion: '1.21.10',
    recommendedServerType: 'paper',
    preInstalledPlugins: ['Prison', 'EssentialsX'],
    features: [
      'Mine & rankup',
      'Custom mines',
      'Economy',
      'Prestige system',
      'PvP zones'
    ]
  }
]

// Template Categories
export const TEMPLATE_CATEGORIES = [
  { id: 'survival', name: 'Survival', emoji: '⛏️', description: 'Classic survival gameplay' },
  { id: 'creative', name: 'Creative', emoji: '🏗️', description: 'Build without limits' },
  { id: 'minigames', name: 'Minigames', emoji: '🎯', description: 'Fun competitive games' },
  { id: 'modded', name: 'Modded', emoji: '⚒️', description: 'Enhanced with mods' },
  { id: 'adventure', name: 'Adventure', emoji: '🗺️', description: 'RPG and custom maps' }
]

// Get templates by category
export const getTemplatesByCategory = (category: string): ServerTemplate[] => {
  return SERVER_TEMPLATES.filter(t => t.category === category)
}

// Get template by ID
export const getTemplateById = (id: string): ServerTemplate | undefined => {
  return SERVER_TEMPLATES.find(t => t.id === id)
}

// Get recommended template
export const getRecommendedTemplate = (): ServerTemplate => {
  return SERVER_TEMPLATES[0] // Vanilla Survival as default
}
