import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, Hash, BookOpen, Calendar, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const COLLEGE_DOMAIN = 'kct.ac.in';

const StudentRegistration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    student_id: '',
    department: 'Computer Science & Engineering',
    year: '3rd Year'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Email Domain Validation
    const emailLower = formData.email.toLowerCase().trim();
    if (!emailLower.endsWith(`@${COLLEGE_DOMAIN}`)) {
      return setError('Please use your official college email address.');
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      navigate('/login', {
        state: { message: response.data.message || 'Registration successful. You can now log in.' }
      });
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Please check details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100 py-12">
      <div className="w-full max-w-xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/30 mb-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Student Registration</h1>
          <p className="text-xs text-slate-400 mt-1">Register using your official @kct.ac.in college email</p>
        </div>

        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-slate-800/80">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex Johnson"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">College Email (@kct.ac.in)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@kct.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Student ID / Roll No</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="student_id"
                    required
                    value={formData.student_id}
                    onChange={handleChange}
                    placeholder="717821CS101"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Department</label>
                <div className="relative">
                  <BookOpen className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  >
                    <option value="Computer Science & Engineering" className="bg-slate-900">CSE</option>
                    <option value="Information Technology" className="bg-slate-900">IT</option>
                    <option value="Electronics & Communication" className="bg-slate-900">ECE</option>
                    <option value="Electrical & Electronics" className="bg-slate-900">EEE</option>
                    <option value="Mechanical Engineering" className="bg-slate-900">MECH</option>
                    <option value="Artificial Intelligence & Data Science" className="bg-slate-900">AI & DS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Year of Study</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  >
                    <option value="1st Year" className="bg-slate-900">1st Year</option>
                    <option value="2nd Year" className="bg-slate-900">2nd Year</option>
                    <option value="3rd Year" className="bg-slate-900">3rd Year</option>
                    <option value="4th Year" className="bg-slate-900">4th Year</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account...' : 'Register Student Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-indigo-400 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
