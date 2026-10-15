import React, { useState } from 'react';
import { Patient, DoctorVisit } from '../../types';
import { useStore } from '../../store/useStore';
import {
  getTodayReading,
  getTodayVisit,
  calculateStreak,
  isEligibleForDischarge,
} from '../../lib/selectors';
import { Badge } from '../common/Badge';
import {
  Stethoscope,
  X,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Sparkles,
  Bed,
  FileText,
  Clock,
} from 'lucide-react';

interface PatientReviewPanelProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PatientReviewPanel: React.FC<PatientReviewPanelProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentDate, completeDoctorVisit } = useStore();

  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'continue' | 'discharge' | 'death'>('continue');
  const [isConfirmingDeath, setIsConfirmingDeath] = useState(false);
  const [causeOfDeath, setCauseOfDeath] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayReading = getTodayReading(patient, currentDate);
  const todayVisit = getTodayVisit(patient, currentDate);
  const streak = calculateStreak(patient, currentDate);
  const isEligible = isEligibleForDischarge(patient, currentDate);

  const canComplete = !!todayReading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!todayReading) {
      setError('Cannot complete visit without today\'s temperature reading.');
      return;
    }

    if (!note.trim() || note.trim().length < 3) {
      setError('Please enter a clinical visit note (minimum 3 characters).');
      return;
    }

    if (decision === 'discharge' && !isEligible) {
      setError('Patient is not eligible for discharge (requires 3 consecutive fever-free days).');
      return;
    }

    if (decision === 'death') {
      setIsConfirmingDeath(true);
      return;
    }

    const res = completeDoctorVisit(patient.id, note, decision);
    if (!res.success) {
      setError(res.error || 'Failed to complete visit.');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleConfirmDeath = () => {
    if (!causeOfDeath.trim() || causeOfDeath.trim().length < 3) {
      setError('Please provide a clinical cause / summary of death.');
      return;
    }

    const res = completeDoctorVisit(patient.id, note, 'death', causeOfDeath);
    if (!res.success) {
      setError(res.error || 'Failed to record death.');
      return;
    }

    setIsConfirmingDeath(false);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              {patient.roomId}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {patient.name}
                <span className="text-xs font-normal text-slate-500">
                  ({patient.gender}, {patient.age}y)
                </span>
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">
                  Streak: <strong className="tabular-nums">{streak}/3 days</strong>
                </span>
                {todayReading ? (
                  <Badge
                    variant={todayReading.value >= 38.0 ? 'fever' : 'normal'}
                    label={`Today: ${todayReading.value.toFixed(1)} °C at ${todayReading.time}`}
                    size="sm"
                  />
                ) : (
                  <Badge variant="doctor" label="Awaiting temperature" size="sm" />
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Rule 6 Warning: Awaiting temperature */}
          {!todayReading ? (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Visit Blocked: Awaiting Nurse Temperature</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Facility protocol requires a temperature reading to be recorded by a nurse before the doctor can conduct the daily clinical visit.
              </p>
            </div>
          ) : todayVisit ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <strong>Notice:</strong> A visit has already been logged for this patient today by{' '}
              {todayVisit.byName} ({todayVisit.decision}). You may record additional notes or update clinical assessment.
            </div>
          ) : null}

          {/* Clinical Notes Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Doctor's Daily Clinical Note</span>
              <span className="text-[11px] text-slate-400 font-normal">Min 3 characters</span>
            </label>
            <textarea
              rows={3}
              disabled={!canComplete}
              placeholder={
                canComplete
                  ? 'e.g. Chest clear, vitals stable, cough abating, no signs of dyspnea.'
                  : 'Disabled until nurse logs morning temperature.'
              }
              value={note}
              onChange={e => {
                setNote(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Decision Radio Group */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Clinical Decision & Disposition
            </label>
            <div className="space-y-2">
              {/* Option 1: Continue treatment */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'continue'
                    ? 'border-blue-500 bg-blue-50/50 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="continue"
                  checked={decision === 'continue'}
                  onChange={() => setDecision('continue')}
                  disabled={!canComplete}
                  className="mt-0.5 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Continue Quarantine & Treatment (Default)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Patient remains admitted. Daily monitoring and symptom management continue.
                  </div>
                </div>
              </label>

              {/* Option 2: Approve discharge (Rule 6 & 7) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  !isEligible
                    ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : decision === 'discharge'
                    ? 'border-teal-500 bg-teal-50/60 shadow-2xs cursor-pointer'
                    : 'border-slate-200 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="discharge"
                  checked={decision === 'discharge'}
                  onChange={() => setDecision('discharge')}
                  disabled={!canComplete || !isEligible}
                  className="mt-0.5 text-wardTeal-700 focus:ring-wardTeal-600"
                />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Approve for Discharge</span>
                    {isEligible ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        Eligible (Streak {streak}/3)
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        Requires streak ≥ 3 (Current: {streak})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Moves patient to Admin Discharge Queue. Room is vacated upon Admin clearance.
                  </div>
                </div>
              </label>

              {/* Option 3: Record death (Rule 8) */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  decision === 'death'
                    ? 'border-red-400 bg-red-50/50 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="death"
                  checked={decision === 'death'}
                  onChange={() => setDecision('death')}
                  disabled={!canComplete}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-red-700 flex items-center gap-1.5">
                    <UserX className="w-3.5 h-3.5" />
                    <span>Record Death (Deceased)</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Closes the patient case with outcome 'deceased' and frees the bed immediately.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canComplete}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            <span>{canComplete ? 'Complete Visit' : 'Awaiting Temperature'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Record Death */}
      {isConfirmingDeath && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-red-300 shadow-2xl w-full max-w-md p-5 text-slate-900 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Confirm Patient Death</h4>
                <p className="text-xs text-slate-500">Permanent clinical record</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to declare <strong>{patient.name}</strong> (Room {patient.roomId}) as deceased? This will immediately close the case, release room {patient.roomId}, and update the facility mortality metrics.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cause of Death / Clinical Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Acute respiratory failure secondary to viral pneumonia"
                value={causeOfDeath}
                onChange={e => setCauseOfDeath(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingDeath(false)}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeath}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <UserX className="w-4 h-4" />
                <span>Confirm Death</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
