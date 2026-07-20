import { RoleName } from '../types';
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/apiClient';
import { useToast } from '../context/ToastContext';
import { Search, Shield, User, X, LogOut, Sun, Moon, Plus, Package, Truck, Check, MapPin, Users, Activity, Tags, Navigation } from 'lucide-react';
import LaBouffeLogo from './LaBouffeLogo';
import AdminAssignmentMap from './AdminAssignmentMap';
import AdminFleetMap from './AdminFleetMap';
import { z } from 'zod';

const roleSchema = z.string().min(2, "Role must be at least 2 characters").max(50, "Role cannot exceed 50 characters").regex(/^[A-Z_]+$/, "Role must contain only uppercase letters and underscores");

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required").max(100, "Category name cannot exceed 100 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional()
});

export default function AdminPortal({
  onLogout,
  theme,
  onToggleTheme
}: any) {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'users' | 'categories' | 'map'>('map');
  const { showSuccess, showError } = useToast();

  // deliveries state
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // users state
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleName>(RoleName.ADMIN);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [userActiveOrders, setUserActiveOrders] = useState<any[]>([]);

  // fetches
  const fetchActiveOrders = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/admin/orders/active-all`);
      setActiveOrders(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setActiveOrders([]);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/admin/delivery/drivers/available-with-location`);
      console.log("fetchAvailableDrivers response:", res);
      setAvailableDrivers(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error("fetchAvailableDrivers error:", e);
      setAvailableDrivers([]);
    }
  };

  const fetchByRole = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/users/by-role?role=${roleFilter}`);
      setUsers(Array.isArray(res) ? res : []);
    } catch(e) {
      console.error(e);
      setUsers([]);
    }
  };

  const fetchUserActiveOrders = async (userId: string) => {
    try {
      const res = await apiGet(`/api/v1/internal/admin/orders/user/${userId}/active`);
      setUserActiveOrders(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setUserActiveOrders([]);
    }
  };

  // effects
  useEffect(() => {
    if (activeTab === 'deliveries') {
      fetchActiveOrders();
      fetchAvailableDrivers();
    } else if (activeTab === 'users') {
      fetchByRole();
    }
  }, [activeTab, roleFilter]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserActiveOrders(selectedUser.id);
    } else {
      setUserActiveOrders([]);
    }
  }, [selectedUser]);

  // handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    try {
      const res = await apiGet(`/api/v1/internal/users/${searchQuery}`);
      if (res && res.id) {
        setUsers([res]);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error(e);
      setUsers([]);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;
    const validation = roleSchema.safeParse(newRole);
    if (!validation.success) {
      showError(validation.error.issues[0].message);
      return;
    }
    try {
      await apiPost(`/api/v1/internal/users/${selectedUser.id}/roles`, { role: newRole });
      setSelectedUser({ ...selectedUser, roles: [...(selectedUser.roles || []), newRole] });
      setNewRole('');
    } catch (e) {
      console.error(e);
      showError("Failed to add role");
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!selectedUser) return;
    try {
      await apiDelete(`/api/v1/internal/users/${selectedUser.id}/roles/${role}`);
      setSelectedUser({ ...selectedUser, roles: selectedUser.roles.filter((r: string) => r !== role) });
    } catch (e) {
      console.error(e);
      showError("Failed to remove role");
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      await apiPost(`/api/v1/internal/admin/delivery/orders/${orderId}/assign?driverId=${driverId}`);
      showSuccess("Driver assigned successfully!");
      fetchActiveOrders();
      fetchAvailableDrivers();
      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      showError("Failed to assign driver");
    }
  };

  return (
    <div className="flex w-full h-full bg-transparent overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white/20 dark:bg-slate-900/40 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-rose-500/20">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6]" subColorClass="text-rose-500" />
          <h1 className="font-black text-xl tracking-tight text-slate-800 dark:text-[#f0ede6]">Admin</h1>
        </div>
        
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveTab('deliveries')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'deliveries' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40'}`}
          >
            <Activity className="w-5 h-5" /> Live Operations
          </button>
          
          <button 
            onClick={() => setActiveTab('users')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40'}`}
          >
            <Users className="w-5 h-5" /> User Management
          </button>
          
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'categories' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40'}`}
          >
            <Tags className="w-5 h-5" /> Categories
          </button>
          
          <button 
            onClick={() => setActiveTab('map')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'map' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-800/40'}`}
          >
            <MapPin className="w-5 h-5" /> Fleet Map
          </button>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {onToggleTheme && (
                <button onClick={onToggleTheme} className="p-2.5 rounded-xl bg-white/20 dark:bg-slate-800/20 backdrop-blur-md hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </button>
            )}
            {onLogout && (
                <button onClick={onLogout} className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-all font-bold flex items-center gap-2 backdrop-blur-md border border-rose-500/20">
                <LogOut className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent text-slate-800 dark:text-[#f0ede6]">
        {activeTab === 'map' && (
            <div className="flex-1 flex w-full h-full relative overflow-hidden">
                <AdminFleetMap />
            </div>
        )}
        
        {activeTab === 'deliveries' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
             {/* Live Orders List */}
             <div className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-950/20 backdrop-blur-xl shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white/20 dark:bg-slate-900/30">
                    <h3 className="font-black text-lg">Active Orders</h3>
                    <button onClick={() => { fetchActiveOrders(); fetchAvailableDrivers(); }} className="text-sm font-bold text-indigo-500 hover:underline">Refresh</button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {activeOrders.map(order => {
                        const isUnassigned = !order.deliveryExecutiveId;
                        const statusColor = isUnassigned ? 'text-amber-500' : 'text-emerald-500';
                        return (
                            <button 
                                key={order.id} 
                                onClick={() => setSelectedOrder(order)} 
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedOrder?.id === order.id ? 'bg-indigo-500/10 border-indigo-500 shadow-md' : 'bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isUnassigned ? 'bg-amber-500/20' : 'bg-emerald-500/20'}`}>
                                    <Package className={`w-5 h-5 ${statusColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">#{order.id.substring(0, 8)}</p>
                                    <p className="text-xs text-slate-500 truncate">{order.restaurantName}</p>
                                </div>
                                <div className="shrink-0 flex flex-col items-end">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200/50 dark:bg-slate-800/50 ${statusColor}`}>
                                        {isUnassigned ? 'NEEDS DRIVER' : 'ASSIGNED'}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                    {activeOrders.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No active orders right now.</p>}
                </div>
             </div>

             {/* Main Map View */}
             <div className="flex-1 flex flex-col bg-slate-50 dark:bg-[#0f111a] relative">
                {selectedOrder ? (
                    <div className="absolute inset-0 flex flex-col">
                        <div className="flex-1 relative z-0">
                            <AdminAssignmentMap 
                                order={selectedOrder} 
                                availableDrivers={availableDrivers} 
                                onAssign={handleAssignDriver} 
                            />
                        </div>
                        {/* Assignment Panel */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl z-10 flex gap-6">
                            <div className="flex-1 border-r border-slate-200 dark:border-slate-700 pr-6">
                                <h2 className="text-2xl font-black mb-1">Order #{selectedOrder.id.substring(0, 8)}</h2>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Restaurant: {selectedOrder.restaurantName}</p>
                                <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Status: <span className="text-indigo-500 font-bold">{selectedOrder.status.replace(/_/g, ' ')}</span></p>
                            </div>
                            <div className="w-1/2">
                                <h3 className="font-bold text-lg mb-3">Available Drivers ({availableDrivers.length})</h3>
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                                    {availableDrivers.map(driver => (
                                        <div key={driver.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <Truck className="w-5 h-5 text-indigo-500" />
                                                <div>
                                                    <p className="font-bold text-sm">{driver.fullName || 'Unknown Driver'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleAssignDriver(selectedOrder.id, driver.id)} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                    {availableDrivers.length === 0 && <p className="text-sm text-slate-500">No available drivers nearby.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Navigation className="w-16 h-16 mb-4 opacity-30 text-indigo-500" />
                        <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-[#f0ede6]">Live Operations</h2>
                        <p>Select an active order from the left pane to monitor it or assign a driver.</p>
                    </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex-1 flex p-6 gap-6 h-full overflow-hidden">
             <div className="w-1/3 flex flex-col bg-white/10 dark:bg-slate-900/20 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shrink-0 shadow-xl">
                <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as RoleName)} className="w-1/3 px-3 py-2 rounded-xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-sm font-bold focus:outline-none focus:border-indigo-500">
                    <option value={RoleName.ADMIN}>ADMIN</option>
                    <option value={RoleName.CUSTOMER}>CUSTOMER</option>
                    <option value={RoleName.RESTAURANT}>RESTAURANT</option>
                    <option value={RoleName.DELIVERY}>DELIVERY</option>
                  </select>
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="User ID / Phone" className="flex-1 w-full px-3 py-2 rounded-xl bg-white/20 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
                    <button type="submit" className="px-3 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-600 dark:text-indigo-400 font-bold"><Search className="w-4 h-4" /></button>
                  </form>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2">
                    {users.map(u => (
                        <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedUser?.id === u.id ? 'bg-indigo-500/10 border-indigo-500 shadow-md' : 'bg-white/20 dark:bg-slate-900/40 backdrop-blur-md border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}>
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{u.name || 'Unknown User'}</p>
                                <p className="text-xs text-slate-500 truncate">{u.phone}</p>
                            </div>
                        </button>
                    ))}
                    {users.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No users found.</p>}
                </div>
             </div>

             <div className="flex-1 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col shadow-xl overflow-y-auto">
                 {selectedUser ? (
                    <>
                        <div className="flex items-center gap-5 mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
                            <div className="w-20 h-20 rounded-3xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/30">
                            <Shield className="w-10 h-10" />
                            </div>
                            <div>
                            <h2 className="text-3xl font-black mb-1">{selectedUser.name || 'User Details'}</h2>
                            <p className="text-sm text-slate-500 font-mono">ID: {selectedUser.id}</p>
                            <p className="text-sm text-slate-500 font-mono">Phone: {selectedUser.phone}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-indigo-500">Roles & Permissions</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                {(selectedUser.roles || []).map((r: string) => (
                                    <div key={r} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/30 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-bold shadow-sm">
                                    <span>{r}</span>
                                    <button onClick={() => handleRemoveRole(r)} className="p-1 rounded-full hover:bg-rose-500 hover:text-white transition-colors text-slate-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                    </div>
                                ))}
                                </div>
                                <div className="flex gap-2">
                                <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value.toUpperCase())} placeholder="Add Role (e.g. ADMIN)" className="flex-1 px-4 py-2 rounded-xl bg-white/30 dark:bg-slate-800/40 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-500" />
                                <button onClick={handleAddRole} className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm">
                                    <Plus className="w-4 h-4" /> Add
                                </button>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-lg mb-4 text-indigo-500">Active Orders</h3>
                                <div className="space-y-3">
                                    {userActiveOrders.map(order => (
                                        <div key={order.id} className="p-4 rounded-2xl bg-white/30 dark:bg-slate-800/30 backdrop-blur-md border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-sm">#{order.id.substring(0, 8)}</p>
                                                <p className="text-xs text-slate-500 font-bold mt-1 text-amber-500">{order.status}</p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    setActiveTab('deliveries');
                                                    setSelectedOrder(order);
                                                }}
                                                className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-xs hover:bg-indigo-500/20 transition-colors"
                                            >
                                                View on Map
                                            </button>
                                        </div>
                                    ))}
                                    {userActiveOrders.length === 0 && (
                                        <p className="text-sm text-slate-500">No active orders found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <Users className="w-16 h-16 mb-4 opacity-30 text-indigo-500" />
                        <h2 className="text-2xl font-black mb-2 text-slate-800 dark:text-[#f0ede6]">User Management</h2>
                        <p>Select a user to view their details and manage their roles.</p>
                    </div>
                 )}
             </div>
          </div>
        )}

        {activeTab === 'categories' && (
           <div className="p-8 h-full">
              <div className="max-w-2xl mx-auto bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-200 dark:border-slate-700 pb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Tags className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black mb-1">Global Categories</h2>
                        <p className="text-slate-500">Manage application-wide restaurant and menu categories.</p>
                    </div>
                </div>
                
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const nameInput = form.elements.namedItem('categoryName') as HTMLInputElement;
                    const descInput = form.elements.namedItem('categoryDesc') as HTMLInputElement;
                    if (!nameInput.value) return;

                    const validation = categorySchema.safeParse({ name: nameInput.value, description: descInput.value });
                    if (!validation.success) {
                      showError(validation.error.issues[0].message);
                      return;
                    }

                    try {
                    await apiPost('/api/v1/restaurants/categories', { name: nameInput.value, description: descInput.value });
                    showSuccess('Category created successfully');
                    nameInput.value = '';
                    descInput.value = '';
                    } catch(e) {
                    console.error(e);
                    showError('Failed to create category');
                    }
                }} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Category Name</label>
                        <input type="text" name="categoryName" placeholder="e.g. Italian, Vegan, Burgers" className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">Description</label>
                        <textarea name="categoryDesc" placeholder="Brief description of the category..." className="w-full px-5 py-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px]" />
                    </div>
                    <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2">
                        <Plus className="w-6 h-6" /> Create Category
                    </button>
                </form>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
