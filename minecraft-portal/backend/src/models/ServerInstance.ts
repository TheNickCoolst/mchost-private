import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { LogEntry } from './LogEntry';
import { Plugin } from './Plugin';

export enum ServerStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  STARTING = 'starting',
  STOPPING = 'stopping',
  ERROR = 'error'
}

export interface ResourceLimits {
  memory: number;
  cpu: number;
  disk: number;
  swap: number;
  io: number;
}

export interface EnvironmentVariables {
  [key: string]: string;
}

export interface ServerProperties {
  [key: string]: string | number | boolean;
}

@Entity('server_instances')
export class ServerInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  nest: string;

  @Column()
  egg: string;

  @Column({
    type: 'enum',
    enum: ServerStatus,
    default: ServerStatus.STOPPED
  })
  status: ServerStatus;

  @Column('jsonb')
  resourceLimits: ResourceLimits;

  @Column('jsonb', { default: {} })
  envVars: EnvironmentVariables;

  @Column({ nullable: true })
  wingsNodeId: string;

  @Column({ nullable: true })
  wingsUuid: string;

  @Column({ default: 25565 })
  port: number;

  @Column({ nullable: true })
  gameVersion: string;

  @Column('jsonb', { nullable: true })
  serverProperties: ServerProperties;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.servers)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => LogEntry, log => log.server)
  logs: LogEntry[];

  @ManyToMany(() => Plugin, plugin => plugin.servers)
  plugins: Plugin[];
}