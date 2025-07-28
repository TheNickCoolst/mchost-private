import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ServerInstance } from './ServerInstance';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 2048 })
  memoryLimitMB: number;

  @Column({ default: 2 })
  cpuCores: number;

  @Column({ default: 10240 })
  diskLimitMB: number;

  @Column({ default: 5 })
  maxServers: number;

  @OneToMany(() => ServerInstance, server => server.owner)
  servers: ServerInstance[];
}