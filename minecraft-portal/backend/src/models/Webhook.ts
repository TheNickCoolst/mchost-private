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

export enum WebhookEvent {
  SERVER_STARTED = 'server.started',
  SERVER_STOPPED = 'server.stopped',
  SERVER_ERROR = 'server.error',
  SERVER_CREATED = 'server.created',
  SERVER_DELETED = 'server.deleted',
  BACKUP_COMPLETED = 'backup.completed',
  BACKUP_FAILED = 'backup.failed',
  PLAYER_JOINED = 'player.joined',
  PLAYER_LEFT = 'player.left',
  SUBSCRIPTION_EXPIRING = 'subscription.expiring',
  SUBSCRIPTION_EXPIRED = 'subscription.expired'
}

@Entity('webhooks')
@Index(['userId', 'isActive'])
export class Webhook {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 500 })
  url!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-array' })
  events!: WebhookEvent[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  secret!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  headers!: Record<string, string> | null;

  @Column({ type: 'integer', default: 0 })
  successCount!: number;

  @Column({ type: 'integer', default: 0 })
  failureCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
