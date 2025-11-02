import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceMonthly: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceYearly: number;

  @Column({ type: 'int' })
  ramMB: number;

  @Column({ type: 'int' })
  cpuCores: number;

  @Column({ type: 'int' })
  diskMB: number;

  @Column({ type: 'int' })
  maxServers: number;

  @Column({ type: 'int' })
  maxPlayers: number;

  @Column({ type: 'boolean', default: false })
  backupsEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  maxBackups: number;

  @Column({ type: 'boolean', default: false })
  prioritySupport: boolean;

  @Column({ type: 'boolean', default: false })
  customDomain: boolean;

  @Column({ type: 'boolean', default: true })
  ddosProtection: boolean;

  @Column({ type: 'boolean', default: false })
  modpackSupport: boolean;

  @Column({ type: 'boolean', default: false })
  pluginSupport: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
