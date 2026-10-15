import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { AlertItem } from '../../types';
import {
  Bell,
  X,
  Flame,
  AlertTriangle,
  Clock,
  Sparkles,
  Bed,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser, getAlertsForRole } = useStore();

  if (!isOpen) return null;

  const alerts = getAlertsForRole(currentUser.role);

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical_temp':
        return <Flame className="w-4 h-4 text-red-600" />;
      case 'fever_temp':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'overdue_temp':
        return <Clock className="w-4 h-4 text-red-500" />;
      case 'eligible_discharge':
        return <Sparkles className="w-4 h-4 text-wardTeal-600" />;
      case 'discharge_waiting':
        return <Bed className="w-4 h-4 text-amber-600" />;
      case 'mortality_alert':
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
  };

  const handleAction = (alert: AlertItem) => {
    onClose();
    if (alert.actionUrl) {
      navigate(alert.actionUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-wardTeal-100 text-wardTeal-800 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Facility Alerts
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold tabular-nums">
                  {alerts.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Filtered for role: <strong className="capitalize">{currentUser.role}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">All clear!</p>
              <p className="text-xs">No active alerts requiring your attention right now.</p>
            </div>
          ) : (
            alerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => handleAction(alert)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:shadow-md ${
                  alert.severity === 'critical'
                    ? 'bg-red-50/80 border-red-200 hover:border-red-300'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                    : 'bg-teal-50/60 border-teal-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-white rounded-lg shadow-2xs border border-slate-200/50">
                      {getAlertIcon(alert.type)}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{alert.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums flex-shrink-0">
                    {alert.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 ml-8 leading-relaxed">
                  {alert.message}
                </p>
                <div className="mt-2.5 ml-8 flex items-center gap-1 text-xs font-semibold text-wardTeal-700 hover:text-wardTeal-800">
                  <span>Open Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Alerts update dynamically with room events</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
