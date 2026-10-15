import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  UserPlus,
  AlertTriangle,
  Bed,
  Check,
  X,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomId?: string;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  isOpen,
  onClose,
  defaultRoomId,
}) => {
  const { patients, admitPatient, currentDate } = useStore();

  // Find all occupied rooms
  const activeRooms = useMemo(() => {
    return new Set(
      patients
        .filter(p => (p.status === 'admitted' || p.status === 'discharge_approved') && p.roomId)
        .map(p => p.roomId as string)
    );
  }, [patients]);

  // Compute vacant rooms out of 74
  const vacantRooms = useMemo(() => {
    const list: string[] = [];
    for (let i = 1; i <= 74; i++) {
      const rid = `R-${String(i).padStart(2, '0')}`;
      if (!activeRooms.has(rid)) {
        list.push(rid);
      }
    }
    return list;
  }, [activeRooms]);

  const isFullCapacity = activeRooms.size >= 74;

  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(32);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phone, setPhone] = useState('+91 98');
  const [emergencyContact, setEmergencyContact] = useState('+91 97');
  const [selectedRoom, setSelectedRoom] = useState<string>(
    defaultRoomId && !activeRooms.has(defaultRoomId)
      ? defaultRoomId
      : vacantRooms[0] || ''
  );
  const [initialSymptoms, setInitialSymptoms] = useState('High grade viral fever, fatigue, dry cough');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFullCapacity) {
      setError('Centre at full capacity (74/74). Discharge a patient to free a bed.');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide a valid patient name.');
      return;
    }

    if (!selectedRoom) {
      setError('Please select an available room.');
      return;
    }

    const res = admitPatient({
      name: name.trim(),
      age: Number(age) || 30,
      gender,
      phone: phone.trim(),
      emergencyContact: emergencyContact.trim(),
      roomId: selectedRoom,
      initialSymptoms: initialSymptoms.trim(),
    });

    if (!res.success) {
      setError(res.error || 'Failed to admit patient.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-800 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Admit New Quarantine Patient
              </h3>
              <p className="text-xs text-slate-500">
                Facility Occupancy: {activeRooms.size} / 74 Beds Occupied
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Rule 9 Capacity Banner */}
          {isFullCapacity && (
            <div className="p-3.5 bg-red-100 border border-red-300 rounded-xl text-red-900 text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <div className="font-bold">Centre at full capacity (74/74).</div>
                <div className="font-normal mt-0.5">
                  All 74 quarantine rooms are occupied. Complete a discharge from the Discharge Queue to free a bed before admitting new patients.
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isFullCapacity}
              placeholder="e.g. Vikramaditya Joshi"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min="1"
                max="105"
                required
                disabled={isFullCapacity}
                value={age}
                onChange={e => setAge(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                disabled={isFullCapacity}
                onChange={e => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                disabled={isFullCapacity}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                disabled={isFullCapacity}
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Room Dropdown (Rule 9: lists only vacant rooms) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Assign Vacant Room</span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {vacantRooms.length} Beds Available
              </span>
            </label>
            <select
              value={selectedRoom}
              disabled={isFullCapacity || vacantRooms.length === 0}
              onChange={e => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100 bg-white font-semibold"
            >
              {vacantRooms.length === 0 ? (
                <option value="">No vacant rooms</option>
              ) : (
                vacantRooms.map(r => (
                  <option key={r} value={r}>
                    Room {r} (Vacant)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Initial Symptoms & Admission Note
            </label>
            <textarea
              rows={2}
              disabled={isFullCapacity}
              value={initialSymptoms}
              onChange={e => setInitialSymptoms(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFullCapacity || vacantRooms.length === 0}
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Admit Patient & Assign Bed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
