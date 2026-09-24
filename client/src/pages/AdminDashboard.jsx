import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Users, 
  CheckCircle2, 
  GraduationCap, 
  Building2, 
  ShieldAlert, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load administrator dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Admin Dashboard">
        <Loading message="Loading system administration metrics..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Admin Dashboard">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl mb-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
        <div className="flex items-center space-x-2 text-indigo-400 mb-2">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Platform Governance</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          System Administration & HR Gatekeeping
        </h1>
        <p className="text-xs lg:text-sm text-slate-400 mt-2 max-w-2xl">
          Manage corporate recruiter approvals, monitor system user roles, and enforce platform governance policies.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Platform Users</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats?.totalUsers || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending HR Approvals</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">{stats?.pendingHR || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Student Accounts</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">{stats?.totalStudents || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approved HR Recruiters</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.totalActiveHR || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">HR Approval Gatekeeping</h3>
            <p className="text-xs text-slate-400">
              Review new external recruiter registrations, verify corporate details, and approve or reject access.
            </p>
          </div>
          <Link
            to="/admin/hr-approval"
            className="mt-6 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <span>Review Pending HR ({stats?.pendingHR || 0})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Global User Role Management</h3>
            <p className="text-xs text-slate-400">
              Manage system permissions, modify roles (Student, HR, TPO, Admin), and block/unblock user accounts.
            </p>
          </div>
          <Link
            to="/admin/users"
            className="mt-6 py-2.5 px-4 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <span>Manage All Users ({stats?.totalUsers || 0})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Placement Drives Governance</h3>
            <p className="text-xs text-slate-400">
              View and oversee all corporate placement drives, registration timelines, and student participation across campus.
            </p>
          </div>
          <Link
            to="/admin/drives"
            className="mt-6 py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-between transition-colors"
          >
            <span>View All Drives</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
