import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { RoomGrid } from '../components/admin/RoomGrid';
import { AdmitPatientModal } from '../components/admin/AdmitPatientModal';
import {
  UserPlus,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';

export const AdminAdmissionsPage: React.FC = () => {
  const { patients, currentDate } = useStore();
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [selectedVacantRoom, setSelectedVacantRoom] = useState<string | undefined>(undefined);

  const activePatients = patients.filter(
    p => (p.status === 'admitted' || p.status === 'discharge_approved') && p.roomId
  );
  const occupancy = activePatients.length;
  const isFullCapacity = occupancy >= 74;

  const handleSelectVacantRoom = (roomId: string) => {
    setSelectedVacantRoom(roomId);
    setIsAdmitModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-purple-700" />
            Admissions & Bed Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Assign incoming quarantine admissions and supervise 74 facility rooms
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedVacantRoom(undefined);
            setIsAdmitModalOpen(true);
          }}
          disabled={isFullCapacity}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
            isFullCapacity
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              : 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm active:scale-95'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>{isFullCapacity ? 'Centre Full (74/74)' : 'Admit Patient'}</span>
        </button>
      </div>

      {/* Rule 9 Capacity Alert Banner */}
      {isFullCapacity && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-950 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold text-red-900 block text-sm">
              Centre at full capacity (74/74).
            </strong>
            Discharge a patient in the Discharge Queue to free a bed before admitting new patients.
          </div>
        </div>
      )}

      {/* Interactive 74-Room Grid */}
      <RoomGrid
        patients={patients}
        currentDate={currentDate}
        onSelectVacantRoom={handleSelectVacantRoom}
      />

      {/* Admit Patient Modal */}
      {isAdmitModalOpen && (
        <AdmitPatientModal
          isOpen={true}
          defaultRoomId={selectedVacantRoom}
          onClose={() => setIsAdmitModalOpen(false)}
        />
      )}
    </div>
  );
};
