import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Stethoscope,
  Sparkles,
  UserX,
  Bed,
} from 'lucide-react';

export type BadgeVariant =
  | 'normal'
  | 'pending'
  | 'overdue'
  | 'fever'
  | 'critical'
  | 'doctor'
  | 'discharge_eligible'
  | 'discharge_approved'
  | 'discharged'
  | 'deceased'
  | 'vacant';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  label,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  switch (variant) {
    case 'normal':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#DCFCE7] text-[#16A34A] border border-green-200 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Normal'}</span>
        </span>
      );

    case 'pending':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#FEF3C7] text-[#D97706] border border-amber-200 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Pending'}</span>
        </span>
      );

    case 'overdue':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-red-50 text-red-600 border border-red-300 font-semibold ring-1 ring-red-400 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Overdue (>14:00)'}</span>
        </span>
      );

    case 'fever':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#FEE2E2] text-[#DC2626] border border-red-200 ${sizeClasses} ${className}`}
        >
          <Flame className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Fever (≥38°C)'}</span>
        </span>
      );

    case 'critical':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#FECACA] text-[#991B1B] border border-red-300 font-semibold ${sizeClasses} ${className}`}
        >
          <span className="relative flex h-2 w-2 mr-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-700"></span>
          </span>
          <Flame className="w-3.5 h-3.5 flex-shrink-0 text-red-700" />
          <span>{label || 'Critical (≥40°C)'}</span>
        </span>
      );

    case 'doctor':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#DBEAFE] text-[#2563EB] border border-blue-200 ${sizeClasses} ${className}`}
        >
          <Stethoscope className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Waiting on nurse'}</span>
        </span>
      );

    case 'discharge_eligible':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-[#CCFBF1] text-[#0F766E] border border-teal-300 font-semibold ${sizeClasses} ${className}`}
        >
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Eligible for discharge'}</span>
        </span>
      );

    case 'discharge_approved':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-teal-100 text-teal-800 border border-teal-300 ${sizeClasses} ${className}`}
        >
          <Bed className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Discharge Pending'}</span>
        </span>
      );

    case 'discharged':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Cured & Discharged'}</span>
        </span>
      );

    case 'deceased':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses} ${className}`}
        >
          <UserX className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Deceased'}</span>
        </span>
      );

    case 'vacant':
      return (
        <span
          className={`inline-flex items-center rounded-full bg-slate-100 text-slate-500 border border-dashed border-slate-300 ${sizeClasses} ${className}`}
        >
          <Bed className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{label || 'Vacant'}</span>
        </span>
      );

    default:
      return null;
  }
};
