import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  X,
  FileText,
  Settings
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role || 'student';

  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Placement Drives', path: '/admin/drives', icon: Briefcase },
          { name: 'HR Approvals', path: '/admin/hr-approval', icon: CheckCircle2 },
          { name: 'User Management', path: '/admin/users', icon: Users },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'hr':
        return [
          { name: 'Dashboard', path: '/hr/dashboard', icon: LayoutDashboard },
          { name: 'Company Profile', path: '/hr/company-profile', icon: Building2 },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'tpo':
        return [
          { name: 'Dashboard', path: '/tpo/dashboard', icon: LayoutDashboard },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
      case 'student':
      default:
        return [
          { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { name: 'Placement Drives', path: '/student/drives', icon: Briefcase },
          { name: 'Secondary Profile', path: '/student/secondary-profile', icon: FileText },
          { name: 'Settings', path: '/settings', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-screen w-64 glass-sidebar flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-wider text-white">CRDM</h1>
                <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Campus Recruit</p>
              </div>
            </div>
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => isOpen && toggleSidebar()}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Role Badge */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="glass-card p-3 rounded-xl flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
