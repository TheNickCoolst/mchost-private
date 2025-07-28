import { AppDataSource } from '../config/database';
import { Plugin, PluginCategory } from '../models/Plugin';

const popularPlugins = [
  {
    name: 'essentialsx',
    displayName: 'EssentialsX',
    description: 'The essential plugin for managing your server with over 100 commands and features.',
    author: 'EssentialsX Team',
    version: '2.20.1',
    category: PluginCategory.ADMIN,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://github.com/EssentialsX/Essentials/releases',
    websiteUrl: 'https://essentialsx.net/',
    sourceUrl: 'https://github.com/EssentialsX/Essentials',
    downloads: 500000,
    rating: 4.8,
    ratingCount: 2500,
    isPopular: true,
    isFeatured: true,
    configTemplate: {
      'spawn-on-join': true,
      'change-displayname': true,
      'disable-prefix': false
    }
  },
  {
    name: 'worldedit',
    displayName: 'WorldEdit',
    description: 'World editing and manipulation tool for creative and survival modes.',
    author: 'EngineHub',
    version: '7.2.18',
    category: PluginCategory.BUILDING,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/worldedit',
    websiteUrl: 'https://worldedit.enginehub.org/',
    sourceUrl: 'https://github.com/EngineHub/WorldEdit',
    downloads: 300000,
    rating: 4.9,
    ratingCount: 1800,
    isPopular: true,
    isFeatured: true
  },
  {
    name: 'worldguard',
    displayName: 'WorldGuard',
    description: 'Protect your worlds and regions from griefing and unwanted destruction.',
    author: 'EngineHub',
    version: '7.0.9',
    category: PluginCategory.PROTECTION,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/worldguard',
    websiteUrl: 'https://worldguard.enginehub.org/',
    sourceUrl: 'https://github.com/EngineHub/WorldGuard',
    downloads: 280000,
    rating: 4.7,
    ratingCount: 1500,
    isPopular: true,
    dependencies: ['worldedit']
  },
  {
    name: 'luckperms',
    displayName: 'LuckPerms',
    description: 'Advanced permissions plugin with web interface and extensive features.',
    author: 'Luck',
    version: '5.4.131',
    category: PluginCategory.ADMIN,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://luckperms.net/download',
    websiteUrl: 'https://luckperms.net/',
    sourceUrl: 'https://github.com/LuckPerms/LuckPerms',
    downloads: 400000,
    rating: 4.9,
    ratingCount: 2200,
    isPopular: true,
    isFeatured: true
  },
  {
    name: 'vault',
    displayName: 'Vault',
    description: 'Permission, chat, & economy API to give plugins easy hooks into these systems.',
    author: 'MilkBowl',
    version: '1.7.3',
    category: PluginCategory.UTILITY,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/vault',
    websiteUrl: 'https://dev.bukkit.org/projects/vault',
    downloads: 600000,
    rating: 4.6,
    ratingCount: 1200,
    isPopular: true
  },
  {
    name: 'dynmap',
    displayName: 'Dynmap',
    description: 'Live web-based maps for your Minecraft server.',
    author: 'mikeprimm',
    version: '3.7',
    category: PluginCategory.UTILITY,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/dynmap',
    websiteUrl: 'https://github.com/webbukkit/dynmap',
    sourceUrl: 'https://github.com/webbukkit/dynmap',
    downloads: 200000,
    rating: 4.5,
    ratingCount: 800,
    isPopular: true
  },
  {
    name: 'citizens',
    displayName: 'Citizens',
    description: 'The original NPC plugin for Bukkit servers.',
    author: 'fullwall',
    version: '2.0.35',
    category: PluginCategory.FUN,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/citizens',
    websiteUrl: 'https://citizensnpcs.co/',
    downloads: 150000,
    rating: 4.4,
    ratingCount: 600
  },
  {
    name: 'mcmmo',
    displayName: 'mcMMO',
    description: 'RPG skills and leveling system for Minecraft.',
    author: 'nossr50',
    version: '2.2.0',
    category: PluginCategory.FUN,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://www.spigotmc.org/resources/mcmmo.64348/',
    websiteUrl: 'https://mcmmo.org/',
    sourceUrl: 'https://github.com/mcMMO-Dev/mcMMO',
    downloads: 180000,
    rating: 4.3,
    ratingCount: 900
  },
  {
    name: 'griefprevention',
    displayName: 'GriefPrevention',
    description: 'Prevents grief with easy-to-use claim system.',
    author: 'RoboMWM',
    version: '16.18.4',
    category: PluginCategory.PROTECTION,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/grief-prevention',
    websiteUrl: 'https://docs.griefprevention.com/',
    downloads: 120000,
    rating: 4.2,
    ratingCount: 500
  },
  {
    name: 'shopkeepers',
    displayName: 'Shopkeepers',
    description: 'Create player and admin shops using villagers.',
    author: 'blablubbabc',
    version: '2.18.0',
    category: PluginCategory.ECONOMY,
    supportedVersions: ['1.21.1', '1.21.0', '1.20.6', '1.20.4', '1.20.1', '1.19.4'],
    supportedServerTypes: ['paper', 'spigot'],
    downloadUrl: 'https://dev.bukkit.org/projects/shopkeepers',
    downloads: 80000,
    rating: 4.1,
    ratingCount: 300,
    dependencies: ['vault']
  }
];

export async function seedPlugins() {
  console.log('🔌 Seeding popular plugins...');

  try {
    const pluginRepository = AppDataSource.getRepository(Plugin);

    for (const pluginData of popularPlugins) {
      const existingPlugin = await pluginRepository.findOne({
        where: { name: pluginData.name }
      });

      if (!existingPlugin) {
        const plugin = pluginRepository.create(pluginData);
        await pluginRepository.save(plugin);
        console.log(`✅ Added plugin: ${pluginData.displayName}`);
      } else {
        // Update existing plugin with new data
        Object.assign(existingPlugin, pluginData);
        await pluginRepository.save(existingPlugin);
        console.log(`🔄 Updated plugin: ${pluginData.displayName}`);
      }
    }

    console.log('✅ Plugin seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding plugins:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedPlugins();
      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection failed:', error);
      process.exit(1);
    });
}