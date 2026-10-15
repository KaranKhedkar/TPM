import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Staff, Role } from '../../types';
import {
  ShieldAlert,
  Bell,
  Calendar,
  User,
  Users,
  ChevronDown,
  LogOut,
  Stethoscope,
  Activity,
  Shield,
  Check,
  HelpCircle,
} from 'lucide-react';

interface TopNavProps {
  onOpenAlerts?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onOpenAlerts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, staff, currentDate, setCurrentUser, getAlertsForRole } = useStore();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const alerts = getAlertsForRole(currentUser.role);
  const alertCount = alerts.length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchUser = (user: Staff) => {
    setCurrentUser(user);
    setIsUserMenuOpen(false);

    // If new role cannot access current page, navigate to default home
    const path = location.pathname;
    if (user.role === 'nurse' && (path.startsWith('/admin') || path.startsWith('/doctor'))) {
      navigate('/rounds');
    } else if (user.role === 'doctor' && (path.startsWith('/admin') || path === '/rounds')) {
      navigate('/doctor/queue');
    } else if (user.role === 'admin' && (path === '/rounds' || path.startsWith('/doctor'))) {
      navigate('/admin/dashboard');
    }
  };

  const getRoleBadgeStyle = (role: Role) => {
    switch (role) {
      case 'nurse':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'doctor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'nurse':
        return <Activity className="w-3.5 h-3.5" />;
      case 'doctor':
        return <Stethoscope className="w-3.5 h-3.5" />;
      case 'admin':
        return <Shield className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div
          onClick={() => {
            if (currentUser.role === 'nurse') navigate('/rounds');
            else if (currentUser.role === 'doctor') navigate('/doctor/queue');
            else navigate('/admin/dashboard');
          }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-wardTeal-700 flex items-center justify-center text-white shadow-sm group-hover:bg-wardTeal-800 transition-colors">
            <ShieldAlert className="w-5 h-5 text-teal-100" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
              WardWatch
              <span className="hidden md:inline-block text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Facility
              </span>
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              Quarantine & Discharge System
            </span>
          </div>
        </div>

        {/* Center / Right utilities */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Simulated Date Chip */}
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200 tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-wardTeal-700" />
            <span className="hidden xs:inline text-slate-500 font-normal">Day:</span>
            <span>{currentDate}</span>
          </div>

          {/* Alerts Bell */}
          <button
            onClick={() => {
              if (onOpenAlerts) onOpenAlerts();
              else navigate('/alerts');
            }}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="View role-specific alerts"
            aria-label="Alerts"
          >
            <Bell className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full border-2 border-white animate-pulse tabular-nums">
                {alertCount}
              </span>
            )}
          </button>

          {/* Switch User Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-full sm:rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
              aria-label="User menu"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                {currentUser.name.charAt(currentUser.name.indexOf(' ') + 1) || currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {currentUser.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border w-fit ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  {getRoleIcon(currentUser.role)}
                  {currentUser.role}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Menu modal / popover */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Switch Demo Account</div>
                    <div className="text-[11px] text-slate-500">Fast role switching (no password)</div>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/login');
                    }}
                    className="text-[11px] text-wardTeal-700 hover:underline flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Guide</span>
                  </button>
                </div>

                {/* Staff List grouped by role */}
                <div className="max-h-72 overflow-y-auto p-1 divide-y divide-slate-50">
                  {(['nurse', 'doctor', 'admin'] as Role[]).map(roleGroup => {
                    const groupStaff = staff.filter(s => s.role === roleGroup && s.active);
                    return (
                      <div key={roleGroup} className="py-1">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          {getRoleIcon(roleGroup)}
                          <span>{roleGroup} Staff</span>
                        </div>
                        {groupStaff.map(member => {
                          const isSelected = member.id === currentUser.id;
                          return (
                            <button
                              key={member.id}
                              onClick={() => handleSwitchUser(member)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                                isSelected
                                  ? 'bg-wardTeal-50 text-wardTeal-950 font-semibold'
                                  : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    isSelected
                                      ? 'bg-wardTeal-700 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {member.name.charAt(member.name.indexOf(' ') + 1) || member.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="leading-tight">{member.name}</div>
                                  <div className="text-[10px] text-slate-400">{member.email}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-wardTeal-700" />}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <div className="p-2 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Return to Login & Reviewer Walkthrough</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
