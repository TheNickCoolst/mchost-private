import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ModLoaderType {
  FORGE = 'forge',
  FABRIC = 'fabric',
  QUILT = 'quilt'
}

@Entity('server_types')
export class ServerType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  typeId!: string; // e.g., "paper", "spigot"

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({ default: false })
  supportsPlugins!: boolean;

  @Column({ default: false })
  supportsMods!: boolean;

  @Column({
    type: 'enum',
    enum: ModLoaderType,
    nullable: true
  })
  modLoaderType?: ModLoaderType;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  dockerImage?: string; // For future Wings integration

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}