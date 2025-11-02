import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, Plus, Trash2, Save, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface BackupSchedule {
  id: string;
  serverId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM format for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  enabled: boolean;
  retentionDays: number;
  lastRun?: string;
  nextRun?: string;
}

interface BackupSchedulerProps {
  serverId: string;
}

const BackupScheduler: React.FC<BackupSchedulerProps> = ({ serverId }) => {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);

  const [newSchedule, setNewSchedule] = useState<Partial<BackupSchedule>>({
    frequency: 'daily',
    time: '00:00',
    enabled: true,
    retentionDays: 7
  });

  useEffect(() => {
    loadSchedules();
  }, [serverId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/backups/${serverId}/schedules`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      await api.post(`/api/backups/${serverId}/schedules`, {
        ...newSchedule,
        serverId
      });
      toast.success('Backup schedule created');
      setShowNewSchedule(false);
      setNewSchedule({
        frequency: 'daily',
        time: '00:00',
        enabled: true,
        retentionDays: 7
      });
      loadSchedules();
    } catch (error) {
      toast.error('Failed to create schedule');
      console.error(error);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this backup schedule?')) return;

    try {
      await api.delete(`/api/backups/${serverId}/schedules/${scheduleId}`);
      toast.success('Schedule deleted');
      loadSchedules();
    } catch (error) {
      toast.error('Failed to delete schedule');
      console.error(error);
    }
  };

  const toggleSchedule = async (schedule: BackupSchedule) => {
    try {
      await api.put(`/api/backups/${serverId}/schedules/${schedule.id}`, {
        ...schedule,
        enabled: !schedule.enabled
      });
      toast.success(schedule.enabled ? 'Schedule disabled' : 'Schedule enabled');
      loadSchedules();
    } catch (error) {
      toast.error('Failed to update schedule');
      console.error(error);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      hourly: 'Every hour',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly'
    };
    return labels[frequency] || frequency;
  };

  const getDayOfWeekLabel = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Clock className="text-blue-500" size={24} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Backup Schedules
          </h2>
        </div>
        <button
          onClick={() => setShowNewSchedule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus size={18} />
          New Schedule
        </button>
      </div>

      {/* New Schedule Form */}
      {showNewSchedule && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">
            Create Backup Schedule
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Frequency
              </label>
              <select
                value={newSchedule.frequency}
                onChange={(e) =>
                  setNewSchedule({
                    ...newSchedule,
                    frequency: e.target.value as any
                  })
                }
                className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
              >
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {newSchedule.frequency !== 'hourly' && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Time
                </label>
                <input
                  type="time"
                  value={newSchedule.time}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, time: e.target.value })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                />
              </div>
            )}

            {newSchedule.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Day of Week
                </label>
                <select
                  value={newSchedule.dayOfWeek || 0}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      dayOfWeek: parseInt(e.target.value)
                    })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                >
                  <option value="0">Sunday</option>
                  <option value="1">Monday</option>
                  <option value="2">Tuesday</option>
                  <option value="3">Wednesday</option>
                  <option value="4">Thursday</option>
                  <option value="5">Friday</option>
                  <option value="6">Saturday</option>
                </select>
              </div>
            )}

            {newSchedule.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-white">
                  Day of Month
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newSchedule.dayOfMonth || 1}
                  onChange={(e) =>
                    setNewSchedule({
                      ...newSchedule,
                      dayOfMonth: parseInt(e.target.value)
                    })
                  }
                  className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 dark:text-white">
                Retention (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={newSchedule.retentionDays}
                onChange={(e) =>
                  setNewSchedule({
                    ...newSchedule,
                    retentionDays: parseInt(e.target.value)
                  })
                }
                className="w-full p-2 border rounded dark:bg-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={createSchedule}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Save size={18} />
              Create Schedule
            </button>
            <button
              onClick={() => setShowNewSchedule(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 dark:text-white">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No backup schedules configured
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 border dark:border-gray-700 rounded-lg flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <Calendar className="text-blue-500" size={24} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold dark:text-white">
                      {getFrequencyLabel(schedule.frequency)}
                    </span>
                    {schedule.time && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        at {schedule.time}
                      </span>
                    )}
                    {schedule.dayOfWeek !== undefined && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        on {getDayOfWeekLabel(schedule.dayOfWeek)}
                      </span>
                    )}
                    {schedule.dayOfMonth && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        on day {schedule.dayOfMonth}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Retention: {schedule.retentionDays} days
                    {schedule.nextRun && (
                      <span className="ml-4">
                        Next: {new Date(schedule.nextRun).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={() => toggleSchedule(schedule)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>

                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded"
                  title="Delete schedule"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BackupScheduler;
