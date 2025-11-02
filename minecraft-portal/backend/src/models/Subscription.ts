import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PREMIUM = 'premium',
  ULTIMATE = 'ultimate'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: PlanType,
    default: PlanType.FREE
  })
  planType: PlanType;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE
  })
  status: SubscriptionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerMonth: number;

  @Column({ type: 'int', default: 1024 })
  ramMB: number;

  @Column({ type: 'int', default: 1 })
  cpuCores: number;

  @Column({ type: 'int', default: 5120 })
  diskMB: number;

  @Column({ type: 'int', default: 1 })
  maxServers: number;

  @Column({ type: 'int', default: 0 })
  maxPlayers: number;

  @Column({ type: 'boolean', default: false })
  backupsEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  prioritySupport: boolean;

  @Column({ type: 'boolean', default: false })
  customDomain: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
