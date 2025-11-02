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

export enum AuditAction {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',

  SERVER_CREATE = 'server_create',
  SERVER_UPDATE = 'server_update',
  SERVER_DELETE = 'server_delete',
  SERVER_START = 'server_start',
  SERVER_STOP = 'server_stop',
  SERVER_RESTART = 'server_restart',
  SERVER_KILL = 'server_kill',

  BACKUP_CREATE = 'backup_create',
  BACKUP_RESTORE = 'backup_restore',
  BACKUP_DELETE = 'backup_delete',

  PLUGIN_INSTALL = 'plugin_install',
  PLUGIN_UNINSTALL = 'plugin_uninstall',

  SUBSCRIPTION_CREATE = 'subscription_create',
  SUBSCRIPTION_UPDATE = 'subscription_update',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',

  CONFIG_UPDATE = 'config_update',
  SECURITY_VIOLATION = 'security_violation'
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['severity', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: AuditAction
  })
  action!: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditSeverity,
    default: AuditSeverity.INFO
  })
  severity!: AuditSeverity;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceType!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resourceId!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
