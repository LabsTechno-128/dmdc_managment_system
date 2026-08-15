import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Shield, Power, 
  Trash2, Edit2, ChevronLeft, ChevronRight,
  MoreVertical, ShieldAlert, KeyRound
} from 'lucide-react';
import { userService } from '../../services/user.service';
import type { User, UserQueryParams } from '../../services/user.service';
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import { ChangeRoleModal } from './components/ChangeRoleModal';
import { ChangeStatusModal } from './components/ChangeStatusModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { DeleteModal } from '../../components/DeleteModal';
import { TableSkeleton } from '../../components/skeleton/TableSkeleton';
import { toast } from 'react-toastify';

export const UsersList: React.FC = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<UserQueryParams>({
    page: 1,
    limit: 10,
    search: '',
    role: '',
    isActive: '',
  });

  const [searchInput, setSearchInput] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setParams(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getUsers(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    }
  });

  const handleFilterChange = (key: keyof UserQueryParams, value: string) => {
    setParams(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const users: User[] = data?.data || [];
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };
  const total = meta.total || 0;
  const totalPages = meta.totalPages || 1;
  const page = params.page || 1;
  const limit = params.limit || 10;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform access, roles, and user accounts</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-blue-200"
        >
          <Plus size={20} />
          <span>Create User</span>
        </button>
      </div>

      {isError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center space-x-3">
          <ShieldAlert size={20} />
          <span>{(error as Error)?.message || 'Failed to load users.'}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={params.role || ''}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-w-[160px] text-slate-700 font-medium"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="receptionist">Receptionist</option>
            <option value="doctor">Doctor</option>
            <option value="lab_technician">Lab Technician</option>
            <option value="accountant">Accountant</option>
            <option value="pharmacist">Pharmacist</option>
          </select>

          <select
            value={params.isActive || ''}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-w-[140px] text-slate-700 font-medium"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">User</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Role</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Joined</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-0 border-b-0">
                    <TableSkeleton />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-base text-slate-600 font-medium">No users found</p>
                      <p className="text-sm">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold uppercase shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.firstName} {user.lastName}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Shield size={16} className={user.role === 'super_admin' ? 'text-amber-500' : 'text-slate-400'} />
                        <span className="font-medium text-slate-700 capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.isActive 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                        <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2 transition-opacity">
                        <button 
                          onClick={() => setEditUser(user)}
                          className="p-1.5 cursor-pointer text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => setRoleUser(user)}
                          className="p-1.5 cursor-pointer text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Change Role"
                        >
                          <ShieldAlert size={18} />
                        </button>
                        <button 
                          onClick={() => setStatusUser(user)}
                          className={`p-1.5 cursor-pointer rounded-lg transition-colors ${
                            user.isActive 
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                        >
                          <Power size={18} />
                        </button>
                        <button 
                          onClick={() => setPasswordUser(user)}
                          className="p-1.5 cursor-pointer text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Change Password"
                        >
                          <KeyRound size={18} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => setDeleteUser(user)}
                          className="p-1.5 cursor-pointer text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="lg:hidden block opacity-100">
                         <button className="p-1.5 cursor-pointer text-slate-400 hover:bg-slate-100 rounded-lg">
                           <MoreVertical size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
                Showing <span className="font-bold text-slate-700">{from}</span>–{' '}
                <span className="font-bold text-slate-700">{to}</span> of{' '}
                <span className="font-bold text-slate-700">{total}</span>
            </p>
            <div className="flex items-center gap-1">
                <button
                    disabled={page <= 1}
                    onClick={() => setParams(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={15} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = i + 1;
                    return (
                        <button
                            key={p}
                            onClick={() => setParams(prev => ({ ...prev, page: p }))}
                            className={`cursor-pointer min-w-[36px] rounded-xl px-3 py-2 text-sm font-bold shadow-sm transition-all active:scale-95 ${p === page
                                ? 'bg-blue-600 text-white shadow-blue-600/20'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {p}
                        </button>
                    );
                })}
                <button
                    disabled={page >= totalPages}
                    onClick={() => setParams(prev => ({ ...prev, page: Math.min(totalPages, (prev.page || 1) + 1) }))}
                    className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={15} />
                </button>
            </div>
        </div>
      </div>

      {/* Modals */}
      <CreateUserModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      
      <EditUserModal 
        isOpen={!!editUser} 
        onClose={() => setEditUser(null)} 
        user={editUser} 
      />
      
      <ChangeRoleModal 
        isOpen={!!roleUser} 
        onClose={() => setRoleUser(null)} 
        user={roleUser} 
      />
      
      <ChangeStatusModal 
        isOpen={!!statusUser} 
        onClose={() => setStatusUser(null)} 
        user={statusUser} 
      />

      <ChangePasswordModal 
        isOpen={!!passwordUser} 
        onClose={() => setPasswordUser(null)} 
        user={passwordUser} 
      />

      <DeleteModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteMutation.mutate(deleteUser!.id)}
        isDeleting={deleteMutation.isPending}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? All their associated data and sessions will be removed. This action cannot be undone."
        itemName={deleteUser ? `${deleteUser.firstName} ${deleteUser.lastName}` : undefined}
      />
    </div>
  );
};
