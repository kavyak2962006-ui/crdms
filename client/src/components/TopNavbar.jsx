import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, User as UserIcon, Shield } from 'lucide-react';
import api, { markStudentNotificationRead, markAllStudentNotificationsRead } from '../services/api';

const TopNavbar = ({ toggleSidebar, pageTitle = "Dashboard" }) => {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = () => {
    if (user && user.role === 'hr') {
      api.get('/hr/notifications')
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    } else if (user && user.role === 'student') {
      api.get('/student/notifications')
        .then((res) => setNotifications(res.data || []))
        .catch(() => {});
    }
  };

  const handleMarkAsRead = async (id) => {
    if (user?.role === 'hr') {
      try {
        await api.put(`/hr/notifications/${id}/read`);
        fetchNotifications();
      } catch (e) {}
    } else if (user?.role === 'student') {
      try {
        await markStudentNotificationRead(id);
        fetchNotifications();
      } catch (e) {}
    }
  };

  const handleMarkAllAsRead = async () => {
    if (user?.role === 'hr') {
      try {
        await api.put('/hr/notifications/mark-all-read');
        fetchNotifications();
      } catch (e) {}
    } else if (user?.role === 'student') {
      try {
        await markAllStudentNotificationsRead();
        fetchNotifications();
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="h-20 glass-nav sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{pageTitle}</h2>
          <p className="text-xs text-slate-400 font-medium">Campus Recruitment & Development System</p>
        </div>
      </div>

      {/* Right side: User details, Notifications & Logout */}
      <div className="flex items-center space-x-4">
        {/* Notification Icon */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl glass-card text-slate-300 hover:text-white hover:border-indigo-500/40 relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 glass-card rounded-2xl p-4 shadow-2xl z-50 border border-slate-700/60">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <h3 className="font-semibold text-sm text-white">Notifications</h3>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      Mark all as read
                    </button>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                      {notifications.filter(n => !n.is_read).length} New
                    </span>
                  </div>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto mt-3 space-y-2 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-2.5 rounded-xl border flex flex-col cursor-pointer transition-colors ${n.is_read ? 'bg-slate-900/40 border-slate-800/50' : 'bg-slate-800/60 border-indigo-500/30'}`}
                      onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    >
                      <div className="flex justify-between items-start">
                        <p className={`font-semibold text-xs ${n.is_read ? 'text-slate-300' : 'text-indigo-300'}`}>{n.title}</p>
                        {!n.is_read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 flex-shrink-0 animate-pulse"></div>
                        )}
                      </div>
                      <p className={`mt-1 text-xs ${n.is_read ? 'text-slate-400' : 'text-slate-200'}`}>{n.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-xl glass-card">
          {user?.profile_picture ? (
            <img 
              src={`http://localhost:5000${user.profile_picture}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-lg object-cover border border-indigo-500/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="text-left">
            <p className="text-xs font-semibold text-white">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{user?.role || 'Guest'}</p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center space-x-2 px-3 py-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
