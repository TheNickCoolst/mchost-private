import { ServerInstance } from '../models/ServerInstance';

// Map technical terms to user-friendly language
const SERVER_TYPE_LABELS: Record<string, string> = {
  'vanilla': 'Minecraft (Vanilla)',
  'bukkit': 'Bukkit Server',
  'spigot': 'Spigot Server',
  'paper': 'Paper Server',
  'fabric': 'Fabric Server',
  'forge': 'Minecraft Forge',
  'mohist': 'Mohist (Forge + Bukkit)',
  'purpur': 'Purpur Server'
};

const STATUS_LABELS: Record<string, string> = {
  'running': 'Online',
  'stopped': 'Offline',
  'starting': 'Starting...',
  'stopping': 'Stopping...',
  'error': 'Error'
};

const STATUS_COLORS: Record<string, string> = {
  'running': 'success',
  'stopped': 'secondary',
  'starting': 'warning',
  'stopping': 'warning',
  'error': 'danger'
};

export interface UserFriendlyServer {
  id: string;
  name: string;
  description?: string;
  serverType: string;
  serverTypeLabel: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  resourceLimits: {
    memory: number;
    cpu: number;
    disk: number;
    swap: number;
    io: number;
  };
  gameVersion: string;
  port: number;
  maxPlayers: number;
  onlinePlayers?: number;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    username: string;
  };
}

export function transformServerForUser(server: ServerInstance): UserFriendlyServer {
  return {
    id: server.id,
    name: server.name,
    description: server.description,
    serverType: server.egg,
    serverTypeLabel: SERVER_TYPE_LABELS[server.egg] || server.egg,
    status: server.status,
    statusLabel: STATUS_LABELS[server.status] || server.status,
    statusColor: STATUS_COLORS[server.status] || 'secondary',
    resourceLimits: server.resourceLimits,
    gameVersion: server.gameVersion,
    port: server.port,
    maxPlayers: (server.serverProperties?.['max-players'] as number) || 20,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    owner: server.owner ? {
      id: server.owner.id,
      username: server.owner.username
    } : undefined
  };
}

export function transformServersForUser(servers: ServerInstance[]): UserFriendlyServer[] {
  return servers.map(transformServerForUser);
}

// Transform configuration property names to user-friendly labels
export const CONFIG_LABELS: Record<string, { label: string; description: string; category: string }> = {
  'server-name': {
    label: 'Server Name',
    description: 'The name of your server (shown in server list)',
    category: 'General'
  },
  'server-port': {
    label: 'Server Port',
    description: 'The port players connect to (usually 25565)',
    category: 'Network'
  },
  'max-players': {
    label: 'Maximum Players',
    description: 'Maximum number of players allowed on the server',
    category: 'General'
  },
  'online-mode': {
    label: 'Online Mode',
    description: 'Require players to have valid Minecraft accounts (recommended)',
    category: 'Security'
  },
  'white-list': {
    label: 'Whitelist',
    description: 'Only allow whitelisted players to join',
    category: 'Security'
  },
  'pvp': {
    label: 'Player vs Player',
    description: 'Allow players to attack each other',
    category: 'Gameplay'
  },
  'difficulty': {
    label: 'Difficulty',
    description: 'Game difficulty (peaceful, easy, normal, hard)',
    category: 'Gameplay'
  },
  'gamemode': {
    label: 'Default Game Mode',
    description: 'Default game mode for new players',
    category: 'Gameplay'
  },
  'hardcore': {
    label: 'Hardcore Mode',
    description: 'Players are banned when they die',
    category: 'Gameplay'
  },
  'allow-flight': {
    label: 'Allow Flight',
    description: 'Allow players to fly in survival mode',
    category: 'Gameplay'
  },
  'spawn-protection': {
    label: 'Spawn Protection',
    description: 'Radius around spawn where only ops can build',
    category: 'World'
  },
  'view-distance': {
    label: 'View Distance',
    description: 'How far players can see (affects performance)',
    category: 'Performance'
  },
  'level-name': {
    label: 'World Name',
    description: 'Name of the world folder',
    category: 'World'
  },
  'level-seed': {
    label: 'World Seed',
    description: 'Seed for world generation (leave empty for random)',
    category: 'World'
  },
  'level-type': {
    label: 'World Type',
    description: 'Type of world to generate',
    category: 'World'
  },
  'generate-structures': {
    label: 'Generate Structures',
    description: 'Generate villages, dungeons, etc.',
    category: 'World'
  },
  'spawn-npcs': {
    label: 'Spawn Villagers',
    description: 'Allow villagers to spawn',
    category: 'World'
  },
  'spawn-animals': {
    label: 'Spawn Animals',
    description: 'Allow peaceful animals to spawn',
    category: 'World'
  },
  'spawn-monsters': {
    label: 'Spawn Monsters',
    description: 'Allow hostile monsters to spawn',
    category: 'World'
  },
  'motd': {
    label: 'Message of the Day',
    description: 'Message shown in the server list',
    category: 'General'
  },
  'enable-command-block': {
    label: 'Enable Command Blocks',
    description: 'Allow command blocks to function',
    category: 'Advanced'
  },
  'enable-rcon': {
    label: 'Enable Remote Console',
    description: 'Allow remote console access',
    category: 'Advanced'
  }
};

export function getConfigLabel(key: string): string {
  return CONFIG_LABELS[key]?.label || key;
}

export function getConfigDescription(key: string): string {
  return CONFIG_LABELS[key]?.description || '';
}

export function getConfigCategory(key: string): string {
  return CONFIG_LABELS[key]?.category || 'Other';
}

// Group configuration by categories for better UX
export function groupConfigByCategory(config: Record<string, any>) {
  const categories: Record<string, Array<{ key: string; value: any; label: string; description: string }>> = {};

  Object.entries(config).forEach(([key, value]) => {
    const category = getConfigCategory(key);
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({
      key,
      value,
      label: getConfigLabel(key),
      description: getConfigDescription(key)
    });
  });

  return categories;
}