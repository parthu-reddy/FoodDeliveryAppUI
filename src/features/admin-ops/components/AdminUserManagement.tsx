import { useToast } from "@/contexts/ToastContext";
import { useDebounce } from "@/hooks/useDebounce";
import { usePolling } from "@/hooks/usePolling";
import { parseApiError } from '@/lib/parseApiError';
import { customerApi, identityApi } from "@/lib/zodiosClients";
import { RoleName } from "@/types";
import { Button, EmptyState, Input, Select, Surface, surfaceStyle } from '@shared/ui';
import { Search, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { AdminUserDetailPanel } from '@features/admin-ops/components/AdminUserDetailPanel';
import { userLookup } from '@features/admin-ops/model/userLookup';
import { UserDTO } from '@/api/generated/schemas/identity/admin_user_controller';
import { OrderResponse } from '@/api/generated/schemas/customer/common';

type AdminUser = z.infer<typeof UserDTO>;
type ActiveOrder = z.infer<typeof OrderResponse>;
type ManagedRole = AdminUser['roles'][number];

const MANAGEABLE_ROLES: readonly ManagedRole[] = [
  RoleName.ADMIN,
  RoleName.CUSTOMER,
  RoleName.RESTAURANT,
  RoleName.DELIVERY,
];

export default function AdminUserManagement() {
  const { showSuccess, showError } = useToast();
  const [roleFilter, setRoleFilter] = useState<RoleName | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<ManagedRole | ''>('');
  const [roleOperation, setRoleOperation] = useState<{ type: 'add' | 'remove'; role: ManagedRole } | null>(null);
  const [statusOperation, setStatusOperation] = useState<{ userId: string; targetActive: boolean } | null>(null);
  const statusOperationRef = useRef(false);
  const activeOrdersRequestRef = useRef(0);
  const [userActiveOrders, setUserActiveOrders] = useState<ActiveOrder[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Polling for users by role
  usePolling({
    fetchFn: async () => {
      let res;
      if (roleFilter === 'ALL') {
          res = await identityApi.adminUser.get('/api/v1/internal/admin/users/all', { queries: { page } });
      } else {
          res = await identityApi.adminUser.get('/api/v1/internal/admin/users/by-role', { queries: { role: roleFilter as "CUSTOMER"|"DELIVERY"|"RESTAURANT"|"ADMIN", page }, headers: { 'X-Calling-Service': RoleName.ADMIN } });
      }
      return res.data;
    },
    intervalMs: 30000,
    enabled: !debouncedSearchQuery,
    refreshKey: `${roleFilter}:${page}`,
    onData: (response) => {
        if (!debouncedSearchQuery) {
            const page = response;
            if (page) {
              const content = page.content ?? [];
              setUsers(content);
              if (page.totalPages !== undefined) {
                  setTotalPages(page.totalPages);
              }
            }
        }
    }
  });

  useEffect(() => {
    if (!debouncedSearchQuery) return;
    const fetchUsers = async () => {
      // "User ID / Phone": a phone number used to go to /users/:id, which takes only a UUID.
      const lookup = userLookup(debouncedSearchQuery);
      if (!lookup) {
        setUsers([]);
        return;
      }
      try {
        const res = lookup.kind === 'id'
          ? await identityApi.adminUser.get('/api/v1/internal/admin/users/:id', { params: { id: lookup.id }, headers: { 'X-Calling-Service': RoleName.ADMIN } })
          : await identityApi.adminUser.get('/api/v1/internal/admin/users/by-phone', { queries: { phone: lookup.phone } });
        if (res?.data?.id) {
          if (res.data) setUsers([res.data]);
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

  useEffect(() => {
    const requestId = ++activeOrdersRequestRef.current;
    const userId = selectedUser?.id;
    // A detail panel must never briefly show the previous user's live orders while the next
    // request is in flight.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserActiveOrders([]);
    if (!userId) return;

    void (async () => {
      try {
        const res = await customerApi.adminOrder.get('/api/v1/internal/admin/orders/user/:userId/active', {
          params: { userId },
          queries: { page: 0, size: 20 },
        });
        if (activeOrdersRequestRef.current === requestId) {
          setUserActiveOrders(res.data?.content ?? []);
        }
      } catch (e: unknown) {
        console.error(e);
        if (activeOrdersRequestRef.current === requestId) {
          setUserActiveOrders([]);
        }
      }
    })();
  }, [selectedUser?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleAddRole = async () => {
    const user = selectedUser;
    const role = newRole;
    if (!user || !role || roleOperation) return;
    if (user.roles.includes(role)) {
      showError(`${role} is already assigned to this user`);
      return;
    }

    setRoleOperation({ type: 'add', role });
    try {
      await identityApi.adminUser.post('/api/v1/internal/admin/users/:id/roles', { serviceName: "CustomerApplication", roleName: role }, { params: { id: user.id }, headers: { 'X-Calling-Service': RoleName.ADMIN } });
      const appendRole = (candidate: AdminUser) => candidate.roles.includes(role)
        ? candidate
        : { ...candidate, roles: [...candidate.roles, role] };
      setSelectedUser((current) => current?.id === user.id ? appendRole(current) : current);
      setUsers((current) => current.map((candidate) => candidate.id === user.id ? appendRole(candidate) : candidate));
      setNewRole('');
      showSuccess('Role added');
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to add role").message);
    } finally {
      setRoleOperation(null);
    }
  };

  const handleRemoveRole = async (role: ManagedRole) => {
    const user = selectedUser;
    if (!user || roleOperation) return;

    setRoleOperation({ type: 'remove', role });
    try {
      await identityApi.adminUser.delete('/api/v1/internal/admin/users/:id/roles/:roleName', undefined, { params: { id: user.id, roleName: role }, headers: { 'X-Calling-Service': RoleName.ADMIN } });
      const removeRole = (candidate: AdminUser) => ({
        ...candidate,
        roles: candidate.roles.filter((candidateRole) => candidateRole !== role),
      });
      setSelectedUser((current) => current?.id === user.id ? removeRole(current) : current);
      setUsers((current) => current.map((candidate) => candidate.id === user.id ? removeRole(candidate) : candidate));
      showSuccess('Role removed');
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to remove role").message);
    } finally {
      setRoleOperation(null);
    }
  };

  const handleToggleStatus = async () => {
    const user = selectedUser;
    if (!user || statusOperationRef.current) return;
    const newStatus = user.active === false;

    // The request guard is synchronous so a double click cannot issue a second write before
    // React has rendered the disabled control below.
    statusOperationRef.current = true;
    setStatusOperation({ userId: user.id, targetActive: newStatus });

    try {
      const result = await identityApi.adminUser.put('/api/v1/internal/admin/users/:userId/status', { isActive: newStatus }, { params: { userId: user.id } });
      if (result.success === false) {
        throw new Error(result.message || 'The server did not confirm the user status update');
      }

      // The status endpoint confirms its command rather than returning a UserDTO. Reflect the
      // change only after that confirmation, and only if this user is still selected.
      const updateStatus = (candidate: AdminUser) => candidate.id === user.id
        ? { ...candidate, active: newStatus }
        : candidate;
      setSelectedUser((current) => current?.id === user.id ? updateStatus(current) : current);
      setUsers((current) => current.map(updateStatus));
      showSuccess(newStatus ? "User activated" : "User suspended");
    } catch (e: unknown) {
      console.error(e);
      showError(parseApiError(e, "Failed to update user status").message);
    }
    finally {
      statusOperationRef.current = false;
      setStatusOperation(null);
    }
  };

  return (
    <div className="flex-1 flex p-6 gap-6 h-full overflow-hidden">
        <Surface elevation={2} radius="xl" className="w-1/3 flex flex-col p-4 shrink-0">
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
                    style={surfaceStyle({ variant: 'glass-chrome', elevation: 3, radius: 'lg' })}
                    className={`w-full text-left p-4 mb-2 transition duration-300 ${selectedUser?.id === user.id ? '!bg-rose-500/80 !border-rose-500 text-white ' : 'hover:border-rose-300/50'}`}
                >
                    <div className="flex items-center justify-between">
                        <p className="font-bold">{user.id.substring(0, 8)}...</p>
                        {user.active === false && <span className="text-xs px-2 py-1 bg-rose-500 text-white rounded-full">Suspended</span>}
                    </div>
                    <p className={`text-sm mb-1 ${selectedUser?.id === user.id ? 'text-rose-100' : 'text-slate-500'}`}>{user.phoneNumber}</p>
                    <div className="flex gap-1 flex-wrap">
                        {(user.roles || []).map((r: string) => (
                            <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">{r}</span>
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
        <Surface elevation={0} className="mt-2 pt-2 border-t flex justify-between items-center">
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
        </Surface>
        </Surface>

        <AdminUserDetailPanel
          selectedUser={selectedUser}
          userActiveOrders={userActiveOrders}
          newRole={newRole}
          setNewRole={setNewRole}
          handleAddRole={handleAddRole}
          handleRemoveRole={handleRemoveRole}
          handleToggleStatus={handleToggleStatus}
          roleOptions={MANAGEABLE_ROLES.map((role) => ({
            value: role,
            label: role,
            disabled: selectedUser?.roles.includes(role),
          }))}
          roleOperation={roleOperation}
          statusOperation={statusOperation}
        />
    </div>
  );
}
