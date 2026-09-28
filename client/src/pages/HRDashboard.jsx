import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  Building2, 
  Briefcase, 
  Users, 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Edit,
  X,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Download,
  User,
  Loader2,
  Check,
  ExternalLink,
  Filter
} from 'lucide-react';
import api, { 
  getHRDrives, 
  createPlacementDrive, 
  updateHRDrive, 
  deleteHRDrive, 
  getDriveApplicants,
  exportShortlistedCandidates,
  markNotificationRead,
  markAllNotificationsRead 
} from '../services/api';

const DEPARTMENT_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Artificial Intelligence & Data Science'
];

const HRDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Refs for section scrolling
  const drivesSectionRef = useRef(null);
  const notificationsSectionRef = useRef(null);

  // Filters & highlights
  const [driveFilter, setDriveFilter] = useState('all'); // 'all' | 'active'
  const [highlightSection, setHighlightSection] = useState(null); // 'drives' | 'notifications'

  // Form toggle & state
  const [showForm, setShowForm] = useState(false);
  const [editingDriveId, setEditingDriveId] = useState(null);
  const [formData, setFormData] = useState({
    job_title: '',
    job_description: '',
    ctc: '',
    minimum_cgpa: '7.5',
    eligible_departments: [...DEPARTMENT_OPTIONS],
    maximum_arrears: '0',
    minimum_year: '3rd Year',
    required_skills: '',
    registration_opening: '',
    registration_closing: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Applicant list state
  const [expandedDriveId, setExpandedDriveId] = useState(null);
  const [applicantsData, setApplicantsData] = useState({});
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState('');
  const [exportingDriveId, setExportingDriveId] = useState(null);

  useEffect(() => {
    fetchHRDashboard();
  }, []);

  const fetchHRDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/hr/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load HR dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Card 1 Click: Active Placement Drives
  const handleActiveDrivesClick = () => {
    setDriveFilter('active');
    if (drivesSectionRef.current) {
      drivesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setHighlightSection('drives');
    setTimeout(() => setHighlightSection(null), 2500);
  };

  // Card 2 Click: Applications Received
  const handleApplicationsReceivedClick = () => {
    setDriveFilter('all');
    // Find first drive with applicants or first drive available
    const drives = data?.jobPostings || [];
    const targetDrive = drives.find(d => Number(d.applications_count) > 0) || drives[0];
    if (targetDrive) {
      setExpandedDriveId(targetDrive.id);
      fetchApplicants(targetDrive.id);
    }
    if (drivesSectionRef.current) {
      drivesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setHighlightSection('drives');
    setTimeout(() => setHighlightSection(null), 2500);
  };

  // Card 3 Click: System Notifications
  const handleNotificationsClick = () => {
    if (notificationsSectionRef.current) {
      notificationsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setHighlightSection('notifications');
    setTimeout(() => setHighlightSection(null), 2500);
  };

  // Mark single notification as read
  const handleMarkNotificationRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setData((prev) => {
        if (!prev) return prev;
        const updatedNotifs = (prev.notifications || []).map((n) =>
          n.id === id ? { ...n, is_read: 1 } : n
        );
        const unread = updatedNotifs.filter((n) => !n.is_read).length;
        return {
          ...prev,
          notifications: updatedNotifs,
          stats: {
            ...prev.stats,
            unreadNotifications: unread
          }
        };
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setData((prev) => {
        if (!prev) return prev;
        const updatedNotifs = (prev.notifications || []).map((n) => ({ ...n, is_read: 1 }));
        return {
          ...prev,
          notifications: updatedNotifs,
          stats: {
            ...prev.stats,
            unreadNotifications: 0
          }
        };
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeptToggle = (deptName) => {
    setFormData((prev) => {
      const exists = prev.eligible_departments.includes(deptName);
      const updated = exists
        ? prev.eligible_departments.filter((d) => d !== deptName)
        : [...prev.eligible_departments, deptName];
      return { ...prev, eligible_departments: updated };
    });
  };

  const resetForm = () => {
    setFormData({
      job_title: '',
      job_description: '',
      ctc: '',
      minimum_cgpa: '7.5',
      eligible_departments: [...DEPARTMENT_OPTIONS],
      maximum_arrears: '0',
      minimum_year: '3rd Year',
      required_skills: '',
      registration_opening: '',
      registration_closing: ''
    });
    setEditingDriveId(null);
    setShowForm(false);
    setFormError('');
  };

  const openEditForm = (drive) => {
    const formatForInput = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      const pad = (num) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setFormData({
      job_title: drive.job_title || drive.title || '',
      job_description: drive.job_description || drive.description || '',
      ctc: drive.ctc || '',
      minimum_cgpa: drive.minimum_cgpa !== null && drive.minimum_cgpa !== undefined ? String(drive.minimum_cgpa) : '7.5',
      eligible_departments: Array.isArray(drive.eligible_departments) && drive.eligible_departments.length > 0
        ? drive.eligible_departments
        : [...DEPARTMENT_OPTIONS],
      maximum_arrears: drive.maximum_arrears !== null && drive.maximum_arrears !== undefined ? String(drive.maximum_arrears) : '0',
      minimum_year: drive.minimum_year || '3rd Year',
      required_skills: drive.required_skills || '',
      registration_opening: formatForInput(drive.registration_opening),
      registration_closing: formatForInput(drive.registration_closing)
    });
    setEditingDriveId(drive.id);
    setShowForm(true);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!formData.job_title.trim()) {
      setFormError('Job Title is required.');
      return;
    }
    if (!formData.job_description.trim()) {
      setFormError('Job Description is required.');
      return;
    }
    if (!formData.ctc.trim()) {
      setFormError('CTC is required.');
      return;
    }

    if (formData.minimum_cgpa !== '') {
      const cgpaNum = parseFloat(formData.minimum_cgpa);
      if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
        setFormError('Minimum CGPA must be a valid decimal number between 0.0 and 10.0.');
        return;
      }
    }

    if (formData.maximum_arrears !== '') {
      const arrNum = parseInt(formData.maximum_arrears, 10);
      if (isNaN(arrNum) || arrNum < 0) {
        setFormError('Maximum Arrears must be a non-negative integer (0, 1, 2, etc.).');
        return;
      }
    }

    if (!formData.eligible_departments || formData.eligible_departments.length === 0) {
      setFormError('Please select at least one eligible department.');
      return;
    }

    if (!formData.registration_opening) {
      setFormError('Registration opening date/time is required.');
      return;
    }
    if (!formData.registration_closing) {
      setFormError('Registration closing date/time is required.');
      return;
    }

    const openTime = new Date(formData.registration_opening).getTime();
    const closeTime = new Date(formData.registration_closing).getTime();

    if (closeTime <= openTime) {
      setFormError('Registration closing date/time must be strictly after opening date/time.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingDriveId) {
        await updateHRDrive(editingDriveId, formData);
        setSuccessMsg('Placement drive updated successfully.');
      } else {
        await createPlacementDrive(formData);
        setSuccessMsg('Placement drive created successfully!');
      }
      resetForm();
      await fetchHRDashboard();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save placement drive.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (driveId) => {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) {
      return;
    }
    try {
      setSuccessMsg('');
      await deleteHRDrive(driveId);
      setSuccessMsg('Placement drive deleted successfully.');
      await fetchHRDashboard();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete placement drive.');
    }
  };

  // Fetch applicants for a specific drive
  const fetchApplicants = async (driveId) => {
    try {
      setApplicantsLoading(true);
      setApplicantsError('');
      const res = await getDriveApplicants(driveId);
      setApplicantsData((prev) => ({ ...prev, [driveId]: res.data }));
    } catch (err) {
      console.error(err);
      setApplicantsError(err.response?.data?.message || 'Failed to load applicants.');
    } finally {
      setApplicantsLoading(false);
    }
  };

  const handleExportShortlisted = async (driveId) => {
    try {
      setExportingDriveId(driveId);
      const res = await exportShortlistedCandidates(driveId);
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = res.headers['content-disposition'];
      let filename = 'shortlisted_candidates.csv';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Export error:', err);
      let errMsg = 'Failed to export shortlisted candidates.';
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch (e) {
          // Keep default
        }
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    } finally {
      setExportingDriveId(null);
    }
  };

  const toggleApplicants = (driveId) => {
    if (expandedDriveId === driveId) {
      setExpandedDriveId(null);
      setApplicantsError('');
    } else {
      setExpandedDriveId(driveId);
      fetchApplicants(driveId);
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
      <DashboardLayout pageTitle="HR Dashboard">
        <Loading message="Fetching company profile and recruitment drives..." />
      </DashboardLayout>
    );
  }

  const { hrInfo, stats, notifications, jobPostings } = data || {};

  return (
    <DashboardLayout pageTitle="HR Dashboard">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Corporate Header */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl mb-8 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified HR Partner</span>
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            {hrInfo?.company_name || 'Corporate Recruiter'}
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Recruiter Profile: <span className="text-indigo-300 font-semibold">{hrInfo?.name}</span> ({hrInfo?.designation || 'Talent Acquisition'})
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center space-x-2 self-start md:self-auto"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showForm ? 'Cancel Form' : 'Create Placement Drive'}</span>
        </button>
      </div>

      {/* Stats Cards - Interactive Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card 1: Active Placement Drives */}
        <div 
          onClick={handleActiveDrivesClick}
          className={`glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] group ${
            driveFilter === 'active' ? 'border-indigo-500/40 ring-1 ring-indigo-500/30' : ''
          }`}
          title="Click to view and manage active placement drives"
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
              Active Placement Drives
            </p>
            <p className="text-3xl font-extrabold text-white mt-2">
              {stats?.activePostings !== undefined ? stats.activePostings : 0}
            </p>
            <div className="flex items-center space-x-1 text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium mt-1">
              <span>{driveFilter === 'active' ? 'Filtered: Active only' : 'View active drives'}</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-all">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Applications Received */}
        <div 
          onClick={handleApplicationsReceivedClick}
          className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] group"
          title="Click to view candidate applicants and review applications"
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
              Applications Received
            </p>
            <p className="text-3xl font-extrabold text-indigo-400 mt-2">
              {stats?.totalApplications !== undefined ? stats.totalApplications : 0}
            </p>
            <div className="flex items-center space-x-1 text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium mt-1">
              <span>Review applicants</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500/30 group-hover:text-indigo-300 transition-all">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: System Notifications */}
        <div 
          onClick={handleNotificationsClick}
          className="glass-card p-6 rounded-3xl flex items-center justify-between cursor-pointer transition-all duration-200 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] group"
          title="Click to view account alerts and system notifications"
        >
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
              System Notifications
            </p>
            <div className="flex items-baseline space-x-2 mt-2">
              <p className="text-3xl font-extrabold text-emerald-400">
                {stats?.unreadNotifications !== undefined 
                  ? stats.unreadNotifications 
                  : (notifications?.filter(n => !n.is_read)?.length || 0)}
              </p>
              {notifications && notifications.length > 0 && (
                <span className="text-xs text-slate-400 font-medium">/ {notifications.length} total</span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-emerald-400 group-hover:text-emerald-300 font-medium mt-1">
              <span>
                {(stats?.unreadNotifications || notifications?.filter(n => !n.is_read)?.length || 0) > 0 
                  ? `${stats?.unreadNotifications || notifications?.filter(n => !n.is_read)?.length} unread alerts` 
                  : 'View alerts'}
              </span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/30 group-hover:text-emerald-300 transition-all relative">
            <Bell className="w-6 h-6" />
            {(stats?.unreadNotifications || notifications?.filter(n => !n.is_read)?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Placement Drive Creation Form */}
      {showForm && (
        <div className="glass-card p-6 lg:p-8 rounded-3xl border border-indigo-500/30 mb-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <span>{editingDriveId ? 'Edit Placement Drive' : 'Configure New Placement Drive'}</span>
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Job Title *</label>
                <input
                  type="text"
                  name="job_title"
                  placeholder="e.g. Software Development Engineer (SDE-1)"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">CTC / Salary Package *</label>
                <input
                  type="text"
                  name="ctc"
                  placeholder="e.g. 8.5 LPA"
                  value={formData.ctc}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Job Description *</label>
              <textarea
                name="job_description"
                rows={3}
                placeholder="Describe role responsibilities, tech stack, job location, and key expectations..."
                value={formData.job_description}
                onChange={handleInputChange}
                className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* STRUCTURED ELIGIBILITY REQUIREMENTS SECTION */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/20 space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="font-bold text-sm text-indigo-300 uppercase tracking-wider">
                  ELIGIBILITY REQUIREMENTS
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Configure structured academic requirements used for automatic student eligibility matching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimum CGPA (0.0 - 10.0)</label>
                  <input
                    type="number"
                    name="minimum_cgpa"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="7.5"
                    value={formData.minimum_cgpa}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Maximum Arrears Allowed</label>
                  <input
                    type="number"
                    name="maximum_arrears"
                    min="0"
                    placeholder="0"
                    value={formData.maximum_arrears}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Minimum Year</label>
                  <select
                    name="minimum_year"
                    value={formData.minimum_year}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl bg-slate-950 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Eligible Departments *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  {DEPARTMENT_OPTIONS.map((dept) => {
                    const isChecked = formData.eligible_departments.includes(dept);
                    return (
                      <label
                        key={dept}
                        className={`flex items-center space-x-2 p-2 rounded-xl border transition cursor-pointer text-[11px] font-medium ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-200'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleDeptToggle(dept)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Required Skills (Optional)</label>
                <input
                  type="text"
                  name="required_skills"
                  placeholder="e.g. Java, SQL, React"
                  value={formData.required_skills}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registration Opens *</label>
                <input
                  type="datetime-local"
                  name="registration_opening"
                  value={formData.registration_opening}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Registration Closes *</label>
                <input
                  type="datetime-local"
                  name="registration_closing"
                  value={formData.registration_closing}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl bg-slate-900/60 border border-slate-800 text-white p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Saving Drive...' : editingDriveId ? 'Update Drive' : 'Create Drive'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placement Drives List */}
        <div 
          ref={drivesSectionRef} 
          className={`lg:col-span-2 glass-card p-6 rounded-3xl border transition-all duration-500 ${
            highlightSection === 'drives' 
              ? 'border-indigo-500/80 ring-2 ring-indigo-500/40 shadow-2xl shadow-indigo-500/20' 
              : 'border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Created Placement Drives</h3>
                <p className="text-[11px] text-slate-400">Manage your recruitment drives and candidate applicants</p>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDriveFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  driveFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({jobPostings?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDriveFilter('active')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                  driveFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Active</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-[10px]">
                  {jobPostings?.filter(j => j.dynamic_status === 'Open')?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {(() => {
            const displayedPostings = (jobPostings || []).filter(job => 
              driveFilter === 'active' ? job.dynamic_status === 'Open' : true
            );

            if (displayedPostings.length === 0) {
              return (
                <div className="text-center py-12 text-slate-500">
                  <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">
                    {driveFilter === 'active' ? 'No currently active placement drives' : 'No placement drives created yet'}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {driveFilter === 'active' 
                      ? 'Switch filter to "All" to view upcoming or closed drives, or create a new drive.'
                      : 'Click "Create Placement Drive" above to add your first drive.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {displayedPostings.map((job) => {
                const statusColor = 
                  job.dynamic_status === 'Open'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : job.dynamic_status === 'Upcoming'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30';

                const hasStructured = 
                  job.minimum_cgpa !== null || 
                  (job.eligible_departments && job.eligible_departments.length > 0) || 
                  job.maximum_arrears !== null || 
                  job.minimum_year !== null;

                return (
                  <div key={job.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-bold text-sm text-white">{job.job_title || job.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                            {job.dynamic_status}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-300 font-semibold flex items-center space-x-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>CTC: {job.ctc || 'N/A'}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditForm(job)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Placement Drive"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition border border-red-500/20"
                          title="Delete Placement Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1.5">
                      <p className="line-clamp-2 text-slate-400">{job.job_description || job.description}</p>

                      {/* STRUCTURED ELIGIBILITY DISPLAY */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                        <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">Structured Eligibility:</p>
                        {hasStructured ? (
                          <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                            {job.minimum_cgpa !== null && (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-200 border border-indigo-500/20">
                                Min CGPA: <strong>{Number(job.minimum_cgpa).toFixed(2)}</strong>
                              </span>
                            )}
                            {job.maximum_arrears !== null && (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/20">
                                Max Arrears: <strong>{job.maximum_arrears}</strong>
                              </span>
                            )}
                            {job.minimum_year && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-200 border border-blue-500/20">
                                Min Year: <strong>{job.minimum_year}</strong>
                              </span>
                            )}
                            {job.eligible_departments && job.eligible_departments.length > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                                Depts: <strong>{job.eligible_departments.join(', ')}</strong>
                              </span>
                            )}
                            {job.required_skills && (
                              <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-200 border border-violet-500/20">
                                Skills: <strong>{job.required_skills}</strong>
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-400 italic">Eligibility: Manual verification required</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Opens: {formatDate(job.registration_opening)}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-red-400" />
                        <span>Closes: {formatDate(job.registration_closing)}</span>
                      </div>
                    </div>

                    {/* View Applicants Button */}
                    <div className="pt-2 border-t border-slate-800/60">
                      <button
                        onClick={() => toggleApplicants(job.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-xs font-semibold transition"
                      >
                        <span className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>View Applicants ({job.applications_count || 0})</span>
                        </span>
                        {expandedDriveId === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expandable Applicant List Panel */}
                    {expandedDriveId === job.id && (
                      <div className="mt-2 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/15 space-y-3 animate-in">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <Users className="w-4 h-4 text-indigo-400" />
                            <span>Applicant List</span>
                            {applicantsData[job.id] && (
                              <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                                {applicantsData[job.id].totalApplicants} total
                              </span>
                            )}
                          </h5>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => fetchApplicants(job.id)}
                              disabled={applicantsLoading}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition border border-slate-700 disabled:opacity-50"
                            >
                              {applicantsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                              <span>Refresh</span>
                            </button>
                            <button
                              onClick={() => handleExportShortlisted(job.id)}
                              disabled={exportingDriveId === job.id}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition shadow-sm shadow-indigo-900/50 disabled:opacity-50"
                            >
                              {exportingDriveId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              <span>{exportingDriveId === job.id ? 'Exporting...' : 'Export Shortlisted'}</span>
                            </button>
                          </div>
                        </div>

                        {applicantsError && (
                          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] flex items-center space-x-1.5">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{applicantsError}</span>
                          </div>
                        )}

                        {applicantsLoading && !applicantsData[job.id] ? (
                          <div className="text-center py-6 text-slate-500">
                            <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />
                            <p className="text-[11px]">Loading applicants...</p>
                          </div>
                        ) : applicantsData[job.id]?.applicants?.length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-[11px]">
                              <thead>
                                <tr className="bg-slate-900/80 text-slate-400 uppercase tracking-wider">
                                  <th className="px-3 py-2.5 text-left font-semibold">#</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Student Name</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Roll No</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Department</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Year</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">CGPA</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Arrears</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Skills</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Applied At</th>
                                  <th className="px-3 py-2.5 text-left font-semibold">Resume</th>
                                </tr>
                              </thead>
                              <tbody>
                                {applicantsData[job.id].applicants.map((applicant, idx) => {
                                  const statusStyles = {
                                    'Applied': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
                                    'Shortlisted': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
                                    'Interview': 'bg-amber-500/15 text-amber-300 border-amber-500/25',
                                    'Offered': 'bg-green-500/15 text-green-300 border-green-500/25',
                                    'Rejected': 'bg-red-500/15 text-red-300 border-red-500/25'
                                  };
                                  return (
                                    <tr key={applicant.application_id} className="border-t border-slate-800/60 hover:bg-slate-900/40 transition">
                                      <td className="px-3 py-2.5 text-slate-500 font-mono">{idx + 1}</td>
                                      <td className="px-3 py-2.5 text-white font-semibold">
                                        <div className="flex items-center space-x-1.5">
                                          <User className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                                          <span>{applicant.student_name || 'N/A'}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{applicant.student_email}</p>
                                      </td>
                                      <td className="px-3 py-2.5 text-slate-300 font-mono">{applicant.student_roll_no || '—'}</td>
                                      <td className="px-3 py-2.5 text-slate-300">{applicant.department || '—'}</td>
                                      <td className="px-3 py-2.5 text-slate-300">{applicant.year || '—'}</td>
                                      <td className="px-3 py-2.5 text-indigo-300 font-semibold">{applicant.cgpa !== null ? Number(applicant.cgpa).toFixed(2) : '—'}</td>
                                      <td className="px-3 py-2.5 text-slate-300">{applicant.arrear_history ?? '—'}</td>
                                      <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate" title={applicant.skills || ''}>{applicant.skills || '—'}</td>
                                      <td className="px-3 py-2.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyles[applicant.application_status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                          {applicant.application_status}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 text-slate-400">{formatDate(applicant.applied_at)}</td>
                                      <td className="px-3 py-2.5">
                                        {applicant.resume_path ? (
                                          <a
                                            href={`http://localhost:5000/${applicant.resume_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 transition"
                                          >
                                            <Download className="w-3 h-3" />
                                            <span>PDF</span>
                                          </a>
                                        ) : (
                                          <span className="text-slate-600">—</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : applicantsData[job.id] ? (
                          <div className="text-center py-8 text-slate-500">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-xs font-semibold">No applicants yet</p>
                            <p className="text-[10px] text-slate-600 mt-1">Applicants will appear here as students apply.</p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* HR Notifications / Account Alerts */}
      <div 
        ref={notificationsSectionRef}
        className={`glass-card p-6 rounded-3xl border transition-all duration-500 ${
          highlightSection === 'notifications'
            ? 'border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-2xl shadow-emerald-500/20'
            : 'border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Account Alerts</h3>
              <p className="text-[10px] text-slate-400">System & recruitment alerts</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {notifications && notifications.some(n => !n.is_read) && (
              <button
                type="button"
                onClick={handleMarkAllNotificationsRead}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition flex items-center space-x-1"
                title="Mark all notifications as read"
              >
                <Check className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>
        </div>

        {notifications && notifications.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {notifications.map((n) => {
              const isUnread = !n.is_read;
              return (
                <div 
                  key={n.id} 
                  onClick={(e) => isUnread && handleMarkNotificationRead(n.id, e)}
                  className={`p-4 rounded-2xl border transition-all duration-200 ${
                    isUnread 
                      ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/10 cursor-pointer hover:border-emerald-500/60' 
                      : 'bg-slate-900/40 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                      )}
                      <p className={`font-bold text-xs ${isUnread ? 'text-indigo-300' : 'text-slate-300'}`}>
                        {n.title}
                      </p>
                    </div>

                    {isUnread ? (
                      <button
                        type="button"
                        onClick={(e) => handleMarkNotificationRead(n.id, e)}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium transition flex items-center space-x-1"
                        title="Mark as read"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>Read</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">Read</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No notifications</p>
            <p className="text-[10px] text-slate-600 mt-1">Application and system alerts will appear here.</p>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
