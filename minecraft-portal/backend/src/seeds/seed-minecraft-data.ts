import { AppDataSource } from '../config/database';
import { MinecraftVersion, VersionType } from '../models/MinecraftVersion';
import { ServerType, ModLoaderType } from '../models/ServerType';

const minecraftVersions = [
  // Latest Releases (1.21.x - Tricky Trials)
  {
    versionId: '1.21.10',
    name: '1.21.10',
    type: VersionType.RELEASE,
    recommended: true,
    description: 'Latest stable release - Best compatibility',
    releaseDate: new Date('2025-01-20')
  },
  {
    versionId: '1.21.9',
    name: '1.21.9',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes and performance improvements',
    releaseDate: new Date('2025-01-15')
  },
  {
    versionId: '1.21.8',
    name: '1.21.8',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Stability improvements',
    releaseDate: new Date('2025-01-10')
  },
  {
    versionId: '1.21.7',
    name: '1.21.7',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2025-01-05')
  },
  {
    versionId: '1.21.6',
    name: '1.21.6',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Performance updates',
    releaseDate: new Date('2024-12-20')
  },
  {
    versionId: '1.21.5',
    name: '1.21.5',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Stability improvements',
    releaseDate: new Date('2024-12-15')
  },
  {
    versionId: '1.21.4',
    name: '1.21.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Winter Drop - Bug fixes',
    releaseDate: new Date('2024-12-04')
  },
  {
    versionId: '1.21.3',
    name: '1.21.3',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes and improvements',
    releaseDate: new Date('2024-10-23')
  },
  {
    versionId: '1.21.2',
    name: '1.21.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Stable release',
    releaseDate: new Date('2024-10-23')
  },
  {
    versionId: '1.21.1',
    name: '1.21.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Tricky Trials - Very stable',
    releaseDate: new Date('2024-08-08')
  },
  {
    versionId: '1.21',
    name: '1.21.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Tricky Trials Update',
    releaseDate: new Date('2024-06-13')
  },

  // 1.20.x Releases - Trails & Tales
  {
    versionId: '1.20.6',
    name: '1.20.6',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Armored Paws Update',
    releaseDate: new Date('2024-04-29')
  },
  {
    versionId: '1.20.5',
    name: '1.20.5',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes and improvements',
    releaseDate: new Date('2024-04-23')
  },
  {
    versionId: '1.20.4',
    name: '1.20.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Trails & Tales - Stable for plugins',
    releaseDate: new Date('2023-12-07')
  },
  {
    versionId: '1.20.3',
    name: '1.20.3',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Performance improvements',
    releaseDate: new Date('2023-12-05')
  },
  {
    versionId: '1.20.2',
    name: '1.20.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes and stability',
    releaseDate: new Date('2023-09-21')
  },
  {
    versionId: '1.20.1',
    name: '1.20.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Very popular for modded servers',
    releaseDate: new Date('2023-06-12')
  },
  {
    versionId: '1.20',
    name: '1.20.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Trails & Tales major update',
    releaseDate: new Date('2023-06-07')
  },

  // 1.19.x Releases - The Wild Update
  {
    versionId: '1.19.4',
    name: '1.19.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Wild Update - Excellent plugin stability',
    releaseDate: new Date('2023-03-14')
  },
  {
    versionId: '1.19.3',
    name: '1.19.3',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Creative inventory improvements',
    releaseDate: new Date('2022-12-07')
  },
  {
    versionId: '1.19.2',
    name: '1.19.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Great mod support and stability',
    releaseDate: new Date('2022-08-05')
  },
  {
    versionId: '1.19.1',
    name: '1.19.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes for The Wild Update',
    releaseDate: new Date('2022-07-27')
  },
  {
    versionId: '1.19',
    name: '1.19.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'The Wild Update - Deep Dark',
    releaseDate: new Date('2022-06-07')
  },

  // 1.18.x Releases - Caves & Cliffs Part II
  {
    versionId: '1.18.2',
    name: '1.18.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Caves & Cliffs Part II - Very stable',
    releaseDate: new Date('2022-02-28')
  },
  {
    versionId: '1.18.1',
    name: '1.18.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes and improvements',
    releaseDate: new Date('2021-12-10')
  },
  {
    versionId: '1.18',
    name: '1.18.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Caves & Cliffs Part II - New world height',
    releaseDate: new Date('2021-11-30')
  },

  // 1.17.x Releases - Caves & Cliffs Part I
  {
    versionId: '1.17.1',
    name: '1.17.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Caves & Cliffs Part I - Stable',
    releaseDate: new Date('2021-07-06')
  },
  {
    versionId: '1.17',
    name: '1.17.0',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Caves & Cliffs Part I',
    releaseDate: new Date('2021-06-08')
  },

  // 1.16.x Releases - Nether Update
  {
    versionId: '1.16.5',
    name: '1.16.5',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Nether Update - Still very popular for mods',
    releaseDate: new Date('2021-01-15')
  },
  {
    versionId: '1.16.4',
    name: '1.16.4',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Social interactions screen',
    releaseDate: new Date('2020-11-02')
  },
  {
    versionId: '1.16.3',
    name: '1.16.3',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2020-09-10')
  },
  {
    versionId: '1.16.2',
    name: '1.16.2',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Piglin brute added',
    releaseDate: new Date('2020-08-11')
  },
  {
    versionId: '1.16.1',
    name: '1.16.1',
    type: VersionType.RELEASE,
    recommended: false,
    description: 'Bug fixes for Nether Update',
    releaseDate: new Date('2020-06-24')
  },

  // 1.15.x Releases - Buzzy Bees
  {
    versionId: '1.15.2',
    name: '1.15.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Buzzy Bees - Good performance',
    releaseDate: new Date('2020-01-21')
  },
  {
    versionId: '1.15.1',
    name: '1.15.1',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2019-12-17')
  },

  // 1.14.x Releases - Village & Pillage
  {
    versionId: '1.14.4',
    name: '1.14.4',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Village & Pillage - Most stable',
    releaseDate: new Date('2019-07-19')
  },
  {
    versionId: '1.14.3',
    name: '1.14.3',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2019-06-24')
  },
  {
    versionId: '1.14.2',
    name: '1.14.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Performance improvements',
    releaseDate: new Date('2019-05-27')
  },
  {
    versionId: '1.14.1',
    name: '1.14.1',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2019-05-13')
  },
  {
    versionId: '1.14',
    name: '1.14.0',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Village & Pillage Update',
    releaseDate: new Date('2019-04-23')
  },

  // 1.13.x Releases - Update Aquatic
  {
    versionId: '1.13.2',
    name: '1.13.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Update Aquatic - Most stable',
    releaseDate: new Date('2018-10-22')
  },
  {
    versionId: '1.13.1',
    name: '1.13.1',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2018-08-22')
  },
  {
    versionId: '1.13',
    name: '1.13.0',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Update Aquatic - Dolphins and underwater features',
    releaseDate: new Date('2018-07-18')
  },

  // 1.12.x Releases - World of Color
  {
    versionId: '1.12.2',
    name: '1.12.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Legendary mod ecosystem - Most popular legacy version',
    releaseDate: new Date('2017-09-18')
  },
  {
    versionId: '1.12.1',
    name: '1.12.1',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bug fixes',
    releaseDate: new Date('2017-08-03')
  },
  {
    versionId: '1.12',
    name: '1.12.0',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'World of Color Update',
    releaseDate: new Date('2017-06-07')
  },

  // 1.11.x Releases - Exploration Update
  {
    versionId: '1.11.2',
    name: '1.11.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Exploration Update',
    releaseDate: new Date('2016-12-21')
  },

  // 1.10.x Releases - Frostburn Update
  {
    versionId: '1.10.2',
    name: '1.10.2',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Frostburn Update',
    releaseDate: new Date('2016-06-23')
  },

  // 1.9.x Releases - Combat Update
  {
    versionId: '1.9.4',
    name: '1.9.4',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Combat Update',
    releaseDate: new Date('2016-05-10')
  },

  // 1.8.x Releases - Bountiful Update
  {
    versionId: '1.8.9',
    name: '1.8.9',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Classic PvP version - Still popular for minigames',
    releaseDate: new Date('2015-12-09')
  },
  {
    versionId: '1.8.8',
    name: '1.8.8',
    type: VersionType.LEGACY,
    recommended: false,
    description: 'Bountiful Update',
    releaseDate: new Date('2015-07-28')
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