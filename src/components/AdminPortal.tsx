import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/apiClient';
import { Search, Shield, User, X, LogOut, Sun, Moon, Plus, Trash2, Package, Truck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LaBouffeLogo from './LaBouffeLogo';

export default function AdminPortal({
  onLogout,
  theme,
  onToggleTheme
}: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'by-role' | 'categories' | 'deliveries'>('search');
  const [roleFilter, setRoleFilter] = useState('ADMIN');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  const [unassignedOrders, setUnassignedOrders] = useState<any[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchByRole = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/users/by-role?role=${roleFilter}`);
      setUsers(Array.isArray(res) ? res : []);
    } catch(e) {
      console.error(e);
      setUsers([]);
    }
  };

  const fetchUnassignedOrders = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/admin/orders/unassigned`);
      setUnassignedOrders(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setUnassignedOrders([]);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const res = await apiGet(`/api/v1/internal/admin/delivery/drivers/available`);
      setAvailableDrivers(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setAvailableDrivers([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'by-role') {
      fetchByRole();
    } else if (activeTab === 'deliveries') {
      fetchUnassignedOrders();
      fetchAvailableDrivers();
    }
  }, [activeTab, roleFilter]);

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
    try {
      await apiPost(`/api/v1/internal/users/${selectedUser.id}/roles`, { role: newRole });
      setSelectedUser({ ...selectedUser, roles: [...(selectedUser.roles || []), newRole] });
      setNewRole('');
    } catch (e) {
      console.error(e);
      alert("Failed to add role");
    }
  };

  const handleRemoveRole = async (role: string) => {
    if (!selectedUser) return;
    try {
      await apiDelete(`/api/v1/internal/users/${selectedUser.id}/roles/${role}`);
      setSelectedUser({ ...selectedUser, roles: selectedUser.roles.filter((r: string) => r !== role) });
    } catch (e) {
      console.error(e);
      alert("Failed to remove role");
    }
  };

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    try {
      await apiPost(`/api/v1/internal/admin/delivery/orders/${orderId}/assign?driverId=${driverId}`);
      alert("Driver assigned successfully!");
      fetchUnassignedOrders();
      fetchAvailableDrivers();
      setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      alert("Failed to assign driver");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-slate-800 dark:text-[#f0ede6] h-full shadow-2xl">
      <header className="sticky top-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-rose-500/20 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <LaBouffeLogo showText={false} iconSize="w-8 h-8" textColorClass="text-slate-800 dark:text-[#f0ede6]" subColorClass="text-rose-500" />
          <h1 className="font-black text-xl tracking-tight hidden sm:block">Admin Portal</h1>
        </div>
        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button onClick={onToggleTheme} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex gap-6">
        <div className="w-1/2 flex flex-col space-y-6">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('search')} className={`flex-1 min-w-[100px] py-2 rounded-xl text-sm font-bold ${activeTab === 'search' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Search User</button>
            <button onClick={() => setActiveTab('by-role')} className={`flex-1 min-w-[100px] py-2 rounded-xl text-sm font-bold ${activeTab === 'by-role' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>By Role</button>
            <button onClick={() => setActiveTab('categories')} className={`flex-1 min-w-[100px] py-2 rounded-xl text-sm font-bold ${activeTab === 'categories' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Categories</button>
            <button onClick={() => setActiveTab('deliveries')} className={`flex-1 min-w-[100px] py-2 rounded-xl text-sm font-bold ${activeTab === 'deliveries' ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>Deliveries</button>
          </div>

          {activeTab === 'categories' ? (
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Global Categories</h3>
              <p className="text-sm text-slate-500">Manage application-wide restaurant and menu categories (Catalog Service).</p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const nameInput = form.elements.namedItem('categoryName') as HTMLInputElement;
                const descInput = form.elements.namedItem('categoryDesc') as HTMLInputElement;
                if (!nameInput.value) return;
                try {
                  await apiPost('/api/v1/restaurants/categories', { name: nameInput.value, description: descInput.value });
                  alert('Category created successfully');
                  nameInput.value = '';
                  descInput.value = '';
                } catch(e) {
                  console.error(e);
                  alert('Failed to create category');
                }
              }} className="space-y-4">
                <input type="text" name="categoryName" placeholder="Category Name (e.g. Italian, Vegan)" className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                <input type="text" name="categoryDesc" placeholder="Description" className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold w-full">Create Category</button>
              </form>
            </div>
          ) : activeTab === 'deliveries' ? (
             <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg">Unassigned Orders</h3>
                    <button onClick={fetchUnassignedOrders} className="text-sm font-bold text-indigo-500 hover:underline">Refresh</button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-2">
                  {unassignedOrders.map(order => (
                    <button key={order.id} onClick={() => setSelectedOrder(order)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedOrder?.id === order.id ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-300'}`}>
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">Order #{order.id.substring(0, 8)}</p>
                        <p className="text-xs text-slate-500 truncate">{order.restaurantName}</p>
                      </div>
                    </button>
                  ))}
                  {unassignedOrders.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No unassigned orders found.</p>}
                </div>
             </div>
          ) : (
            <>
              {activeTab === 'search' && (
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter User ID or Phone" className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500" />
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-bold"><Search className="w-4 h-4" /></button>
                </form>
              )}

              {activeTab === 'by-role' && (
                <div className="flex gap-2">
                  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <option value="ADMIN">ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="RESTAURANT">RESTAURANT</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-2">
                {users.map(u => (
                  <button key={u.id} onClick={() => setSelectedUser(u)} className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedUser?.id === u.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-300'}`}>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{u.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500 truncate">{u.phone}</p>
                    </div>
                  </button>
                ))}
                {users.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No users found.</p>}
              </div>
            </>
          )}
        </div>

        <div className="w-1/2 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
          {activeTab === 'deliveries' ? (
              selectedOrder ? (
                  <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Package className="w-8 h-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black">Order #{selectedOrder.id.substring(0, 8)}</h2>
                          <p className="text-sm text-slate-500 mt-1">Restaurant: {selectedOrder.restaurantName}</p>
                          <p className="text-sm text-slate-500">Status: {selectedOrder.status.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex flex-col space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                            <h3 className="font-bold text-lg">Available Drivers</h3>
                            <button onClick={fetchAvailableDrivers} className="text-sm font-bold text-indigo-500 hover:underline">Refresh</button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3">
                          {availableDrivers.map(driver => (
                              <div key={driver.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <Truck className="w-5 h-5 text-slate-500" />
                                      </div>
                                      <div>
                                          <p className="font-bold text-sm">{driver.fullName || 'Unknown Driver'}</p>
                                          <p className="text-xs text-slate-500">{driver.phoneNumber}</p>
                                      </div>
                                  </div>
                                  <button onClick={() => handleAssignDriver(selectedOrder.id, driver.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                      <Check className="w-4 h-4" />
                                      Assign
                                  </button>
                              </div>
                          ))}
                          {availableDrivers.length === 0 && <p className="text-center text-slate-400 text-sm mt-10">No available drivers found.</p>}
                        </div>
                      </div>
                  </>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 mb-4 opacity-50" />
                      <p>Select an order to assign a driver</p>
                  </div>
              )
          ) : (
              selectedUser ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{selectedUser.name || 'User Details'}</h2>
                      <p className="text-sm text-slate-500 font-mono mt-1">ID: {selectedUser.id}</p>
                      <p className="text-sm text-slate-500 font-mono">Phone: {selectedUser.phone}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <h3 className="font-bold text-lg border-b border-slate-200 dark:border-slate-700 pb-2">Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {(selectedUser.roles || []).map((r: string) => (
                        <div key={r} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200 dark:bg-slate-800 text-sm font-bold">
                          <span>{r}</span>
                          <button onClick={() => handleRemoveRole(r)} className="p-0.5 rounded-full hover:bg-rose-500 hover:text-white transition-colors text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 flex gap-2">
                      <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value.toUpperCase())} placeholder="e.g. ADMIN, CUSTOMER" className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700" />
                      <button onClick={handleAddRole} className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Role
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <User className="w-12 h-12 mb-4 opacity-50" />
                  <p>Select a user to manage roles</p>
                </div>
              )
          )}
        </div>
      </div>
    </div>
  );
}
