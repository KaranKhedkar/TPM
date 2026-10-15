import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Stethoscope,
  Users,
  Bell,
  CheckCircle2,
  Sparkles,
  Flame,
  Clock,
  LogOut,
} from 'lucide-react';

export const DoctorSidebar: React.FC = () => {
  const { patients, currentDate, getAlertsForRole } = useStore();

  const alerts = getAlertsForRole('doctor');

  // Compute doctor badge counts
  const admitted = patients.filter(p => p.status === 'admitted');
  const eligibleCount = admitted.filter(p => {
    const r = p.readings.find(x => x.date === currentDate);
    const hasVisit = p.visits.some(v => v.date === currentDate);
    // Streak >= 3
    let streak = 0;
    if (r) {
      if (r.value >= 38.0) return false;
      streak++;
    }
    // simple estimate or selector
    return streak >= 3 && !hasVisit;
  }).length;

  const feverCount = admitted.filter(p => {
    const r = p.readings.find(x => x.date === currentDate);
    return r && r.value >= 38.0;
  }).length;

  const navItems = [
    {
      to: '/doctor/queue',
      label: 'Visit Queue',
      icon: Stethoscope,
      badge: feverCount > 0 ? `${feverCount} Fever` : undefined,
      badgeColor: 'bg-red-100 text-red-800',
    },
    {
      to: '/doctor/patients',
      label: 'All Patients',
      icon: Users,
      badge: `${admitted.length}`,
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      to: '/alerts',
      label: 'Doctor Alerts',
      icon: Bell,
      badge: alerts.length > 0 ? `${alerts.length}` : undefined,
      badgeColor: 'bg-red-600 text-white font-bold',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 sticky top-14 h-[calc(100vh-3.5rem)]">
      <div className="space-y-6">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical Rounds</span>
          </div>
          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Clinical Guidelines Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-wardTeal-600" />
            <span>Discharge Rule</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Patient must be afebrile (&lt;38.0 °C) for <strong>3 consecutive days</strong> before discharge can be approved.
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <NavLink
          to="/login"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Account / Walkthrough</span>
        </NavLink>
      </div>
    </aside>
  );
};
