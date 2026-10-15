import React, { useState } from 'react';
import { Patient, TemperatureReading } from '../../types';
import { useStore, getWallClockTimeString } from '../../store/useStore';
import { isFever, isCritical } from '../../lib/selectors';
import {
  Thermometer,
  X,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Flame,
  Clock,
  History,
  ShieldAlert,
} from 'lucide-react';

interface RecordTemperatureModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onDuplicateDetected: (existingReading: TemperatureReading) => void;
}

export const RecordTemperatureModal: React.FC<RecordTemperatureModalProps> = ({
  patient,
  isOpen,
  onClose,
  onDuplicateDetected,
}) => {
  const { currentDate, recordTemperature } = useStore();

  const [tempValue, setTempValue] = useState<number>(36.8);
  const [confirmedLow, setConfirmedLow] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPicks = [36.5, 37.0, 37.5, 38.0];
  const currentTime = getWallClockTimeString();

  // Color feedback
  let displayColor = 'text-emerald-600 bg-emerald-50 border-emerald-300';
  let badgeLabel = 'Afebrile (Normal)';
  let StatusIcon = Thermometer;

  if (isCritical(tempValue)) {
    displayColor = 'text-red-800 bg-red-100 border-red-400';
    badgeLabel = 'CRITICAL FEVER (≥40.0 °C)';
    StatusIcon = Flame;
  } else if (isFever(tempValue)) {
    displayColor = 'text-red-600 bg-red-50 border-red-300';
    badgeLabel = 'Fever (≥38.0 °C)';
    StatusIcon = Flame;
  }

  const isOutOfRange = tempValue < 34.0 || tempValue > 42.0;
  const isUnusuallyLow = tempValue >= 34.0 && tempValue < 35.0;

  const handleStep = (delta: number) => {
    const next = Math.round((tempValue + delta) * 10) / 10;
    if (next >= 30.0 && next <= 45.0) {
      setTempValue(next);
      setInputError(null);
      if (next >= 35.0) setConfirmedLow(false);
    }
  };

  const handleSave = () => {
    if (isOutOfRange) {
      setInputError('Enter a value between 34.0 and 42.0 °C.');
      return;
    }

    if (isUnusuallyLow && !confirmedLow) {
      setInputError('Please confirm the unusually low reading before saving.');
      return;
    }

    const res = recordTemperature(patient.id, tempValue);

    if (res.isDuplicate && res.existingReading) {
      onClose();
      onDuplicateDetected(res.existingReading);
      return;
    }

    if (!res.success) {
      setInputError(res.error || 'Failed to record temperature.');
      return;
    }

    onClose();
  };

  // Last 3 readings for context
  const recentReadings = [...patient.readings].slice(-3).reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-wardTeal-100 text-wardTeal-800 flex items-center justify-center font-bold text-sm">
              {patient.roomId}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {patient.name}
              </h3>
              <p className="text-xs text-slate-500">
                {patient.gender}, {patient.age} yrs • Admitted {patient.admittedOn}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status banner */}
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${displayColor}`}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4" />
              <span>{badgeLabel}</span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {currentDate} {currentTime}
              </span>
            </div>
          </div>

          {/* Stepper & Big Numeric Display */}
          <div className="flex flex-col items-center justify-center py-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Temperature Reading
            </span>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleStep(-0.1)}
                className="w-13 h-13 min-w-[48px] min-h-[48px] rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 flex items-center justify-center shadow-sm transition-all"
                aria-label="Decrease 0.1 degree"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  value={tempValue}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setTempValue(isNaN(v) ? 0 : v);
                    setInputError(null);
                  }}
                  className="w-36 text-center text-4xl sm:text-5xl font-black tabular-nums bg-transparent border-b-2 border-wardTeal-600 focus:outline-none focus:border-wardTeal-700 text-slate-900"
                />
                <span className="text-xl sm:text-2xl font-bold text-slate-500">°C</span>
              </div>

              <button
                type="button"
                onClick={() => handleStep(0.1)}
                className="w-13 h-13 min-w-[48px] min-h-[48px] rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 active:scale-95 text-slate-700 flex items-center justify-center shadow-sm transition-all"
                aria-label="Increase 0.1 degree"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Pick Chips */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Presets:</span>
              {quickPicks.map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setTempValue(val);
                    setInputError(null);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    tempValue === val
                      ? 'bg-wardTeal-700 text-white border-wardTeal-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {val.toFixed(1)}°
                </button>
              ))}
            </div>
          </div>

          {/* Validation Messages per Rule 3 */}
          {isOutOfRange && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>Enter a value between 34.0 and 42.0 °C.</span>
            </div>
          )}

          {isUnusuallyLow && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                <span>Unusually low. Re-check the thermometer.</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmedLow}
                  onChange={e => setConfirmedLow(e.target.checked)}
                  className="rounded text-wardTeal-700 focus:ring-wardTeal-600 w-4 h-4"
                />
                <span>Confirm reading is verified</span>
              </label>
            </div>
          )}

          {isCritical(tempValue) && (
            <div className="p-3 rounded-xl bg-red-100 border border-red-400 text-red-900 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-700 animate-bounce" />
              <span>Critical temperature (≥ 40.0 °C). Saving will trigger an emergency doctor notification!</span>
            </div>
          )}

          {inputError && !isOutOfRange && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {inputError}
            </div>
          )}

          {/* Context: Last 3 Readings */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Recent Patient History</span>
            </div>
            {recentReadings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No prior readings recorded.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {recentReadings.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs"
                  >
                    <div className="text-[10px] text-slate-400">{r.date}</div>
                    <div
                      className={`font-bold tabular-nums text-sm ${
                        r.value >= 38.0 ? 'text-red-600' : 'text-slate-800'
                      }`}
                    >
                      {r.value.toFixed(1)} °C
                    </div>
                    <div className="text-[10px] text-slate-500">{r.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Save Action */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isOutOfRange || (isUnusuallyLow && !confirmedLow)}
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-wardTeal-700 hover:bg-wardTeal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Save Reading</span>
          </button>
        </div>
      </div>
    </div>
  );
};
