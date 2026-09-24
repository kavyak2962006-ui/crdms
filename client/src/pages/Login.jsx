import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
const [selectedRole, setSelectedRole] = useState('student');

  const redirectMessage = location.state?.message || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password, role: selectedRole });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Route based on user role
      switch (user.role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'hr':
          navigate('/hr/dashboard');
          break;
        case 'tpo':
          navigate('/tpo/dashboard');
          break;
        case 'admin':
          navigate('/admin/dashboard');
          break;
        default:
          navigate('/student/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to log in. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      {/* Background Glow Elements */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/30 mb-4">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">CRDM Platform</h1>
          <p className="text-sm text-slate-400 mt-1 font-medium">Campus Recruitment & Development Management</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-slate-800/80">
          <h2 className="text-xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials to access your account dashboard</p>

          {redirectMessage && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-2 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Login As selector */}
            <div className="mb-4">
              <p className="text-sm font-medium text-slate-300 mb-1">Login As</p>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setSelectedRole('student')} className={`px-3 py-1 rounded-md ${selectedRole === 'student' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-slate-300'} hover:bg-indigo-500 transition`}>Student</button>
                <button type="button" onClick={() => setSelectedRole('hr')} className={`px-3 py-1 rounded-md ${selectedRole === 'hr' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-slate-300'} hover:bg-indigo-500 transition`}>HR</button>
                <button type="button" onClick={() => setSelectedRole('tpo')} className={`px-3 py-1 rounded-md ${selectedRole === 'tpo' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-slate-300'} hover:bg-indigo-500 transition`}>TPO</button>
                <button type="button" onClick={() => setSelectedRole('admin')} className={`px-3 py-1 rounded-md ${selectedRole === 'admin' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-slate-300'} hover:bg-indigo-500 transition`}>Admin</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@kct.ac.in or recruiter@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Registration Navigation Options */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Are you a student?{' '}
              <Link to="/register" className="font-bold text-indigo-400 hover:underline">
                Register as Student
              </Link>
            </p>
            <p className="text-xs text-slate-400">
              Are you a corporate recruiter?{' '}
              <Link to="/register-hr" className="font-bold text-indigo-400 hover:underline">
                Register HR Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
