import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { ServerInstance } from './ServerInstance';

@Entity('server_metrics')
@Index(['serverId', 'timestamp'])
@Index(['timestamp'])
export class ServerMetric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  serverId!: string;

  @ManyToOne(() => ServerInstance, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serverId' })
  server!: ServerInstance;

  @Column({ type: 'timestamp' })
  timestamp!: Date;

  // Resource metrics
  @Column({ type: 'float', nullable: true })
  cpuUsage!: number | null;

  @Column({ type: 'bigint', nullable: true })
  memoryUsed!: number | null;

  @Column({ type: 'bigint', nullable: true })
  memoryTotal!: number | null;

  @Column({ type: 'bigint', nullable: true })
  diskUsed!: number | null;

  @Column({ type: 'bigint', nullable: true })
  diskTotal!: number | null;

  @Column({ type: 'bigint', nullable: true })
  networkIn!: number | null;

  @Column({ type: 'bigint', nullable: true })
  networkOut!: number | null;

  // Server-specific metrics
  @Column({ type: 'integer', nullable: true })
  playerCount!: number | null;

  @Column({ type: 'integer', nullable: true })
  maxPlayers!: number | null;

  @Column({ type: 'float', nullable: true })
  tps!: number | null; // Ticks per second

  @Column({ type: 'integer', nullable: true })
  loadedChunks!: number | null;

  @Column({ type: 'integer', nullable: true })
  entities!: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
