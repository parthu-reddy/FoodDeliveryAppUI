import { Button, Input, Surface, useConfirm } from '@shared/ui';
import { Plus, Power, User, X } from 'lucide-react';
import { OrderResponse } from '@/api/generated/schemas/customer/common';
import { UserDTO } from '@/api/generated/schemas/identity/admin_user_controller';
import { z } from 'zod';

type AdminUser = z.infer<typeof UserDTO>;
type ActiveOrder = z.infer<typeof OrderResponse>;

interface AdminUserDetailPanelProps {
  selectedUser: AdminUser | null;
  userActiveOrders: ActiveOrder[];
  newRole: string;
  setNewRole: (role: string) => void;
  handleAddRole: () => void;
  handleRemoveRole: (role: string) => void;
  handleToggleStatus: () => void;
}

/**
 * The selected user: their roles, their status and their live orders.
 *
 * Split out of AdminUserManagement, which held the list, the search, the paging and this in
 * one 344-line file. It stays a dumb panel — every action is the page's, because the page is
 * what re-reads the list afterwards.
 */
export function AdminUserDetailPanel(props: AdminUserDetailPanelProps) {
  const {
    selectedUser, userActiveOrders, newRole, setNewRole,
    handleAddRole, handleRemoveRole, handleToggleStatus,
  } = props;
  const confirm = useConfirm();

  // The confirmation lives with the control, not with the action: this file is the one that
  // says "Suspend User", and a guard a screen away from its button is a guard nobody sees.
  // Only suspension is destructive — re-activating restores access and needs no ceremony.
  const toggleStatus = async () => {
    if (selectedUser?.active !== false) {
      const ok = await confirm({
        title: `Suspend ${selectedUser?.name || 'this user'}?`,
        description:
          'They will be signed out and unable to use the platform until an admin re-activates '
          + 'them. Any order in flight is unaffected.',
        confirmLabel: 'Suspend user',
        tone: 'danger',
      });
      if (!ok) return;
    }
    handleToggleStatus();
  };

  return (
    <Surface elevation={2} radius="xl" className="flex-1 p-8 overflow-y-auto">
    {selectedUser ? (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-3xl font-black mb-1">User Details</h2>
                    <p className="text-slate-500">Manage roles, status, and view history.</p>
                </div>
                <Button
                    variant={selectedUser.active !== false ? 'danger' : 'outline'}
                    onClick={toggleStatus}
                    icon={<Power className="w-4 h-4" />}
                    className={selectedUser.active === false ? '!bg-amber-500/10 !text-amber-500 hover:!bg-amber-500/20' : ''}
                >
                    {selectedUser.active !== false ? 'Suspend User' : 'Activate User'}
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <Surface elevation={2} radius="lg" className="p-4">
                    <p className="text-sm text-slate-500 mb-1">ID</p>
                    <p className="font-mono text-sm">{selectedUser.id}</p>
                </Surface>
                <Surface elevation={2} radius="lg" className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <p className="font-mono text-sm">
                        <span className={selectedUser.active !== false ? 'text-amber-500' : 'text-rose-500'}>
                            {selectedUser.active !== false ? 'Active' : 'Suspended'}
                        </span>
                    </p>
                </Surface>
                <Surface elevation={2} radius="lg" className="p-4">
                    <p className="text-sm text-slate-500 mb-1">Phone</p>
                    <p className="font-bold">{selectedUser.phoneNumber}</p>
                </Surface>
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
                            <Surface elevation={2} radius="lg" key={order.id} className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-sm">#{order.id?.substring(0, 8)}</p>
                                    <span className="text-xs font-bold px-2 py-1 bg-rose-500/20 text-rose-400 rounded-md">{order.status}</span>
                                </div>
                                <p className="text-sm text-slate-500">{order.restaurantName}</p>
                                { }
                                {/* eslint-disable-next-line react-hooks/purity */}
                                <p className="text-xs text-slate-500 mt-2">Placed: {new Date(order.createdAt || Date.now()).toLocaleString()}</p>
                            </Surface>
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
    </Surface>
  );
}
