import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from './User';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export enum NotificationCategory {
  SERVER = 'server',
  BACKUP = 'backup',
  SUBSCRIPTION = 'subscription',
  SYSTEM = 'system',
  SECURITY = 'security',
  PAYMENT = 'payment'
}

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
@Index(['category', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationCategory
  })
  category!: NotificationCategory;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  actionUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actionLabel!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt!: Date | null;
}
