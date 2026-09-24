import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

const DashboardLayout = ({ children, pageTitle = "Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  const resetInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, INACTIVITY_LIMIT_MS);
  };

  const handleInactivityLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { state: { message: 'Your session expired due to inactivity.' } });
  };

  useEffect(() => {
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity);
    });

    resetInactivityTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <TopNavbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          pageTitle={pageTitle} 
        />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
