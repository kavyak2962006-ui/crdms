import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Users, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Search
} from 'lucide-react';
import api from '../services/api';

const UserRoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch system users.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoading(userId);
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setSuccess(res.data.message || 'User role updated.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Failed to update user role.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      setActionLoading(userId);
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setSuccess(res.data.message || `User status updated to ${newStatus}.`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <DashboardLayout pageTitle="Global User Role Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Platform User Governance</h1>
          <p className="text-xs text-slate-400">View all system accounts, update authorization roles, and toggle access states</p>
        </div>

        <button
          onClick={fetchUsers}
          className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
          title="Refresh Table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-2xl mb-6 border border-slate-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by name or email address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl glass-input text-xs"
          >
            <option value="all" className="bg-slate-900">All Roles</option>
            <option value="student" className="bg-slate-900">Students</option>
            <option value="hr" className="bg-slate-900">HR Recruiters</option>
            <option value="tpo" className="bg-slate-900">TPO Officers</option>
            <option value="admin" className="bg-slate-900">Administrators</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading message="Loading system users..." />
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-4 font-semibold text-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300 font-mono">{u.email}</td>

                      <td className="p-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={actionLoading === u.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-indigo-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="student">Student</option>
                          <option value="hr">HR Recruiter</option>
                          <option value="tpo">TPO Officer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : u.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {u.status}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleStatusToggle(u.id, u.status)}
                          disabled={actionLoading === u.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            u.status === 'active'
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {u.status === 'active' ? 'Block User' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-500">
                      No matching user accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default UserRoleManagement;
