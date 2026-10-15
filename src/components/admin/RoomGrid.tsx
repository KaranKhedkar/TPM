import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types';
import {
  getTodayReading,
  isFever,
  isCritical,
} from '../../lib/selectors';
import { Bed, UserPlus } from 'lucide-react';

interface RoomGridProps {
  patients: Patient[];
  currentDate: string;
  onSelectVacantRoom?: (roomId: string) => void;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  patients,
  currentDate,
  onSelectVacantRoom,
}) => {
  const navigate = useNavigate();

  // Map 74 rooms: R-01 to R-74
  const rooms = Array.from({ length: 74 }, (_, idx) => {
    const roomId = `R-${String(idx + 1).padStart(2, '0')}`;
    const patient = patients.find(
      p => p.roomId === roomId && (p.status === 'admitted' || p.status === 'discharge_approved')
    );
    return { roomId, patient };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
        <div className="font-bold text-slate-800">
          74-Bed Facility Layout & Live Room Census
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
            <span>Normal / Afebrile</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span>Pending Temp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500 inline-block" />
            <span>Fever</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-800 inline-block ring-2 ring-red-400" />
            <span>Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-wardTeal-600 inline-block" />
            <span>Discharge Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-dashed border-slate-400 inline-block" />
            <span>Vacant Bed</span>
          </div>
        </div>
      </div>

      {/* Grid: 74 rooms */}
      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2">
        {rooms.map(({ roomId, patient }) => {
          if (!patient) {
            // Vacant bed
            return (
              <button
                key={roomId}
                onClick={() => {
                  if (onSelectVacantRoom) onSelectVacantRoom(roomId);
                  else navigate('/admin/admissions');
                }}
                className="group p-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-emerald-50 hover:border-emerald-400 transition-all text-center flex flex-col items-center justify-center min-h-[58px]"
                title={`Room ${roomId}: Vacant. Click to admit patient.`}
              >
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700">
                  {roomId}
                </span>
                <span className="text-[9px] font-semibold text-emerald-600 opacity-90 group-hover:opacity-100 mt-0.5">
                  VACANT
                </span>
              </button>
            );
          }

          const reading = getTodayReading(patient, currentDate);
          const isCriticalFever = reading && isCritical(reading.value);
          const isNormalFever = reading && isFever(reading.value);

          let cellColor = 'bg-amber-50 border-amber-300 text-amber-900'; // pending temp
          let statusLabel = 'Pending';

          if (patient.status === 'discharge_approved') {
            cellColor = 'bg-teal-50 border-teal-400 text-teal-900 ring-1 ring-teal-400';
            statusLabel = 'Approved';
          } else if (isCriticalFever) {
            cellColor = 'bg-red-100 border-red-500 text-red-950 ring-2 ring-red-400 animate-pulse';
            statusLabel = `${reading.value.toFixed(1)}°`;
          } else if (isNormalFever) {
            cellColor = 'bg-red-50 border-red-300 text-red-900';
            statusLabel = `${reading.value.toFixed(1)}°`;
          } else if (reading) {
            cellColor = 'bg-emerald-50 border-emerald-300 text-emerald-900';
            statusLabel = `${reading.value.toFixed(1)}°`;
          }

          return (
            <button
              key={roomId}
              onClick={() => navigate(`/patients/${patient.id}`)}
              className={`p-2 rounded-xl border transition-all text-center flex flex-col items-center justify-center min-h-[58px] hover:scale-105 hover:shadow-xs ${cellColor}`}
              title={`Room ${roomId}: ${patient.name} (${statusLabel})`}
            >
              <span className="text-[10px] font-extrabold tracking-tight leading-none">
                {roomId}
              </span>
              <span className="text-[10px] font-bold tabular-nums mt-1 leading-none truncate max-w-full">
                {statusLabel}
              </span>
              <span className="text-[9px] text-slate-600 truncate max-w-full mt-0.5 font-medium leading-none">
                {patient.name.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
