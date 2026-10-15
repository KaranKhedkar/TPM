import React from 'react';
import { Check, ShieldCheck, AlertCircle } from 'lucide-react';

interface StreakTrackerProps {
  streak: number; // 0, 1, 2, 3, etc.
  compact?: boolean;
}

export const StreakTracker: React.FC<StreakTrackerProps> = ({ streak, compact = false }) => {
  const isEligible = streak >= 3;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5" title={`No-fever streak: ${streak} day(s)`}>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(day => (
            <div
              key={day}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                streak >= day
                  ? 'bg-wardTeal-600'
                  : 'bg-slate-200 border border-slate-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-700 tabular-nums">
          {streak}/3d
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-wardTeal-600" />
          Fever-Free Discharge Streak
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isEligible
              ? 'bg-wardTeal-100 text-wardTeal-800 border border-wardTeal-300'
              : streak > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isEligible ? 'Eligible for Discharge' : `${streak} of 3 Days`}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(day => {
          const isCompleted = streak >= day;
          return (
            <div
              key={day}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-center transition-all ${
                isCompleted
                  ? 'bg-teal-50 border-teal-300 text-teal-900 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                  isCompleted
                    ? 'bg-wardTeal-600 text-white'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : day}
              </div>
              <span className="text-[11px] font-medium leading-tight">
                Day {day}
              </span>
              <span className="text-[10px] text-slate-500">
                {isCompleted ? 'Afebrile' : 'Required'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>Rule: Patient is cured after 3 full calendar days with temp &lt; 38.0 °C.</span>
      </div>
    </div>
  );
};
