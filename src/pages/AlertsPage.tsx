import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { AlertItem } from '../types';
import {
  Bell,
  Flame,
  Clock,
  Sparkles,
  Bed,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, getAlertsForRole } = useStore();

  const alerts = getAlertsForRole(currentUser.role);
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'all') return true;
    return a.type === filterType;
  });

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical_temp':
        return <Flame className="w-5 h-5 text-red-600" />;
      case 'fever_temp':
        return <Flame className="w-5 h-5 text-amber-600" />;
      case 'overdue_temp':
        return <Clock className="w-5 h-5 text-red-600" />;
      case 'eligible_discharge':
        return <Sparkles className="w-5 h-5 text-wardTeal-600" />;
      case 'discharge_waiting':
        return <Bed className="w-5 h-5 text-amber-600" />;
      case 'mortality_alert':
        return <ShieldAlert className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-wardTeal-700" />
            Facility Alerts & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active clinical and operational triggers filtered for role: <strong className="capitalize">{currentUser.role}</strong>
          </p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
          {filteredAlerts.length} Active Alerts
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'critical_temp', label: 'Critical Fever' },
          { id: 'overdue_temp', label: 'Overdue Checks' },
          { id: 'eligible_discharge', label: 'Eligible Discharges' },
          { id: 'discharge_waiting', label: 'Discharges Waiting' },
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors ${
              filterType === chip.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No active alerts</p>
            <p className="text-xs">All items in this category are operating smoothly.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => {
                if (alert.actionUrl) navigate(alert.actionUrl);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-xs flex items-start justify-between gap-4 ${
                alert.severity === 'critical'
                  ? 'bg-red-50/70 border-red-300'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50/70 border-amber-300'
                  : 'bg-teal-50/60 border-teal-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white rounded-xl shadow-2xs border border-slate-200/50 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                    {alert.roomId && (
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-700">
                        {alert.roomId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-semibold text-wardTeal-700 mt-2 hover:underline">
                    <span>Take Action / Open Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 tabular-nums flex-shrink-0">
                {alert.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
