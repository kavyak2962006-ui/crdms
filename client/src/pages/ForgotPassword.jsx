import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'OTP code generated successfully.');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to process request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-3">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">Password Recovery</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your email to receive a 6-digit OTP code</p>
        </div>

        <div className="glass-card p-8 rounded-3xl shadow-2xl border border-slate-800/80">
          {message ? (
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-sm">{message}</p>
                <p className="text-[11px] text-slate-400 mt-2">
                  (In development environment, check your backend server terminal window for the printed OTP)
                </p>
              </div>

              <button
                onClick={() => navigate('/reset-password', { state: { email } })}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                <span>Proceed to Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@kct.ac.in"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                <span>{loading ? 'Generating OTP...' : 'Send OTP Code'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
