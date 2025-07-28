import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ServerInstance } from './ServerInstance';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

@Entity('log_entries')
export class LogEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO
  })
  level: LogLevel;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  timestamp: Date;

  @ManyToOne(() => ServerInstance, server => server.logs)
  @JoinColumn({ name: 'serverId' })
  server: ServerInstance;

  @Column()
  serverId: string;
}