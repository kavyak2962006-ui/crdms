import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Mail,
  User,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';

const HRApproval = () => {
  const [pendingHR, setPendingHR] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPendingHR();
  }, []);

  const fetchPendingHR = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/admin/hr/pending');
      setPendingHR(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch pending HR accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    try {
      setActionLoading(id);
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/hr/${id}/approve`);
      setSuccess(res.data.message || `HR user ${name} approved successfully.`);
      fetchPendingHR();
    } catch (err) {
      console.error(err);
      setError('Failed to approve HR account.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, name) => {
    try {
      setActionLoading(id);
      setError('');
      setSuccess('');
      const res = await api.put(`/admin/hr/${id}/reject`);
      setSuccess(res.data.message || `HR user ${name} rejected.`);
      fetchPendingHR();
    } catch (err) {
      console.error(err);
      setError('Failed to reject HR account.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout pageTitle="HR Approval Gatekeeping">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Pending HR Registrations</h1>
          <p className="text-xs text-slate-400">Approve or reject external recruiters seeking placement access</p>
        </div>

        <button
          onClick={fetchPendingHR}
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-white transition-colors"
          title="Refresh List"
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

      {loading ? (
        <Loading message="Fetching pending HR requests..." />
      ) : pendingHR.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingHR.map((hr) => (
            <div key={hr.id} className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Pending Verification</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Registered: {new Date(hr.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg flex-shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{hr.company_name || 'Corporate Partner'}</h3>
                    <p className="text-xs text-indigo-400 font-semibold">{hr.name}</p>
                    <p className="text-[11px] text-slate-400">{hr.designation || 'Recruiter'}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-6 flex items-center space-x-2 text-xs text-slate-300">
                  <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{hr.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => handleApprove(hr.id, hr.name)}
                  disabled={actionLoading === hr.id}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{actionLoading === hr.id ? 'Processing...' : 'Approve'}</span>
                </button>

                <button
                  onClick={() => handleReject(hr.id, hr.name)}
                  disabled={actionLoading === hr.id}
                  className="py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card p-12 rounded-3xl text-center border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-white">All HR Applications Processed</h3>
          <p className="text-xs text-slate-400 mt-1">There are currently no pending HR accounts awaiting administrator approval.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HRApproval;
