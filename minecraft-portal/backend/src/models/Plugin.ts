import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { ServerInstance } from './ServerInstance';

export enum PluginCategory {
  ADMIN = 'admin',
  ECONOMY = 'economy',
  PVP = 'pvp',
  BUILDING = 'building',
  WORLD = 'world',
  UTILITY = 'utility',
  FUN = 'fun',
  PROTECTION = 'protection'
}

@Entity('plugins')
export class Plugin {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column()
  displayName!: string;

  @Column('text')
  description!: string;

  @Column()
  author!: string;

  @Column()
  version!: string;

  @Column({
    type: 'enum',
    enum: PluginCategory,
    default: PluginCategory.UTILITY
  })
  category!: PluginCategory;

  @Column('simple-array', { nullable: true })
  supportedVersions?: string[]; // Compatible Minecraft versions

  @Column('simple-array', { nullable: true })
  supportedServerTypes?: string[]; // paper, spigot, etc.

  @Column({ nullable: true })
  downloadUrl?: string;

  @Column({ nullable: true })
  websiteUrl?: string;

  @Column({ nullable: true })
  sourceUrl?: string;

  @Column({ nullable: true })
  iconUrl?: string;

  @Column({ default: 0 })
  downloads!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ default: 0 })
  ratingCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isFeatured!: boolean;

  @Column({ default: false })
  isPopular!: boolean;

  @Column('json', { nullable: true })
  configTemplate?: any; // Default configuration template

  @Column('simple-array', { nullable: true })
  dependencies?: string[]; // Other plugins this depends on

  @Column('simple-array', { nullable: true })
  conflicts?: string[]; // Plugins that conflict with this one

  @ManyToMany(() => ServerInstance, server => server.plugins)
  @JoinTable({
    name: 'server_plugins',
    joinColumn: { name: 'plugin_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'server_id', referencedColumnName: 'id' }
  })
  servers!: ServerInstance[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}