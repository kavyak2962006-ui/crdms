import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Users, 
  ShieldAlert,
  Edit,
  X,
  CheckCircle2
} from 'lucide-react';
import { getAdminDrives, updateAdminDriveTimeline } from '../services/api';

const AdminDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing timeline state
  const [editingDrive, setEditingDrive] = useState(null);
  const [timelineForm, setTimelineForm] = useState({
    registration_opening: '',
    registration_closing: ''
  });
  const [updating, setUpdating] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await getAdminDrives();
      setDrives(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load placement drives list.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatForInput = (dStr) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openTimelineModal = (drive) => {
    setEditingDrive(drive);
    setTimelineForm({
      registration_opening: formatForInput(drive.registration_opening),
      registration_closing: formatForInput(drive.registration_closing)
    });
    setModalError('');
  };

  const handleTimelineSubmit = async (e) => {
    e.preventDefault();
    if (!editingDrive) return;
    setModalError('');
    setSuccessMsg('');

    if (!timelineForm.registration_opening) {
      setModalError('Registration opening date/time is required.');
      return;
    }
    if (!timelineForm.registration_closing) {
      setModalError('Registration closing date/time is required.');
      return;
    }

    const openTime = new Date(timelineForm.registration_opening).getTime();
    const closeTime = new Date(timelineForm.registration_closing).getTime();

    if (closeTime <= openTime) {
      setModalError('Closing date/time must be strictly after opening date/time.');
      return;
    }

    try {
      setUpdating(true);
      await updateAdminDriveTimeline(editingDrive.id, timelineForm);
      setSuccessMsg(`Registration timeline for "${editingDrive.job_title || editingDrive.title}" updated successfully.`);
      setEditingDrive(null);
      await fetchDrives();
    } catch (err) {
      console.error(err);
      setModalError(err.response?.data?.message || 'Failed to update timeline.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Placement Drives Governance">
        <Loading message="Loading placement drives across all corporate partners..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Placement Drives Governance">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center space-x-2 text-indigo-400 mb-2">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Admin Governance & Timeline Management</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">All Placement Drives</h1>
          <p className="text-xs text-slate-400 mt-1">Overview of placement drives configured by corporate HR recruiters and management of registration timelines.</p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Drives List */}
        {drives && drives.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {drives.map((drive) => {
              const statusColor = 
                drive.dynamic_status === 'Open'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : drive.dynamic_status === 'Upcoming'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30';

              return (
                <div key={drive.id} className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h2 className="text-lg font-bold text-white">{drive.job_title || drive.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusColor}`}>
                          {drive.dynamic_status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span className="text-indigo-400 font-semibold flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>{drive.company}</span>
                        </span>
                        <span>•</span>
                        <span>Recruiter: <strong className="text-slate-300">{drive.hr_name || 'HR Partner'}</strong> ({drive.hr_email})</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-start md:self-auto">
                      <div className="flex items-center space-x-2 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>{drive.total_applications || 0} Applications</span>
                      </div>
                      <button
                        onClick={() => openTimelineModal(drive)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5"
                        title="Manage Timeline"
                      >
                        <Edit className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Edit Timeline</span>
                      </button>
                    </div>
                  </div>

                  {/* Timelines & CTC */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                        <span>CTC</span>
                      </p>
                      <p className="text-white font-bold">{drive.ctc || 'N/A'}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Opening Time</span>
                      </p>
                      <p className="text-slate-200">{formatDate(drive.registration_opening)}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        <span>Closing Time</span>
                      </p>
                      <p className="text-slate-200">{formatDate(drive.registration_closing)}</p>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="text-xs space-y-2">
                    <div>
                      <h4 className="font-semibold text-slate-300">Description:</h4>
                      <p className="text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-900">{drive.job_description || drive.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-300">Eligibility Criteria:</h4>
                      <p className="text-indigo-200 bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-500/10">{drive.eligibility_criteria}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center border border-slate-800">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-white mb-1">No Drives Configured</h3>
            <p className="text-xs text-slate-400">No placement drives have been created yet across the platform.</p>
          </div>
        )}

        {/* Edit Timeline Modal */}
        {editingDrive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="glass-card p-6 rounded-3xl border border-indigo-500/30 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Manage Registration Timeline</span>
                </h3>
                <button onClick={() => setEditingDrive(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Updating timeline for: <strong className="text-indigo-300">{editingDrive.job_title || editingDrive.title}</strong>
              </p>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleTimelineSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration Opens *</label>
                  <input
                    type="datetime-local"
                    value={timelineForm.registration_opening}
                    onChange={(e) => setTimelineForm({ ...timelineForm, registration_opening: e.target.value })}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration Closes *</label>
                  <input
                    type="datetime-local"
                    value={timelineForm.registration_closing}
                    onChange={(e) => setTimelineForm({ ...timelineForm, registration_closing: e.target.value })}
                    className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition disabled:opacity-50"
                  >
                    {updating ? 'Saving Timeline...' : 'Update Timeline'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDrive(null)}
                    disabled={updating}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDrives;
