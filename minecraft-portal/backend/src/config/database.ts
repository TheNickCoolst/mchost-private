import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { ServerInstance } from '../models/ServerInstance';
import { LogEntry } from '../models/LogEntry';
import { MinecraftVersion } from '../models/MinecraftVersion';
import { ServerType } from '../models/ServerType';
import { Plugin } from '../models/Plugin';
import { Subscription } from '../models/Subscription';
import { SubscriptionPlan } from '../models/SubscriptionPlan';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'portal',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'portal',
  synchronize: true, // Auto-sync schema changes
  logging: process.env.NODE_ENV === 'development',
  entities: [User, ServerInstance, LogEntry, MinecraftVersion, ServerType, Plugin, Subscription, SubscriptionPlan],
  // Connection pooling for better performance
  extra: {
    connectionLimit: 20,
    acquireConnectionTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },
  // Database connection optimization
  poolSize: 10,
  maxQueryExecutionTime: 30000,
  cache: {
    duration: 30000, // 30 seconds cache
  },
});