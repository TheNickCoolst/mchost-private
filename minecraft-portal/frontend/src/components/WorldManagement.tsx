import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface WorldInfo {
  serverId: string;
  serverName: string;
  worldName: string;
  worldSize: number;
  lastBackup: string | null;
  availableBackups: Backup[];
  worldFiles: string[];
}

interface Backup {
  id: string;
  name: string;
  description: string;
  size: number;
  createdAt: string;
  canDownload: boolean;
  canRestore: boolean;
}

interface WorldManagementProps {
  serverId: string;
}

export const WorldManagement: React.FC<WorldManagementProps> = ({ serverId }) => {
  const [worldInfo, setWorldInfo] = useState<WorldInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetSettings, setResetSettings] = useState({
    worldName: 'world',
    seed: '',
    levelType: 'minecraft:normal',
    generateStructures: true
  });

  const fetchWorldInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/worlds/${serverId}`);
      setWorldInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load world information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorldInfo();
  }, [serverId]);

  const createBackup = async () => {
    try {
      setIsCreatingBackup(true);
      await api.post(`/worlds/${serverId}/backup`, {
        name: backupName || undefined,
        description: backupDescription || undefined
      });
      setBackupName('');
      setBackupDescription('');
      await fetchWorldInfo();
      alert('Backup created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const downloadBackup = async (backupId: string, backupName: string) => {
    try {
      const response = await api.get(`/worlds/${serverId}/backup/${backupId}/download`);
      const downloadUrl = response.data.downloadUrl;
      
      // Create temporary download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${backupName}.tar.gz`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to download backup');
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite the current world!')) {
      return;
    }

    try {
      await api.post(`/worlds/${serverId}/restore`, { backupId });
      await fetchWorldInfo();
      alert('World restored successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to restore backup');
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone!')) {
      return;
    }

    try {
      await api.delete(`/worlds/${serverId}/backup/${backupId}`);
      await fetchWorldInfo();
      alert('Backup deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete backup');
    }
  };

  const resetWorld = async () => {
    try {
      setIsResetting(true);
      await api.post(`/worlds/${serverId}/reset`, {
        ...resetSettings,
        confirmReset: true
      });
      setShowResetDialog(false);
      await fetchWorldInfo();
      alert('World reset successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset world');
    } finally {
      setIsResetting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!worldInfo) return <div>No world information available</div>;

  return (
    <div className="space-y-6">
      {/* World Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">World Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">World Name</label>
            <p className="mt-1 text-sm text-gray-900">{worldInfo.worldName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">World Size</label>
            <p className="mt-1 text-sm text-gray-900">{formatFileSize(worldInfo.worldSize)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Backup</label>
            <p className="mt-1 text-sm text-gray-900">
              {worldInfo.lastBackup ? new Date(worldInfo.lastBackup).toLocaleString() : 'Never'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Backups</label>
            <p className="mt-1 text-sm text-gray-900">{worldInfo.availableBackups.length}</p>
          </div>
        </div>
      </div>

      {/* Backup Creation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Backup</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Backup Name (Optional)</label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty for auto-generated name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              value={backupDescription}
              onChange={(e) => setBackupDescription(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Describe this backup..."
            />
          </div>
          <button
            onClick={createBackup}
            disabled={isCreatingBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreatingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Backups</h3>
        {worldInfo.availableBackups.length === 0 ? (
          <p className="text-gray-500">No backups available</p>
        ) : (
          <div className="space-y-3">
            {worldInfo.availableBackups.map((backup) => (
              <div key={backup.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{backup.name}</h4>
                    <p className="text-sm text-gray-600">{backup.description}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(backup.createdAt).toLocaleString()} | 
                      Size: {formatFileSize(backup.size)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {backup.canDownload && (
                      <button
                        onClick={() => downloadBackup(backup.id, backup.name)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Download
                      </button>
                    )}
                    {backup.canRestore && (
                      <button
                        onClick={() => restoreBackup(backup.id)}
                        className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => deleteBackup(backup.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* World Reset */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">World Management</h3>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Resetting the world will delete all current world data. A backup will be created automatically before reset.
            </p>
          </div>
          <button
            onClick={() => setShowResetDialog(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Reset World
          </button>
        </div>
      </div>

      {/* Reset Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset World Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">World Name</label>
                <input
                  type="text"
                  value={resetSettings.worldName}
                  onChange={(e) => setResetSettings({ ...resetSettings, worldName: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Seed (Optional)</label>
                <input
                  type="text"
                  value={resetSettings.seed}
                  onChange={(e) => setResetSettings({ ...resetSettings, seed: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave empty for random seed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Level Type</label>
                <select
                  value={resetSettings.levelType}
                  onChange={(e) => setResetSettings({ ...resetSettings, levelType: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="minecraft:normal">Normal</option>
                  <option value="minecraft:flat">Superflat</option>
                  <option value="minecraft:large_biomes">Large Biomes</option>
                  <option value="minecraft:amplified">Amplified</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={resetSettings.generateStructures}
                  onChange={(e) => setResetSettings({ ...resetSettings, generateStructures: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Generate Structures</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowResetDialog(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={resetWorld}
                disabled={isResetting}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Reset World'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};