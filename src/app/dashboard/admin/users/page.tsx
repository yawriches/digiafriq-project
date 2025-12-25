"use client"
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { useCurrency } from '@/contexts/CurrencyContext'
import { 
  Search, 
  Filter,
  Download,
  Trash2,
  UserPlus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Edit,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AdminDashboardLayout from '@/components/dashboard/AdminDashboardLayout'
import { UserDetailPanel } from '@/components/dashboard/UserDetailPanel'
import { 
  fetchUsers, 
  fetchUserStats, 
  bulkUpdateUserStatus, 
  bulkDeleteUsers,
  exportUsers 
} from '@/lib/api/users'
import type { 
  User, 
  UserStats, 
  PaginationParams, 
  FilterParams,
  PaginatedResponse 
} from '@/types/user-management'

const UsersManagement = () => {
  const { formatAmount } = useCurrency()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const [filters, setFilters] = useState<FilterParams>({})
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 25,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })
  const [paginatedResponse, setPaginatedResponse] = useState<PaginatedResponse<User> | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)

  // Initial data fetch
  useEffect(() => {
    fetchInitialData()
  }, [])

  // Fetch users when pagination or filters change
  useEffect(() => {
    fetchUsersData()
  }, [pagination, filters])

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedUsers.length > 0)
  }, [selectedUsers])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [statsData] = await Promise.all([
        fetchUserStats()
      ])
      setStats(statsData)
      await fetchUsersData()
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsersData = async () => {
    try {
      setLoading(true)
      const response = await fetchUsers(pagination, filters)
      setPaginatedResponse(response)
      setUsers(response.data)
      setSelectedUsers([])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters({ ...filters, search: debouncedSearchTerm })
    setPagination({ ...pagination, page: 1 })
  }, [debouncedSearchTerm])

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined }
    setFilters(newFilters)
    setPagination({ ...pagination, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleLimitChange = (newLimit: number) => {
    setPagination({ ...pagination, page: 1, limit: newLimit })
  }

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = pagination.sortBy === sortBy && pagination.sortOrder === 'desc' ? 'asc' : 'desc'
    setPagination({ ...pagination, sortBy, sortOrder: newSortOrder })
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId])
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  const handleBulkStatusChange = async (status: 'active' | 'suspended' | 'pending') => {
    if (selectedUsers.length === 0) return

    try {
      await bulkUpdateUserStatus(selectedUsers, status)
      await fetchUsersData()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return

    try {
      await bulkDeleteUsers(selectedUsers)
      await fetchUsersData()
    } catch (error) {
      console.error('Error deleting users:', error)
    }
  }

  const handleExport = async () => {
    try {
      const exportData = await exportUsers(filters)
      
      // Create CSV
      const headers = ['ID', 'Email', 'Full Name', 'Role', 'Status', 'Country', 'Created At']
      const csvContent = [
        headers.join(','),
        ...exportData.map(user => [
          user.id,
          user.email,
          user.full_name || '',
          user.role,
          user.status,
          user.country || '',
          new Date(user.created_at).toISOString()
        ].join(','))
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting users:', error)
    }
  }

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setIsDetailPanelOpen(true)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700'
      case 'affiliate': return 'bg-orange-100 text-orange-700'
      case 'learner': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'suspended': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <AdminDashboardLayout title="User Management">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl font-bold">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Recent Signups</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.recentSignups.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatAmount(stats.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 text-xl font-bold">💰</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filters.role || 'all'} onValueChange={(value) => handleFilterChange('role', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="learner">Learners</SelectItem>
                <SelectItem value="affiliate">Affiliates</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="bg-[#ed874a] hover:bg-[#d76f32] flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {showBulkActions && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-900">
                  {selectedUsers.length} users selected
                </span>
                <Button
                  onClick={() => handleBulkStatusChange('active')}
                  size="sm"
                  variant="outline"
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </Button>
                <Button
                  onClick={() => handleBulkStatusChange('suspended')}
                  size="sm"
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Suspend
                </Button>
                <Button
                  onClick={handleBulkDelete}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
              <Button
                onClick={() => {
                  setSelectedUsers([])
                  setShowBulkActions(false)
                }}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            All Users {paginatedResponse && `(${paginatedResponse.count})`}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={pagination.limit.toString()} onValueChange={(value) => handleLimitChange(Number(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ed874a]"></div>
              <span className="ml-3 text-gray-600">Loading users...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg mb-2">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        <Checkbox
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSortChange('email')}
                      >
                        Email
                        {pagination.sortBy === 'email' && (
                          <span className="ml-1">{pagination.sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSortChange('role')}
                      >
                        Role
                        {pagination.sortBy === 'role' && (
                          <span className="ml-1">{pagination.sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSortChange('status')}
                      >
                        Status
                        {pagination.sortBy === 'status' && (
                          <span className="ml-1">{pagination.sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Country</th>
                      <th 
                        className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:text-gray-900"
                        onClick={() => handleSortChange('created_at')}
                      >
                        Joined
                        {pagination.sortBy === 'created_at' && (
                          <span className="ml-1">{pagination.sortOrder === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserClick(user)}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {user.full_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{user.full_name || 'Unknown'}</span>
                              {user.phone && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Phone className="w-3 h-3" />
                                  {user.phone}
                                </div>
                              )}
                              {(user.role === 'affiliate' || user.role === 'admin') && (
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  {user.referral_count !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {user.referral_count} referrals
                                    </div>
                                  )}
                                  {user.total_commissions !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      {formatAmount(user.total_commissions)} earned
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(user.status || 'active')}`}>
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {user.country && <MapPin className="w-3 h-3" />}
                            {user.country || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center space-x-2">
                            <button className="p-1 hover:bg-gray-100 rounded" title="View Details">
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded" title="More Options">
                              <MoreVertical className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {paginatedResponse && paginatedResponse.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {((paginatedResponse.page - 1) * paginatedResponse.limit) + 1} to{' '}
                    {Math.min(paginatedResponse.page * paginatedResponse.limit, paginatedResponse.count)} of{' '}
                    {paginatedResponse.count} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginatedResponse.page - 1)}
                      disabled={!paginatedResponse.hasPrevious}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, paginatedResponse.totalPages) }, (_, i) => {
                        let pageNum = i + 1
                        if (paginatedResponse.totalPages > 5) {
                          if (paginatedResponse.page <= 3) {
                            pageNum = i + 1
                          } else if (paginatedResponse.page >= paginatedResponse.totalPages - 2) {
                            pageNum = paginatedResponse.totalPages - 4 + i
                          } else {
                            pageNum = paginatedResponse.page - 2 + i
                          }
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={paginatedResponse.page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(paginatedResponse.page + 1)}
                      disabled={!paginatedResponse.hasMore}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Detail Panel */}
      <UserDetailPanel
        user={selectedUser}
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false)
          setSelectedUser(null)
        }}
        onUpdate={fetchUsersData}
      />
    </AdminDashboardLayout>
  )
}

export default UsersManagement
