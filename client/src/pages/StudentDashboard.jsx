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
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Clock,
  Bell,
  BellRing
} from 'lucide-react';
import api, { 
  getAvailableInterviewSlots, 
  bookInterviewSlot,
  getStudentNotifications,
  markStudentNotificationRead,
  markAllStudentNotificationsRead
} from '../services/api';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interview Booking State
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [interviewData, setInterviewData] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(null);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getStudentNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

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

  const toggleInterviewPanel = async (appId, driveId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
    } else {
      setExpandedAppId(appId);
      await fetchSlots(appId, driveId);
    }
  };

  const fetchSlots = async (appId, driveId) => {
    try {
      setSlotsLoading(true);
      const res = await getAvailableInterviewSlots(driveId);
      setInterviewData(prev => ({ ...prev, [appId]: res.data }));
    } catch (err) {
      console.error(err);
      alert('Failed to fetch interview slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookSlot = async (appId, driveId, slotId) => {
    if (!window.confirm('Book this interview slot?')) return;
    try {
      setBookingLoading(slotId);
      const res = await bookInterviewSlot(driveId, slotId);
      alert(res.data.message);
      await fetchSlots(appId, driveId); // Refresh after booking
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to book slot.');
      await fetchSlots(appId, driveId); // Refresh to get updated status
    } finally {
      setBookingLoading(null);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markStudentNotificationRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllStudentNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read");
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

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-slate-800 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-400" /> Notifications
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.is_read).length} New
                </span>
              )}
            </h3>
            {notifications.filter(n => !n.is_read).length > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-400 font-semibold hover:text-indigo-300"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl border flex items-start justify-between cursor-pointer transition-colors ${notif.is_read ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-800/60 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]'}`}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
              >
                <div>
                  <h4 className={`text-sm font-bold ${notif.is_read ? 'text-slate-300' : 'text-white'}`}>{notif.title}</h4>
                  <p className={`text-xs mt-1 ${notif.is_read ? 'text-slate-400' : 'text-indigo-200'}`}>{notif.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1 flex-shrink-0 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div key={app.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">{app.title}</h4>
                      <p className="text-xs text-slate-400">{app.company}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                        {app.status}
                      </span>
                      {/* Show booking button if shortlisted/interview */}
                      {['Shortlisted', 'Interview'].includes(app.status) && app.job_id && (
                        <button
                          onClick={() => toggleInterviewPanel(app.id, app.job_id)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-semibold border border-indigo-500/30 transition"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Interview Booking</span>
                          {expandedAppId === app.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Interview Slot Panel */}
                  {expandedAppId === app.id && (
                    <div className="mt-2 pt-3 border-t border-slate-800/60 animate-in fade-in slide-in-from-top-2">
                      <h5 className="text-[11px] font-bold text-indigo-300 mb-2 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Available Interview Slots</span>
                      </h5>
                      
                      {slotsLoading ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {interviewData[app.id]?.studentBooking ? (
                            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                              <h6 className="text-[11px] font-semibold text-emerald-400 mb-1">My Interview Slot</h6>
                              <div className="flex justify-between items-center text-[11px] text-emerald-200">
                                <div>
                                  <p>Date: {new Date(interviewData[app.id].studentBooking.interview_date.replace(/-/g, '/')).toLocaleDateString()}</p>
                                  <p>Time: {interviewData[app.id].studentBooking.start_time.substring(0, 5)} - {interviewData[app.id].studentBooking.end_time.substring(0, 5)}</p>
                                </div>
                                <span className="px-2 py-1 bg-emerald-500/20 rounded font-bold uppercase tracking-wider text-[9px]">Booked</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {interviewData[app.id]?.availableSlots?.length > 0 ? (
                                interviewData[app.id].availableSlots.map(slot => (
                                  <div key={slot.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                                    <div className="text-[10px] text-slate-300 font-mono">
                                      {new Date(slot.interview_date.replace(/-/g, '/')).toLocaleDateString()} <br/>
                                      {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                                    </div>
                                    <button
                                      onClick={() => handleBookSlot(app.id, app.job_id, slot.id)}
                                      disabled={bookingLoading === slot.id}
                                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition disabled:opacity-50 flex items-center space-x-1"
                                    >
                                      {bookingLoading === slot.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                      <span>Book</span>
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full p-4 text-center text-[11px] text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800/50">
                                  No available slots at the moment.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
