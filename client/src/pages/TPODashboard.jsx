import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import Loading from '../components/Loading';
import { 
  GraduationCap, 
  Building2, 
  Briefcase, 
  Award, 
  AlertCircle,
  CheckCircle2,
  Search,
  Edit2,
  X,
  BookOpen,
  User,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';

const TPODashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Student academic management states
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    department: '',
    cgpa: '',
    arrear_history: '',
    year: ''
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchTPODashboard();
    fetchStudents();
  }, []);

  const fetchTPODashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tpo/dashboard');
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load TPO dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const res = await api.get('/tpo/students');
      setStudents(res.data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      department: student.department || '',
      cgpa: student.cgpa !== null && student.cgpa !== undefined ? String(student.cgpa) : '',
      arrear_history: student.arrear_history !== null && student.arrear_history !== undefined ? String(student.arrear_history) : '0',
      year: student.year || ''
    });
    setModalError('');
  };

  const closeEditModal = () => {
    setEditingStudent(null);
    setModalError('');
  };

  const handleSaveAcademic = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Validation
    if (!editForm.department.trim()) {
      setModalError('Department is required.');
      return;
    }

    if (editForm.cgpa !== '') {
      const numCgpa = parseFloat(editForm.cgpa);
      if (isNaN(numCgpa) || numCgpa < 0 || numCgpa > 10) {
        setModalError('CGPA must be a valid number between 0.00 and 10.00.');
        return;
      }
    }

    try {
      setSaving(true);
      setModalError('');
      const res = await api.put(`/tpo/students/${editingStudent.id}/academic`, {
        department: editForm.department.trim(),
        cgpa: editForm.cgpa === '' ? null : parseFloat(editForm.cgpa),
        arrear_history: editForm.arrear_history.trim(),
        year: editForm.year.trim()
      });

      setSuccess(`Academic profile updated for ${editingStudent.name}.`);
      setTimeout(() => setSuccess(''), 4000);
      closeEditModal();
      fetchStudents();
    } catch (err) {
      console.error('Save academic error:', err);
      setModalError(err.response?.data?.message || 'Failed to update academic profile.');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.student_id && s.student_id.toLowerCase().includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      (s.department && s.department.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <DashboardLayout pageTitle="TPO Dashboard">
        <Loading message="Loading placement officer metrics..." />
      </DashboardLayout>
    );
  }

  const { stats, recentDrives } = data || {};

  return (
    <DashboardLayout pageTitle="TPO Dashboard">
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl mb-8 border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Training & Placement Cell (TPO)
        </h1>
        <p className="text-xs lg:text-sm text-slate-400 mt-2 max-w-2xl">
          Centralized monitoring for student academic qualifications, placement eligibility, partner drives, and campus recruitment metrics.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Students</p>
            <p className="text-3xl font-extrabold text-white mt-2">{stats?.totalStudents || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Partner Companies</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">{stats?.totalCompanies || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Drives</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-2">{stats?.activeDrives || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Students Placed</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">{stats?.totalPlaced || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Student Academic Management Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Student Academic Records Management</h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify and update official Department, CGPA, and Arrear records. Students have read-only access to these verified fields.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, ID, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {studentsLoading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading student records...</div>
        ) : filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Student ID</th>
                  <th className="p-3">Name & Email</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">Arrears</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-3 font-mono font-bold text-indigo-400">{s.student_id || 'N/A'}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.email}</div>
                    </td>
                    <td className="p-3 text-slate-300">{s.department || '-'}</td>
                    <td className="p-3 text-slate-400">{s.year || '-'}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-xs">
                        {s.cgpa !== null && s.cgpa !== undefined ? Number(s.cgpa).toFixed(2) : 'Not Set'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        s.arrear_history === '0' || !s.arrear_history
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {s.arrear_history ?? '0'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEditModal(s)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Academic</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            No students matching your search criteria.
          </div>
        )}
      </div>

      {/* Recent Recruitment Drives Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <h3 className="font-bold text-base text-white mb-4">Placement Drive Overview</h3>
        {recentDrives && recentDrives.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Drive Title</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentDrives.map((drive) => (
                  <tr key={drive.id} className="hover:bg-slate-900/40">
                    <td className="p-3 font-semibold text-white">{drive.title}</td>
                    <td className="p-3 text-indigo-400">{drive.company}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                        {drive.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(drive.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No recruitment drives recorded</p>
          </div>
        )}
      </div>

      {/* Edit Academic Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 rounded-3xl border border-indigo-500/30 bg-slate-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Update Academic Record</h3>
                  <p className="text-[11px] text-slate-400">{editingStudent.name} ({editingStudent.student_id || 'ID N/A'})</p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAcademic} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  placeholder="e.g. Computer Science & Engineering"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">CGPA (0.00 - 10.00)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={editForm.cgpa}
                    onChange={(e) => setEditForm({ ...editForm, cgpa: e.target.value })}
                    placeholder="e.g. 8.50"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Arrear History</label>
                  <input
                    type="text"
                    value={editForm.arrear_history}
                    onChange={(e) => setEditForm({ ...editForm, arrear_history: e.target.value })}
                    placeholder="e.g. 0 or 1"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Academic Year</label>
                <input
                  type="text"
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  placeholder="e.g. 3rd Year"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Academic Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TPODashboard;
