import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  Server,
  Activity,
  TrendingUp,
  Database,
  AlertTriangle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeServers: number;
  totalServers: number;
  totalBackups: number;
  systemHealth: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface ServerStats {
  status: string;
  count: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [serverStats, setServerStats] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, healthRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/health/detailed')
      ]);

      setStats({
        ...statsRes.data,
        systemHealth: healthRes.data.status,
        metrics: healthRes.data.metrics
      });

      if (statsRes.data.serversByStatus) {
        setServerStats(statsRes.data.serversByStatus);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Banner */}
      <div
        className={`p-4 rounded-lg text-white ${getHealthColor(
          stats.systemHealth
        )}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity size={24} />
            <div>
              <h3 className="font-bold">System Status</h3>
              <p className="text-sm capitalize">{stats.systemHealth}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm">Response Time</p>
            <p className="font-bold">{stats.metrics.averageResponseTime}ms</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-bold dark:text-white">{stats.totalUsers}</p>
            </div>
            <Users size={40} className="text-blue-500" />
          </div>
        </div>

        {/* Active Servers */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Active Servers</p>
              <p className="text-3xl font-bold dark:text-white">
                {stats.activeServers}
                <span className="text-sm text-gray-500">/{stats.totalServers}</span>
              </p>
            </div>
            <Server size={40} className="text-green-500" />
          </div>
        </div>

        {/* Total Backups */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total Backups</p>
              <p className="text-3xl font-bold dark:text-white">{stats.totalBackups}</p>
            </div>
            <Database size={40} className="text-purple-500" />
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Error Rate</p>
              <p className="text-3xl font-bold dark:text-white">
                {stats.metrics.errorRate}%
              </p>
            </div>
            <AlertTriangle
              size={40}
              className={stats.metrics.errorRate > 5 ? 'text-red-500' : 'text-gray-400'}
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-blue-500" />
            <h4 className="font-semibold dark:text-white">Requests/Min</h4>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {stats.metrics.requestsPerMinute}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} className="text-green-500" />
            <h4 className="font-semibold dark:text-white">Avg Response</h4>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {stats.metrics.averageResponseTime}ms
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <h4 className="font-semibold dark:text-white">Error Rate</h4>
          </div>
          <p className="text-2xl font-bold dark:text-white">
            {stats.metrics.errorRate}%
          </p>
        </div>
      </div>

      {/* Server Status Breakdown */}
      {serverStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-bold dark:text-white mb-4">Server Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serverStats.map((stat) => (
              <div key={stat.status} className="text-center">
                <p className="text-2xl font-bold dark:text-white">{stat.count}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {stat.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
