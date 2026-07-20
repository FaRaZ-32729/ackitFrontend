import React, { useEffect, useMemo, useState } from 'react';
import { useManagerWorkspace } from '../context/ManagerWorkspaceContext';
import { useAppContext } from '../../context/AppContext';
import { Users, User, Edit, Trash2, MapPin, Building2, Loader2 } from 'lucide-react';
import { MultiSelectDropdown } from '../../components/ui/MultiSelectDropdown';
import { CustomDropdown } from '../../components/ui/CustomDropdown';
import axios from 'axios';

/** Manager users page — markup/CSS preserved from legacy ManagerView */
export function UsersPage() {
  const {
    fetchMyUsers,
    fetchMyVenues,
    usersLoading,
    usersError,
    user: authUser,
  } = useAppContext();

  const {
    units, users, orgs, venues,
    onAddUser,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail,
    newUserPermission, setNewUserPermission, newUserOrgs, setNewUserOrgs,
    newUserVenues, setNewUserVenues,
    editingUser, setEditingUser,
    deletingId, setDeletingId, deleteType, setDeleteType,
    openUserDetailModal,
  } = useManagerWorkspace();

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    void Promise.allSettled([fetchMyUsers(), fetchMyVenues()]);
  }, [fetchMyUsers, fetchMyVenues]);

  const venueOptions = useMemo(() => {
    const selectedOrgs = newUserOrgs.length > 0 ? newUserOrgs : orgs.map((o) => o.id);
    return venues
      .filter((v) => selectedOrgs.includes(v.orgId))
      .map((v) => ({ value: v.id, label: v.name }));
  }, [venues, newUserOrgs, orgs]);

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || newUserOrgs.length === 0 || creating) {
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await onAddUser({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        status: 'pending',
        assignedVenueIds: newUserVenues,
        organizationIds: newUserOrgs,
        permission: newUserPermission,
        managerId: authUser?.id || '',
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPermission('view');
      setNewUserOrgs([]);
      setNewUserVenues([]);
    } catch (err) {
      let message = 'Failed to create user';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as {
          message?: string;
          errors?: { message: string }[];
        } | undefined;
        message = data?.errors?.[0]?.message || data?.message || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      setCreateError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 bg-slate-50/15 overflow-hidden select-none">
                {/* Header row */}
                <div className="flex items-center justify-between gap-4 shrink-0 mb-4 md:mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                    <span className="truncate">User Management</span>
                  </h3>
                </div>
      
                {/* Large screen: Add User (left) + Users list (right) */}
                <div className="hidden lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.45fr)] gap-4 xl:gap-6 flex-1 min-h-0">
                  
                  {/* LEFT — Add New User card */}
                  <aside className="min-h-0 min-w-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">Add New User</h4>
                    </div>
      
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-5 space-y-4">
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          className="w-full min-w-0 p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Enter user's full name"
                        />
                      </div>
      
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="w-full min-w-0 p-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="user@example.com"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Organizations <span className="text-red-500">*</span>
                        </label>
                        <MultiSelectDropdown
                          values={newUserOrgs}
                          onChange={(ids) => {
                            setNewUserOrgs(ids);
                            setNewUserVenues((prev) =>
                              prev.filter((venueId) => {
                                const venue = venues.find((v) => v.id === venueId);
                                return venue ? ids.includes(venue.orgId) : false;
                              })
                            );
                          }}
                          icon={Building2}
                          placeholder="Select organizations…"
                          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                        />
                      </div>
      
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Permission
                        </label>
                        <CustomDropdown
                          value={newUserPermission}
                          onChange={(v) => setNewUserPermission(v as 'view' | 'manage')}
                          options={[
                            { value: 'view', label: 'View' },
                            { value: 'manage', label: 'Manage' },
                          ]}
                        />
                      </div>
      
                      <div className="space-y-1.5 min-w-0">
                        <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
                          Assign Venues
                        </label>
                        <MultiSelectDropdown
                          values={newUserVenues}
                          onChange={setNewUserVenues}
                          icon={MapPin}
                          placeholder={newUserOrgs.length === 0 ? 'Select organizations first…' : 'Select venues…'}
                          options={venueOptions}
                          disabled={newUserOrgs.length === 0}
                        />
                      </div>
                    </div>
      
                    <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-3">
                      {createError && (
                        <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-semibold">
                          {createError}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          void handleCreateUser();
                        }}
                        disabled={
                          creating ||
                          !newUserName.trim() ||
                          !newUserEmail.trim() ||
                          newUserOrgs.length === 0
                        }
                        className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create User'
                        )}
                      </button>
                    </div>
                  </aside>
      
                  {/* RIGHT — Users list card */}
                  <section className="min-h-0 min-w-0 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 shrink-0 flex items-center justify-between gap-3">
                      <h4 className="text-base font-black text-slate-900 tracking-tight">All Users</h4>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                        {users.length} total
                      </span>
                    </div>
      
                    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                      {usersError && (
                        <div className="m-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                          {usersError}
                        </div>
                      )}
                      {usersLoading && users.length === 0 ? (
                        <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading users…</span>
                        </div>
                      ) : users.length === 0 ? (
                        <div className="h-full min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                          <Users className="w-12 h-12 text-slate-300 mb-3" />
                          <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Users Found</span>
                          <p className="text-xs text-slate-400 max-w-[220px]">Use the form on the left to add your first user</p>
                        </div>
                      ) : (
                        <table className="w-full table-fixed border-collapse">
                          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                            <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                              <th className="py-3 px-3 xl:px-5 w-[28%]">Name</th>
                              <th className="py-3 px-3 xl:px-5 w-[34%]">Email</th>
                              <th className="py-3 px-2 xl:px-4 w-[12%] text-center">Venue</th>
                              <th className="py-3 px-2 xl:px-4 w-[12%] text-center">Devices</th>
                              <th className="py-3 px-3 xl:px-5 w-[14%] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                            {users.map((user) => {
                              const venueCount = venues.filter((v) => user.assignedVenueIds.includes(v.id)).length;
                              const deviceCount = units.filter((u) => user.assignedVenueIds.includes(u.venueId)).length;
      
                              return (
                                <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="py-3 px-3 xl:px-5 align-middle">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex flex-col">
                                        <span className="font-extrabold text-slate-900 truncate">{user.name}</span>
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                                          {user.status === 'pending' ? 'Pending Onboarding' : user.status}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 xl:px-5 align-middle">
                                    <span className="block truncate text-slate-500 font-medium" title={user.email}>
                                      {user.email}
                                    </span>
                                  </td>
                                  <td className="py-3 px-2 xl:px-4 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() => openUserDetailModal(user, 'venues')}
                                      className="font-black text-blue-600 hover:text-blue-700 tabular-nums cursor-pointer"
                                      title="View venues"
                                    >
                                      {venueCount}
                                    </button>
                                  </td>
                                  <td className="py-3 px-2 xl:px-4 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() => openUserDetailModal(user, 'devices')}
                                      className="font-black text-emerald-600 hover:text-emerald-700 tabular-nums cursor-pointer"
                                      title="View devices"
                                    >
                                      {deviceCount}
                                    </button>
                                  </td>
                                  <td className="py-3 px-3 xl:px-5 text-right align-middle">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingUser(user)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                        title="Edit"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeletingId(user.id);
                                          setDeleteType('user');
                                        }}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </section>
                </div>
      
                {/* Mobile / tablet: list only (add via overlay) */}
                <div className="lg:hidden flex-1 min-h-0 overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                  <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overflow-x-hidden">
                    {usersLoading && users.length === 0 ? (
                      <div className="flex-1 min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading users…</span>
                      </div>
                    ) : users.length === 0 ? (
                      <div className="flex-1 min-h-[12rem] flex flex-col items-center justify-center p-8 text-center">
                        <Users className="w-12 h-12 text-slate-300 mb-3" />
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Users Found</span>
                        <p className="text-xs text-slate-400 max-w-[200px]">Create or invite users to assign them permissions</p>
                      </div>
                    ) : (
                      <table className="w-full table-fixed border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-md">
                          <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider text-left">
                            <th className="py-3 px-4 w-[48%]">Name</th>
                            <th className="py-3 px-2 w-[16%] text-center">Venue</th>
                            <th className="py-3 px-2 w-[16%] text-center">Devices</th>
                            <th className="py-3 px-4 w-[20%] text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                          {users.map((user) => {
                            const venueCount = venues.filter((v) => user.assignedVenueIds.includes(v.id)).length;
                            const deviceCount = units.filter((u) => user.assignedVenueIds.includes(u.venueId)).length;
      
                            return (
                              <tr key={user.id} className="hover:bg-slate-50/30">
                                <td className="py-2.5 px-4 align-middle">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                      <User className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex flex-col">
                                      <span className="font-extrabold text-slate-900 truncate">{user.name}</span>
                                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                                        {user.status === 'pending' ? 'Pending' : user.status}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center font-black text-blue-600 tabular-nums">{venueCount}</td>
                                <td className="py-2.5 px-2 text-center font-black text-emerald-600 tabular-nums">{deviceCount}</td>
                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingUser(user)}
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                      title="Edit"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDeletingId(user.id);
                                        setDeleteType('user');
                                      }}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
    </>
  );
}
