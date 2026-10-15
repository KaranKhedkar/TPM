import React, { useState } from 'react';
import { Patient, TemperatureReading } from '../../types';
import { AlertCircle, History, Edit3, X, Check } from 'lucide-react';

interface DuplicateReadingDialogProps {
  patient: Patient;
  existingReading: TemperatureReading;
  isOpen: boolean;
  onClose: () => void;
  onProceedToCorrection: (reason: string, initialTemp: number) => void;
}

export const DuplicateReadingDialog: React.FC<DuplicateReadingDialogProps> = ({
  patient,
  existingReading,
  isOpen,
  onClose,
  onProceedToCorrection,
}) => {
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [newTemp, setNewTemp] = useState<number>(existingReading.value);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCorrection = () => {
    setIsCorrecting(true);
  };

  const handleSaveCorrection = () => {
    if (newTemp < 34.0 || newTemp > 42.0) {
      setError('Enter a value between 34.0 and 42.0 °C.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Correction requires a reason (minimum 3 characters).');
      return;
    }
    setError(null);
    onProceedToCorrection(reason.trim(), newTemp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-amber-50 border-b border-amber-200/80 flex items-start gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-950">
              Temperature Already Recorded
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Room {patient.roomId} • {patient.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-amber-700 hover:text-amber-950 p-1 rounded-lg"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!isCorrecting ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-medium mb-1">
                  Existing Reading for Today:
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">
                    {existingReading.value.toFixed(1)} °C
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    at <span className="tabular-nums font-semibold">{existingReading.time}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recorded by: <strong>{existingReading.byName}</strong></span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Facility protocol allows <strong>exactly one official temperature reading per calendar day</strong>. Silent duplicate readings are prevented to protect clinical continuity.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartCorrection}
                  className="w-full py-2.5 px-4 rounded-xl bg-wardTeal-700 hover:bg-wardTeal-800 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Correct Reading</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corrected Temperature (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="34.0"
                    max="42.0"
                    value={newTemp}
                    onChange={e => setNewTemp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-lg font-bold tabular-nums border border-slate-300 rounded-xl focus:ring-2 focus:ring-wardTeal-600 focus:outline-none"
                  />
                  <span className="text-sm font-semibold text-slate-500">°C</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Correction <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Retested with digital thermometer, typographical error"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-wardTeal-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Minimum 3 characters. This note is preserved permanently in the patient audit log.
                </span>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCorrecting(false)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSaveCorrection}
                  className="w-full py-2.5 px-4 rounded-xl bg-wardTeal-700 hover:bg-wardTeal-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Correction</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
