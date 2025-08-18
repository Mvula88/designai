'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, Filter, MoreVertical, UserPlus, Ban, Shield, 
  Mail, Calendar, CreditCard, Edit, Trash2, Check, X,
  ChevronLeft, ChevronRight, Download, Upload
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface User {
  id: string
  email: string
  profiles: {
    username: string | null
    full_name: string | null
    role: string
    subscription_tier: string
    credits: number
    created_at: string
  }
  last_sign_in_at: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const itemsPerPage = 10
  const supabase = createClient()

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, tierFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) throw authError

      // Get profiles for all users
      const userIds = authUsers.users.map(u => u.id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      // Combine auth and profile data
      const combinedUsers = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id)
        return {
          ...authUser,
          profiles: profile || {
            username: null,
            full_name: null,
            role: 'user',
            subscription_tier: 'free',
            credits: 0,
            created_at: authUser.created_at
          }
        }
      })

      setUsers(combinedUsers as User[])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.profiles?.role === roleFilter)
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.profiles?.subscription_tier === tierFilter)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast.success('User role updated')
      loadUsers()
      
      // Log admin action
      await supabase.from('audit_logs').insert({
        action: 'update_user_role',
        entity_type: 'user',
        entity_id: userId,
        details: { new_role: newRole }
      })
    } catch (error) {
      toast.error('Failed to update user role')
    }
  }

  const updateUserCredits = async (userId: string, credits: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits })
        .eq('id', userId)

      if (error) throw error

      toast.success('User credits updated')
      loadUsers()
    } catch (error) {
      toast.error('Failed to update credits')
    }
  }

  const suspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { ban_duration: '876000h' } // 100 years
      )

      if (error) throw error

      toast.success('User suspended')
      loadUsers()

      // Log admin action
      await supabase.from('audit_logs').insert({
        action: 'suspend_user',
        entity_type: 'user',
        entity_id: userId
      })
    } catch (error) {
      toast.error('Failed to suspend user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      toast.success('User deleted')
      loadUsers()

      // Log admin action
      await supabase.from('audit_logs').insert({
        action: 'delete_user',
        entity_type: 'user',
        entity_id: userId
      })
    } catch (error) {
      toast.error('Failed to delete user')
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Email', 'Username', 'Full Name', 'Role', 'Tier', 'Credits', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        user.email,
        user.profiles?.username || '',
        user.profiles?.full_name || '',
        user.profiles?.role || 'user',
        user.profiles?.subscription_tier || 'free',
        user.profiles?.credits || 0,
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const bulkAction = async (action: string) => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected')
      return
    }

    switch (action) {
      case 'delete':
        if (!confirm(`Delete ${selectedUsers.size} users?`)) return
        for (const userId of selectedUsers) {
          await deleteUser(userId)
        }
        setSelectedUsers(new Set())
        break
      case 'suspend':
        for (const userId of selectedUsers) {
          await suspendUser(userId)
        }
        setSelectedUsers(new Set())
        break
    }
  }

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar (reuse from main admin page) */}
        <div className="w-64 bg-gray-900 min-h-screen">
          <div className="p-4">
            <Link href="/admin" className="flex items-center gap-2 mb-8">
              <Shield className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-white font-bold text-lg">Admin Panel</h1>
                <p className="text-gray-400 text-xs">User Management</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-600">
                    {filteredUsers.length} users found
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportUsers}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="p-6 bg-white border-b">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
              
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>

              {selectedUsers.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => bulkAction('suspend')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Suspend ({selectedUsers.size})
                  </button>
                  <button
                    onClick={() => bulkAction('delete')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete ({selectedUsers.size})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="p-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(paginatedUsers.map(u => u.id)))
                          } else {
                            setSelectedUsers(new Set())
                          }
                        }}
                        checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers)
                            if (e.target.checked) {
                              newSelected.add(user.id)
                            } else {
                              newSelected.delete(user.id)
                            }
                            setSelectedUsers(newSelected)
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{user.profiles?.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          {user.profiles?.username && (
                            <p className="text-xs text-gray-400">@{user.profiles.username}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingUser === user.id ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.profiles?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.profiles?.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.profiles?.role || 'user'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.profiles?.subscription_tier === 'pro' ? 'bg-green-100 text-green-700' :
                          user.profiles?.subscription_tier === 'enterprise' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.profiles?.subscription_tier || 'free'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editingUser === user.id ? (
                          <input
                            type="number"
                            value={editForm.credits}
                            onChange={(e) => setEditForm({ ...editForm, credits: parseInt(e.target.value) })}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm">{user.profiles?.credits || 0}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingUser === user.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={async () => {
                                await updateUserRole(user.id, editForm.role)
                                await updateUserCredits(user.id, editForm.credits)
                                setEditingUser(null)
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user.id)
                                setEditForm({
                                  role: user.profiles?.role || 'user',
                                  credits: user.profiles?.credits || 0
                                })
                              }}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => suspendUser(user.id)}
                              className="p-1 text-yellow-600 hover:bg-yellow-50 rounded"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page 
                            ? 'bg-purple-600 text-white' 
                            : 'border hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}