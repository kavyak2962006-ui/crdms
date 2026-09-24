import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { getStudentDrives, registerForDrive } from '../services/api';

const StudentDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await getStudentDrives();
      setDrives(res.data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load placement drives.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (driveId) => {
    try {
      setActionLoading((prev) => ({ ...prev, [driveId]: true }));
      setMessage({ type: '', text: '' });
      const res = await registerForDrive(driveId);
      setMessage({ type: 'success', text: res.data.message || 'Successfully registered!' });
      // Refresh drive list to update registration state
      await fetchDrives();
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to register for placement drive.' 
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, [driveId]: false }));
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

  if (loading) {
    return (
      <DashboardLayout pageTitle="Placement Drives">
        <Loading message="Loading available placement drives..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Placement Drives">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Campus Placement Drives</h1>
              <p className="text-xs text-slate-400">Explore open placement drives, review eligibility criteria, and register before deadlines.</p>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {message.text && (
          <div
            className={`flex items-center space-x-2 p-4 rounded-2xl text-xs font-medium ${
              message.type === 'error'
                ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Drive Cards List */}
        {drives && drives.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {drives.map((drive) => {
              const isOpen = drive.dynamic_status === 'Open';
              const isClosed = drive.dynamic_status === 'Closed';
              const isRegistered = drive.is_registered;
              const evalRes = drive.eligibility || {};
              const isEligible = evalRes.eligible === true;
              const isIncomplete = evalRes.isIncomplete === true;
              const isLegacy = evalRes.isLegacy === true;
              const checks = evalRes.checks || {};

              const hasStructuredReqs = 
                drive.minimum_cgpa !== null || 
                (drive.eligible_departments && drive.eligible_departments.length > 0) || 
                drive.maximum_arrears !== null || 
                drive.minimum_year !== null;

              return (
                <div 
                  key={drive.id} 
                  className={`glass-card p-6 rounded-3xl border transition-all ${
                    isOpen 
                      ? 'border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-950/20' 
                      : 'border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h2 className="text-xl font-bold text-white">{drive.job_title || drive.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          isOpen 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border-red-500/30'
                        }`}>
                          {drive.dynamic_status}
                        </span>

                        {/* Overall Eligibility Status Badge */}
                        {isEligible && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Eligible ✓</span>
                          </span>
                        )}
                        {!isEligible && !isIncomplete && !isLegacy && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Not Eligible ✗</span>
                          </span>
                        )}
                        {isIncomplete && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Profile Incomplete</span>
                          </span>
                        )}
                        {isLegacy && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Manual Verification Required
                          </span>
                        )}

                        {isRegistered && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Applied ✓</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
                        <Building2 className="w-4 h-4" />
                        <span>{drive.company}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-start">
                      {isOpen && !isRegistered && isEligible && (
                        <button
                          onClick={() => handleRegister(drive.id)}
                          disabled={actionLoading[drive.id]}
                          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
                        >
                          {actionLoading[drive.id] ? 'Submitting Application...' : '1-Click Apply'}
                        </button>
                      )}

                      {isOpen && !isRegistered && !isEligible && (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-slate-800 text-slate-500 font-semibold text-xs rounded-xl border border-slate-700 cursor-not-allowed"
                          title={evalRes.reason || 'You do not meet the eligibility requirements for this drive.'}
                        >
                          Apply (Not Eligible)
                        </button>
                      )}

                      {isRegistered && (
                        <span className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Applied ✓</span>
                        </span>
                      )}

                      {isClosed && !isRegistered && (
                        <button
                          disabled
                          className="px-5 py-2.5 bg-slate-800 text-slate-500 font-semibold text-xs rounded-xl border border-slate-700 cursor-not-allowed"
                        >
                          Registration Closed
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Drive Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Compensation (CTC)</span>
                      </p>
                      <p className="text-white font-bold text-sm">{drive.ctc || 'Not specified'}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Registration Opens</span>
                      </p>
                      <p className="text-slate-200 font-medium">{formatDate(drive.registration_opening)}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                      <p className="text-slate-400 font-semibold mb-1 flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Registration Closes</span>
                      </p>
                      <p className="text-slate-200 font-medium">{formatDate(drive.registration_closing)}</p>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <h4 className="font-bold text-slate-300 mb-1">Job Description:</h4>
                      <p className="text-slate-400 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                        {drive.job_description || drive.description}
                      </p>
                    </div>

                    {/* STRUCTURED ELIGIBILITY REQUIREMENTS DISPLAY */}
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wider">
                          Drive Eligibility Requirements
                        </h4>
                        {!hasStructuredReqs && (
                          <span className="text-[11px] text-amber-400 font-semibold italic">Manual Verification Required</span>
                        )}
                      </div>

                      {hasStructuredReqs ? (
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {drive.minimum_cgpa !== null && (
                            <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-200 border border-indigo-500/20">
                              Minimum CGPA: <strong>{Number(drive.minimum_cgpa).toFixed(2)}</strong>
                            </span>
                          )}
                          {drive.maximum_arrears !== null && (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-200 border border-amber-500/20">
                              Max Standing Arrears: <strong>{drive.maximum_arrears}</strong>
                            </span>
                          )}
                          {drive.minimum_year && (
                            <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-200 border border-blue-500/20">
                              Minimum Year: <strong>{drive.minimum_year}</strong>
                            </span>
                          )}
                          {drive.eligible_departments && drive.eligible_departments.length > 0 && (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                              Eligible Depts: <strong>{drive.eligible_departments.join(', ')}</strong>
                            </span>
                          )}
                          {drive.required_skills && (
                            <span className="px-2.5 py-1 rounded-xl bg-violet-500/10 text-violet-200 border border-violet-500/20">
                              Required Skills: <strong>{drive.required_skills}</strong>
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">{drive.eligibility_criteria || 'Standard placement guidelines apply.'}</p>
                      )}

                      {/* YOUR AUTOMATIC ELIGIBILITY EVALUATION BOX */}
                      <div className={`mt-3 p-3.5 rounded-xl border text-xs space-y-2 ${
                        isEligible
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : isIncomplete
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-red-950/20 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-white uppercase tracking-wider flex items-center space-x-1.5">
                            {isEligible ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400" />
                            )}
                            <span>Your Eligibility Status</span>
                          </span>
                          <span className={`text-[11px] font-extrabold ${isEligible ? 'text-emerald-400' : 'text-red-400'}`}>
                            {evalRes.reason}
                          </span>
                        </div>

                        {checks && Object.keys(checks).length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-800/60 font-mono text-[11px]">
                            {Object.entries(checks).map(([key, check]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <span className={`font-bold ${check.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {check.passed ? '✓' : '✗'}
                                </span>
                                <span className="font-sans font-semibold text-slate-300 capitalize">{key}:</span>
                                <span className={`font-sans ${check.passed ? 'text-slate-300' : 'text-red-300 font-bold'}`}>
                                  {check.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center border border-slate-800">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <h3 className="text-base font-bold text-white mb-1">No Placement Drives Available</h3>
            <p className="text-xs text-slate-400">There are currently no active placement drives open for student registration.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentDrives;
