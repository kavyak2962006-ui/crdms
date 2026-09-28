import React, { useState, useEffect, useRef } from 'react';
import { Mail, Phone, Camera, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import api, { getSettings, updateProfile, updateNotifications } from '../services/api';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    email: '',
    phone: '',
    profile_picture: null,
    new_drive_alerts: true,
    application_status_alerts: true,
    interview_alerts: true
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      setProfileData({
        email: res.data.email || '',
        phone: res.data.phone || '',
        profile_picture: res.data.profile_picture || null,
        new_drive_alerts: Boolean(res.data.new_drive_alerts),
        application_status_alerts: Boolean(res.data.application_status_alerts),
        interview_alerts: Boolean(res.data.interview_alerts)
      });
      if (res.data.profile_picture) {
        setPreviewImage(`http://localhost:5000${res.data.profile_picture}`);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 2MB.' });
        return;
      }
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      if (selectedImage) {
        formData.append('profile_picture', selectedImage);
      }

      const res = await updateProfile(formData);
      
      // Update local storage user if needed
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.email = profileData.email;
        user.profile_picture = res.data.user.profile_picture;
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      // Force reload to update TopNavbar
      window.location.reload();
      
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
      setSavingProfile(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    const newValue = !profileData[key];
    setProfileData(prev => ({ ...prev, [key]: newValue }));
    
    setSavingNotifications(true);
    try {
      const payload = {
        new_drive_alerts: key === 'new_drive_alerts' ? newValue : profileData.new_drive_alerts,
        application_status_alerts: key === 'application_status_alerts' ? newValue : profileData.application_status_alerts,
        interview_alerts: key === 'interview_alerts' ? newValue : profileData.interview_alerts,
      };
      await updateNotifications(payload);
    } catch (err) {
      console.error(err);
      // Revert if failed
      setProfileData(prev => ({ ...prev, [key]: !newValue }));
      setMessage({ type: 'error', text: 'Failed to update notification settings.' });
    } finally {
      setSavingNotifications(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          message.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
        }`}>
          {message.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Settings */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-white">Profile Settings</h3>
            <p className="text-sm text-slate-400">Update your contact information and profile picture</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-slate-800/50 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-slate-500" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />
            </div>
            <div className="text-sm text-slate-400">
              <p className="font-semibold text-slate-300">Profile Picture</p>
              <p className="mt-1 text-xs">JPG, PNG or WEBP. Max size 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={profileData.email}
                  onChange={e => setProfileData({...profileData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={e => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white transition-all text-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="button"
              onClick={fetchSettings}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card p-6 lg:p-8 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-400" /> Notification Preferences
            </h3>
            <p className="text-sm text-slate-400">Choose what updates you want to receive via email and in-app</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/30 transition-colors">
            <div>
              <p className="font-semibold text-slate-200">New Placement Drive Alerts</p>
              <p className="text-xs text-slate-500 mt-1">Get notified when a new placement drive is published and matches your eligibility.</p>
            </div>
            <button 
              onClick={() => handleNotificationToggle('new_drive_alerts')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${profileData.new_drive_alerts ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profileData.new_drive_alerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/30 transition-colors">
            <div>
              <p className="font-semibold text-slate-200">Application Status Alerts</p>
              <p className="text-xs text-slate-500 mt-1">Get notified when your application moves to a new stage (e.g. Shortlisted, Offered).</p>
            </div>
            <button 
              onClick={() => handleNotificationToggle('application_status_alerts')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${profileData.application_status_alerts ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profileData.application_status_alerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-800/30 transition-colors">
            <div>
              <p className="font-semibold text-slate-200">Interview Booking Alerts</p>
              <p className="text-xs text-slate-500 mt-1">Get notified for interview slot updates and reminders.</p>
            </div>
            <button 
              onClick={() => handleNotificationToggle('interview_alerts')}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${profileData.interview_alerts ? 'bg-indigo-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profileData.interview_alerts ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
