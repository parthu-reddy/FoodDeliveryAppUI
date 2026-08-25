import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { usePolling } from "@/hooks/usePolling";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi, identityApi } from "@/lib/zodiosClients";
import { RoleName } from "@/types";
import { Button, EmptyState, Input, Select } from '@shared/ui';
import { Plus, Power, Search, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { asUntyped, WirePage } from '../../../lib/untypedResponse';
import { Order } from '@/types';

interface AdminUser {
  id: string;
  phoneNumber?: string;
  roles: string[];
  isActive: boolean;
}

const roleSchema = z.string().min(2, "Role must be at least 2 characters").max(50, "Role cannot exceed 50 characters").regex(/^[A-Z_]+$/, "Role must contain only uppercase letters and underscores");

export default function AdminUserManagement() {
  const { showSuccess, showError } = useToast();
  const [roleFilter, setRoleFilter] = useState<RoleName | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [userActiveOrders, setUserActiveOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Polling for users by role
  const { refetch: fetchByRole } = usePolling({
    fetchFn: async () => {
      let res;
      if (roleFilter === 'ALL') {
          res = await identityApi.internalUser.get('/api/v1/internal/users/admin/all', { queries: { page } });
      } else {
          res = await identityApi.internalUser.get('/api/v1/internal/users/by-role', { queries: { role: roleFilter, page } as unknown as never, headers: { 'X-Calling-Service': RoleName.ADMIN } });
      }
      return (res as {data?:{data?:unknown}}).data?.data || (res as {data?:unknown}).data || res;
    },
    intervalMs: 30000,
    enabled: !debouncedSearchQuery,
    onData: (response) => {
        if (!debouncedSearchQuery) {
            const page = asUntyped<WirePage<unknown>>(response);
            const content = page.content ?? (Array.isArray(response) ? response : []);
            setUsers(Array.isArray(content) ? content : []);
            if (page.totalPages !== undefined) {
                setTotalPages(page.totalPages);
            }
        }
    }
  });

  useEffect(() => {
    if (!debouncedSearchQuery) return;
    const fetchUsers = async () => {
      try {
        const res = await identityApi.internalUser.get('/api/v1/internal/users/:id', { params: { id: debouncedSearchQuery }, headers: { 'X-Calling-Service': RoleName.ADMIN } });
        // @ts-expect-error auto-migration type suppression
        if (res && (res as AdminUser).id) {
          setUsers([res as unknown as AdminUser]);
        } else {
          setUsers([]);
        }
      } catch (e: unknown) {
        console.error(e);
        setUsers([]);
      }
    };
    fetchUsers();
  }, [debouncedSearchQuery]);

  const fetchUserActiveOrders = async (userId: string) => {
    try {
      const res = await customerApi.adminOrder.get('/api/v1/internal/admin/orders/user/:userId/active', { params: { userId }, queries: { pageable: { page: 0, size: 20 } } as unknown as never, headers: { 'X-Calling-Service': 'ADMIN' } as unknown as never });
      const data = asUntyped<WirePage<unknown>>(res).content ?? res;
      setUserActiveOrders(Array.isArray(data) ? data as Order[] : []);
    } catch (e: unknown) {
      console.error(e);
      setUserActiveOrders([]);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserActiveOrders(selectedUser.id);
    } else {
      setUserActiveOrders([]);
    }
  }, [selectedUser]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;
    const validation = roleSchema.safeParse(newRole);
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }
    
    // Optimistic UI Update
    setSelectedUser({ ...selectedUser, roles: [...(selectedUser.roles || []), newRole] });
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, roles: [...(u.roles || []), newRole] } : u));
    
    try {
      await identityApi.internalUser.post('/api/v1/internal/users/:id/roles', { roleName: newRole as "CUSTOMER" | "DELIVERY" | "RESTAURANT" | "ADMIN" }, { params: { id: selectedUser.id }, headers: { 'X-Calling-Service': RoleName.ADMIN } } as unknown as never);
      setNewRole('');
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to add role").message);
      fetchByRole(); // Revert
      setSelectedUser((prev: AdminUser | null) => prev ? { ...prev, roles: prev.roles.filter((r: string) => r !== newRole) } : null);
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!selectedUser) return;
    
    // Optimistic UI Update
    setSelectedUser({ ...selectedUser, roles: selectedUser.roles.filter((r: string) => r !== role) });
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, roles: u.roles.filter((r: string) => r !== role) } : u));

    try {
      await identityApi.internalUser.delete('/api/v1/internal/users/:id/roles/:roleName', undefined, { params: { id: selectedUser.id, roleName: role as "CUSTOMER" | "DELIVERY" | "RESTAURANT" | "ADMIN" }, headers: { 'X-Calling-Service': RoleName.ADMIN } as unknown as never });
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to remove role").message);
      fetchByRole(); // Revert
      setSelectedUser((prev: AdminUser | null) => prev ? { ...prev, roles: [...prev.roles, role] } : null);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    const newStatus = !selectedUser.isActive;
    
    // Optimistic UI update
    setSelectedUser({ ...selectedUser, isActive: newStatus });
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, isActive: newStatus } : u));

    try {
      await identityApi.internalUser.put('/api/v1/internal/users/admin/:userId/status', { isActive: newStatus }, { params: { userId: selectedUser.id } });
      showSuccess(newStatus ? "User activated" : "User suspended");
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to update user status").message);
      fetchByRole();
      setSelectedUser({ ...selectedUser, isActive: !newStatus });
    }
  };

  return (
    <div className="flex-1 flex p-6 gap-6 h-full overflow-hidden">
        <div className="w-1/3 flex flex-col glass-panel p-4 shrink-0">
        <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Select 
              value={roleFilter} 
              onChange={(val) => { setRoleFilter(val as RoleName | 'ALL'); setPage(0); }}
              options={[
                { value: 'ALL', label: 'ALL ROLES' },
                { value: RoleName.ADMIN, label: 'ADMIN' },
                { value: RoleName.CUSTOMER, label: 'CUSTOMER' },
                { value: RoleName.RESTAURANT, label: 'RESTAURANT' },
                { value: RoleName.DELIVERY, label: 'DELIVERY' }
              ]}
            />
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="User ID / Phone" className="flex-1" />
            <Button type="submit" variant="primary" icon={<Search className="w-4 h-4" />}>
              Search
            </Button>
            </form>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2">
            {users.map(user => (
                <button 
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-4 mb-2 transition-all duration-300 ${selectedUser?.id === user.id ? 'glass-card !bg-indigo-500/80 !border-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'glass-card hover:border-indigo-300/50'}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="font-bold">{user.id.substring(0, 8)}...</p>
                        {!user.isActive && <span className="text-xs px-2 py-1 bg-red-500 text-white rounded-full">Suspended</span>}
                    </div>
                    <p className={`text-sm mb-1 ${selectedUser?.id === user.id ? 'text-indigo-100' : 'text-slate-500'}`}>{user.phoneNumber}</p>
                    <div className="flex gap-1 flex-wrap">
                        {(user.roles || []).map((r: string) => (
                            <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">{r}</span>
                        ))}
                    </div>
                </button>
            ))}
            {users.length === 0 && (
                <div className="pt-10">
                  <EmptyState 
                    title="No Users Found"
                    description={`Could not find any users with role ${roleFilter} or matching your search.`}
                    icon={<User className="w-12 h-12" />}
                  />
                </div>
            )}
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/30">
            <Button 
                variant="outline"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
            >
                Prev
            </Button>
            <span className="text-xs font-bold text-slate-500">Page {page + 1} of {totalPages === 0 ? 1 : totalPages}</span>
            <Button 
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
            >
                Next
            </Button>
        </div>
        </div>

        <div className="flex-1 glass-panel p-8 overflow-y-auto">
        {selectedUser ? (
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-3xl font-black mb-1">User Details</h2>
                        <p className="text-slate-500">Manage roles, status, and view history.</p>
                    </div>
                    <Button
                        variant={selectedUser.isActive ? 'danger' : 'outline'}
                        onClick={handleToggleStatus}
                        icon={<Power className="w-4 h-4" />}
                        className={!selectedUser.isActive ? '!bg-emerald-500/10 !text-emerald-500 hover:!bg-emerald-500/20' : ''}
                    >
                        {selectedUser.isActive ? 'Suspend User' : 'Activate User'}
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="glass-card p-4">
                        <p className="text-sm text-slate-500 mb-1">ID</p>
                        <p className="font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-sm text-slate-500 mb-1">Status</p>
                        <p className="font-mono text-sm">
                            <span className={selectedUser.isActive ? 'text-emerald-500' : 'text-rose-500'}>
                                {selectedUser.isActive ? 'Active' : 'Suspended'}
                            </span>
                        </p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-sm text-slate-500 mb-1">Phone</p>
                        <p className="font-bold">{selectedUser.phoneNumber}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-xl mb-4">Roles</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {(selectedUser.roles || []).map((role: string) => (
                            <div key={role} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-sm">
                                {role}
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(role)} className="!text-rose-500">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            type="text" 
                            value={newRole} 
                            onChange={(e) => setNewRole(e.target.value.toUpperCase())} 
                            placeholder="NEW_ROLE"
                        />
                        <Button variant="primary" onClick={handleAddRole} icon={<Plus className="w-4 h-4" />}>
                            Add
                        </Button>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-xl mb-4">Active Orders ({userActiveOrders.length})</h3>
                    {userActiveOrders.length > 0 ? (
                        <div className="space-y-3">
                            {userActiveOrders.map(order => (
                                <div key={order.id} className="glass-card p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-sm">#{order.id?.substring(0, 8)}</p>
                                        <span className="text-xs font-bold px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded-md">{order.status}</span>
                                    </div>
                                    <p className="text-sm text-slate-500">{order.restaurantName}</p>
                                    { }
                                    {/* eslint-disable-next-line react-hooks/purity */}
                                    <p className="text-xs text-slate-500 mt-2">Placed: {new Date(order.createdAt || Date.now()).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm">No active orders for this user.</p>
                    )}
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <User className="w-16 h-16 mb-4 opacity-30" />
                <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-[#f0ede6]">User Management</h2>
                <p>Select a user to view details and manage roles.</p>
            </div>
        )}
        </div>
    </div>
  );
}
