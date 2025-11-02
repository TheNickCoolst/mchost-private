import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { userApi } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { User as UserType } from '../types/auth'
import { Users, Plus, Edit2, Trash2, Shield, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

const UserManagement: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userApi.getUsers()
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">Admin</span>
      case 'moderator':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">Moderator</span>
      default:
        return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">User</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Users className="h-8 w-8" />
            <span>User Management</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage users and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Create User</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Admins</p>
              <p className="text-3xl font-bold text-white mt-1">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Moderators</p>
              <p className="text-3xl font-bold text-white mt-1">
                {users.filter(u => u.role === 'moderator').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Regular Users</p>
              <p className="text-3xl font-bold text-white mt-1">
                {users.filter(u => u.role === 'user').length}
              </p>
            </div>
            <UserX className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Servers
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {user.servers?.length || 0} servers
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-400 hover:text-blue-300 transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserManagement
