import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  FileText, 
  CheckCircle, 
  Users, 
  Award, 
  User, 
  Mail, 
  Hash, 
  BookOpen, 
  Calendar,
  Briefcase,
  AlertCircle,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load student dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Student Dashboard">
        <Loading message="Fetching student profile and applications..." />
      </DashboardLayout>
    );
  }

  const { studentInfo, stats, applications, upcomingDrives } = data || {};

  return (
    <DashboardLayout pageTitle="Student Dashboard">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl mb-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{studentInfo?.name || 'Student'}</span> 👋
        </h1>
        <p className="text-xs lg:text-sm text-slate-400 mt-2 max-w-2xl">
          Here is your personal placement summary and application status overview.
        </p>
      </div>

      {/* Student Profile Card */}
      <div className="glass-card p-6 rounded-3xl mb-8 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Academic Credentials</h2>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>TPO Verified & Locked</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <User className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Full Name</span>
            </div>
            <p className="font-bold text-white text-sm truncate">{studentInfo?.name || '-'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <Mail className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Email</span>
            </div>
            <p className="font-bold text-white text-sm truncate">{studentInfo?.email || '-'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <Hash className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Student ID</span>
            </div>
            <p className="font-bold text-white text-sm font-mono">{studentInfo?.student_id || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Department</span>
            </div>
            <p className="font-bold text-white text-sm truncate" title={studentInfo?.department}>{studentInfo?.department || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Year</span>
            </div>
            <p className="font-bold text-white text-sm">{studentInfo?.year || 'N/A'}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 to-slate-900/60">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1">
              <GraduationCap className="w-4 h-4" />
              <span className="font-semibold text-indigo-300">CGPA</span>
            </div>
            <p className="font-extrabold text-white text-sm">
              {studentInfo?.cgpa !== null && studentInfo?.cgpa !== undefined ? Number(studentInfo.cgpa).toFixed(2) : 'Not Set'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-2 text-amber-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="font-semibold text-slate-400">Arrears</span>
            </div>
            <p className="font-bold text-white text-sm">{studentInfo?.arrear_history ?? '0'}</p>
          </div>
        </div>
      </div>

      {/* Dashboard Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Applications</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats?.applications || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shortlisted</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">{stats?.shortlisted || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interviews</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">{stats?.interviews || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offers</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.offers || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Sections: Upcoming Drives & Application History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Drives */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white">Upcoming Drives</h3>
            <span className="text-xs text-indigo-400 font-semibold">{upcomingDrives?.length || 0} Drives</span>
          </div>

          {upcomingDrives && upcomingDrives.length > 0 ? (
            <div className="space-y-3">
              {upcomingDrives.map((drive) => (
                <div key={drive.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{drive.title}</h4>
                    <p className="text-xs text-indigo-400 font-medium">{drive.company}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                    Open
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No upcoming drives</p>
            </div>
          )}
        </div>

        {/* Application History */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white">Application History</h3>
            <span className="text-xs text-indigo-400 font-semibold">{applications?.length || 0} Submitted</span>
          </div>

          {applications && applications.length > 0 ? (
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{app.title}</h4>
                    <p className="text-xs text-slate-400">{app.company}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No applications yet</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
