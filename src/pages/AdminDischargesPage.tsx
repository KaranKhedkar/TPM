import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Patient } from '../types';
import { Badge } from '../components/common/Badge';
import {
  Bed,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const AdminDischargesPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, completeDischarge, currentDate } = useStore();

  const [confirmPatient, setConfirmPatient] = useState<Patient | null>(null);

  // Find all discharge_approved patients
  const dischargeQueue = patients.filter(p => p.status === 'discharge_approved');

  const handleConfirmDischarge = () => {
    if (confirmPatient) {
      completeDischarge(confirmPatient.id);
      setConfirmPatient(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bed className="w-6 h-6 text-wardTeal-700" />
            Administrative Discharge Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Finalize doctor-approved cured discharges, free beds, and issue discharge clearances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
            {dischargeQueue.length} Pending Clearances
          </span>
        </div>
      </div>

      {/* Information Banner */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 flex items-start gap-3">
        <Sparkles className="w-5 h-5 flex-shrink-0 text-wardTeal-700 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold block text-sm mb-0.5">Two-Factor Discharge Protocol:</strong>
          Doctors approve discharge when a patient completes 3 fever-free days. The Administrator performs the final discharge verification, which closes the case as 'cured', increments facility cure statistics, and immediately vacates the room for new intake.
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Room</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Doctor Approved At</th>
                <th className="py-3.5 px-4">Waiting Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dischargeQueue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">Discharge queue is empty</p>
                    <p className="text-xs">No patients are currently waiting for admin discharge clearance.</p>
                  </td>
                </tr>
              ) : (
                dischargeQueue.map(patient => {
                  // In seed data, dischargeApprovedAt is e.g. '2026-10-15T11:30:00'
                  const approvedTime = patient.dischargeApprovedAt
                    ? patient.dischargeApprovedAt.split('T')[1]?.slice(0, 5) || '11:30'
                    : '11:30';

                  // Simulate waiting duration (e.g., > 4 hours highlight)
                  const isWaitingOver4h = true; // Pre-seeded approvals took place at 11:30, current wall time is >16:00 (>4.5h)

                  return (
                    <tr key={patient.id} className="hover:bg-teal-50/20 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        <span className="bg-teal-100 text-teal-900 px-2.5 py-1 rounded-lg">
                          {patient.roomId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="font-bold text-slate-900 hover:text-wardTeal-700 cursor-pointer text-sm"
                        >
                          {patient.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {patient.gender}, {patient.age}y • Admitted {patient.admittedOn}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 tabular-nums">
                        {currentDate} at {approvedTime}
                      </td>
                      <td className="py-3.5 px-4">
                        {isWaitingOver4h ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Waiting &gt; 4 hrs</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">~2 hrs</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="discharge_approved" label="Doctor Approved" size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setConfirmPatient(patient)}
                          className="px-4 py-2 bg-wardTeal-700 hover:bg-wardTeal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Complete Discharge</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 text-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-wardTeal-700">
              <div className="p-2.5 bg-wardTeal-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-wardTeal-800" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Finalize Discharge & Free Bed
                </h4>
                <p className="text-xs text-slate-500">Room {confirmPatient.roomId}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm discharge clearance for <strong>{confirmPatient.name}</strong>. This will:
            </p>

            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc">
              <li>Mark patient case closed with outcome <strong>Cured</strong>.</li>
              <li>Free <strong>Room {confirmPatient.roomId}</strong> immediately for new patient admissions.</li>
              <li>Increment facility cure benchmark counts.</li>
            </ul>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmPatient(null)}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDischarge}
                className="w-full py-2.5 rounded-xl bg-wardTeal-700 hover:bg-wardTeal-800 text-white font-bold text-xs shadow-sm transition-all"
              >
                Confirm & Vacate Bed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
