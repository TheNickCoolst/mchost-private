import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface ResourceLimits {
  memoryMB: number;
  cpuCores: number;
  diskMB: number;
  maxServers: number;
}

interface ResourceUsed {
  memoryMB: number;
  cpuPercentage: number;
  diskMB: number;
  servers: number;
}

interface ResourceData {
  limits: ResourceLimits;
  used: ResourceUsed;
  available: ResourceLimits;
  percentageUsed: {
    memory: number;
    cpu: number;
    disk: number;
    servers: number;
  };
}

export const ResourceUsage: React.FC = () => {
  const [resources, setResources] = useState<ResourceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/me/resources');
      setResources(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load resource information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const formatMemory = (mb: number): string => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const formatPercentage = (percentage: number): string => {
    return `${Math.round(percentage)}%`;
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const ProgressBar: React.FC<{ label: string; used: number; total: number; percentage: number; formatter?: (value: number) => string }> = ({ 
    label, used, total, percentage, formatter = (v) => v.toString() 
  }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {formatter(used)} / {formatter(total)} ({formatPercentage(percentage)})
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!resources) return <div>No resource information available</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Resource Usage
      </h3>
      
      <div className="space-y-6">
        <ProgressBar
          label="Memory (RAM)"
          used={resources.used.memoryMB}
          total={resources.limits.memoryMB}
          percentage={resources.percentageUsed.memory}
          formatter={formatMemory}
        />

        <ProgressBar
          label="CPU Allocation"
          used={resources.used.cpuPercentage}
          total={resources.limits.cpuCores * 100}
          percentage={resources.percentageUsed.cpu}
          formatter={(v) => `${v}%`}
        />

        <ProgressBar
          label="Disk Space"
          used={resources.used.diskMB}
          total={resources.limits.diskMB}
          percentage={resources.percentageUsed.disk}
          formatter={formatMemory}
        />

        <ProgressBar
          label="Server Slots"
          used={resources.used.servers}
          total={resources.limits.maxServers}
          percentage={resources.percentageUsed.servers}
        />
      </div>

      {/* Resource Summary Cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Available RAM</div>
          <div className="text-sm font-semibold text-blue-900">{formatMemory(resources.available.memoryMB)}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs font-medium text-green-600 uppercase tracking-wide">Available CPU</div>
          <div className="text-sm font-semibold text-green-900">{(resources.available.cpuCores * 100)}%</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Available Disk</div>
          <div className="text-sm font-semibold text-purple-900">{formatMemory(resources.available.diskMB)}</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs font-medium text-orange-600 uppercase tracking-wide">Free Slots</div>
          <div className="text-sm font-semibold text-orange-900">{resources.available.maxServers}</div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={fetchResources}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors duration-200 disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};