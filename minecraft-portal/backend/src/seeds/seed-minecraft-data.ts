import { AppDataSource } from '../config/database';
import { MinecraftVersion, VersionType } from '../models/MinecraftVersion';
import { ServerType, ModLoaderType } from '../models/ServerType';

const minecraftVersions = [
  {
    versionId: '1.21.1',
    name: '1.21.1',
    type: VersionType.RELEASE,
    recommended: true,
    description: 'Latest stable release',
    releaseDate: new Date('2024-08-08')
  },
  {
    versionId: '1.21.0',
    name: '1.21.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Tricky Trials Update',
    releaseDate: new Date('2024-06-13')
  },
  {
    versionId: '1.20.6',
    name: '1.20.6',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Armored Paws Update',
    releaseDate: new Date('2024-04-29')
  },
  {
    versionId: '1.20.4',
    name: '1.20.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Trails & Tales Update',
    releaseDate: new Date('2023-12-07')
  },
  {
    versionId: '1.20.1',
    name: '1.20.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Popular for modded servers',
    releaseDate: new Date('2023-06-12')
  },
  {
    versionId: '1.19.4',
    name: '1.19.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Wild Update - Stable for plugins',
    releaseDate: new Date('2023-03-14')
  },
  {
    versionId: '1.19.2',
    name: '1.19.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Great mod support',
    releaseDate: new Date('2022-08-05')
  },
  {
    versionId: '1.18.2',
    name: '1.18.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Caves & Cliffs Part II',
    releaseDate: new Date('2022-02-28')
  },
  {
    versionId: '1.16.5',
    name: '1.16.5',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Nether Update - Still popular',
    releaseDate: new Date('2021-01-15')
  },
  {
    versionId: '1.12.2',
    name: '1.12.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Legacy version with huge mod ecosystem',
    releaseDate: new Date('2017-09-18')
  },
  {
    versionId: '1.8.9',
    name: '1.8.9',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Classic PvP version',
    releaseDate: new Date('2015-12-09')
  }
];

const serverTypes = [
  {
    typeId: 'paper',
    name: 'Paper',
    description: 'High-performance with plugin support (recommended)',
    supportsPlugins: true,
    supportsMods: false,
    sortOrder: 1,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  },
  {
    typeId: 'spigot',
    name: 'Spigot',
    description: 'Plugin-friendly with good performance',
    supportsPlugins: true,
    supportsMods: false,
    sortOrder: 2,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  },
  {
    typeId: 'vanilla',
    name: 'Vanilla',
    description: 'Pure Minecraft experience - no modifications',
    supportsPlugins: false,
    supportsMods: false,
    sortOrder: 3,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  },
  {
    typeId: 'fabric',
    name: 'Fabric',
    description: 'Modern, lightweight mod loader',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: ModLoaderType.FABRIC,
    sortOrder: 4,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  },
  {
    typeId: 'forge',
    name: 'Forge',
    description: 'Classic mod loader with huge mod ecosystem',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: ModLoaderType.FORGE,
    sortOrder: 5,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  },
  {
    typeId: 'quilt',
    name: 'Quilt',
    description: 'Fabric fork with enhanced features',
    supportsPlugins: false,
    supportsMods: true,
    modLoaderType: ModLoaderType.QUILT,
    sortOrder: 6,
    dockerImage: 'itzg/minecraft-server:java17-alpine'
  }
];

export async function seedMinecraftData() {
  console.log('🌱 Seeding Minecraft versions and server types...');

  try {
    const versionRepository = AppDataSource.getRepository(MinecraftVersion);
    const serverTypeRepository = AppDataSource.getRepository(ServerType);

    // Seed Minecraft versions
    for (const versionData of minecraftVersions) {
      const existingVersion = await versionRepository.findOne({
        where: { versionId: versionData.versionId }
      });

      if (!existingVersion) {
        const version = versionRepository.create(versionData);
        await versionRepository.save(version);
        console.log(`✅ Added Minecraft version: ${versionData.versionId}`);
      } else {
        // Update existing version with new data
        Object.assign(existingVersion, versionData);
        await versionRepository.save(existingVersion);
        console.log(`🔄 Updated Minecraft version: ${versionData.versionId}`);
      }
    }

    // Seed server types
    for (const typeData of serverTypes) {
      const existingType = await serverTypeRepository.findOne({
        where: { typeId: typeData.typeId }
      });

      if (!existingType) {
        const serverType = serverTypeRepository.create(typeData);
        await serverTypeRepository.save(serverType);
        console.log(`✅ Added server type: ${typeData.typeId}`);
      } else {
        // Update existing type with new data
        Object.assign(existingType, typeData);
        await serverTypeRepository.save(existingType);
        console.log(`🔄 Updated server type: ${typeData.typeId}`);
      }
    }

    console.log('✅ Minecraft data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding Minecraft data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  AppDataSource.initialize()
    .then(async () => {
      await seedMinecraftData();
      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database connection failed:', error);
      process.exit(1);
    });
}