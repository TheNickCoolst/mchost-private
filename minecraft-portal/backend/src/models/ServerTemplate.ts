import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User';

export enum TemplateCategory {
  VANILLA = 'vanilla',
  MODDED = 'modded',
  MINIGAMES = 'minigames',
  SURVIVAL = 'survival',
  CREATIVE = 'creative',
  PVP = 'pvp',
  RPG = 'rpg',
  CUSTOM = 'custom'
}

@Entity('server_templates')
@Index(['userId', 'isPublic'])
@Index(['category', 'isPublic'])
export class ServerTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.VANILLA
  })
  category!: TemplateCategory;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // Server configuration
  @Column({ type: 'varchar', length: 50 })
  minecraftVersion!: string;

  @Column({ type: 'varchar', length: 50 })
  serverType!: string; // vanilla, paper, spigot, forge, etc.

  @Column({ type: 'integer', default: 2048 })
  memoryMb!: number;

  @Column({ type: 'integer', default: 25565 })
  defaultPort!: number;

  @Column({ type: 'integer', default: 20 })
  maxPlayers!: number;

  // Server properties preset
  @Column({ type: 'jsonb', nullable: true })
  serverProperties!: Record<string, any> | null;

  // Environment variables preset
  @Column({ type: 'jsonb', nullable: true })
  environmentVariables!: Record<string, string> | null;

  // Plugins/Mods to install
  @Column({ type: 'jsonb', nullable: true })
  plugins!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  mods!: string[] | null;

  // Startup configuration
  @Column({ type: 'text', nullable: true })
  startupCommand!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  jvmArguments!: string[] | null;

  // Template metadata
  @Column({ type: 'integer', default: 0 })
  usageCount!: number;

  @Column({ type: 'float', default: 0 })
  averageRating!: number;

  @Column({ type: 'jsonb', nullable: true })
  tags!: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  iconUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  setupInstructions!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
