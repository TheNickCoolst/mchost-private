import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum VersionType {
  RELEASE = 'release',
  SNAPSHOT = 'snapshot',
  LEGACY = 'legacy'
}

@Entity('minecraft_versions')
export class MinecraftVersion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  versionId!: string; // e.g., "1.21.1"

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: VersionType,
    default: VersionType.RELEASE
  })
  type!: VersionType;

  @Column({ default: false })
  recommended!: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  releaseDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}