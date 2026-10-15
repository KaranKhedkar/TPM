import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  getTodayReading,
  getTodayVisit,
  calculateStreak,
  isEligibleForDischarge,
  getLengthOfStay,
  isFever,
  isCritical,
} from '../lib/selectors';
import { Badge } from '../components/common/Badge';
import { StreakTracker } from '../components/common/StreakTracker';
import { RecordTemperatureModal } from '../components/nurse/RecordTemperatureModal';
import { DuplicateReadingDialog } from '../components/nurse/DuplicateReadingDialog';
import { PatientReviewPanel } from '../components/doctor/PatientReviewPanel';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Thermometer,
  Stethoscope,
  Bed,
  CheckCircle2,
  AlertTriangle,
  History,
  FileText,
  User,
  ShieldAlert,
} from 'lucide-react';
import { TemperatureReading } from '../types';

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, currentUser, currentDate, completeDischarge, recordTemperature } = useStore();

  const patient = patients.find(p => p.id === id);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [duplicateReadingInfo, setDuplicateReadingInfo] = useState<TemperatureReading | null>(null);
  const [isVisitPanelOpen, setIsVisitPanelOpen] = useState(false);

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-500">
        <h2 className="text-xl font-bold text-slate-800">Patient Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested patient ID does not exist.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
        >
          Go Back
        </button>
      </div>
    );
  }

  const todayReading = getTodayReading(patient, currentDate);
  const todayVisit = getTodayVisit(patient, currentDate);
  const streak = calculateStreak(patient, currentDate);
  const isEligible = isEligibleForDischarge(patient, currentDate);
  const stayLength = getLengthOfStay(patient, currentDate);

  // Chart data: prepare chronological temperature points
  const chartData = patient.readings.map(r => ({
    date: r.date.slice(5), // 'MM-DD'
    temp: r.value,
    time: r.time,
    byName: r.byName,
    isFever: r.value >= 38.0,
    isCritical: r.value >= 40.0,
    corrected: r.corrected,
  }));

  const handleProceedCorrection = (reason: string, initialTemp: number) => {
    recordTemperature(patient.id, initialTemp, true, reason);
    setDuplicateReadingInfo(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-28 sm:pb-16 space-y-5">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Census / Queue</span>
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-wardTeal-700 text-white flex flex-col items-center justify-center font-black flex-shrink-0 shadow-sm">
            <span className="text-[10px] font-bold text-teal-200 uppercase leading-none">
              Room
            </span>
            <span className="text-xl font-black leading-none mt-1">
              {patient.roomId ? patient.roomId.replace('R-', '') : 'Closed'}
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {patient.name}
              </h1>
              {patient.status === 'discharge_approved' ? (
                <Badge variant="discharge_approved" label="Discharge Approved" />
              ) : patient.status === 'discharged' ? (
                <Badge variant="discharged" label="Cured & Discharged" />
              ) : patient.status === 'deceased' ? (
                <Badge variant="deceased" label="Deceased" />
              ) : isEligible ? (
                <Badge variant="discharge_eligible" label="Eligible for Discharge" />
              ) : todayReading && isCritical(todayReading.value) ? (
                <Badge variant="critical" label="Critical Fever" />
              ) : todayReading && isFever(todayReading.value) ? (
                <Badge variant="fever" label="Active Fever" />
              ) : (
                <Badge variant="normal" label="Admitted Active" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>{patient.gender}, {patient.age} years old</span>
              <span>•</span>
              <span>Phone: <strong className="text-slate-700 tabular-nums">{patient.phone}</strong></span>
              <span>•</span>
              <span>Emergency: <strong className="text-slate-700 tabular-nums">{patient.emergencyContact}</strong></span>
              <span>•</span>
              <span>Day <strong className="text-slate-800">{stayLength}</strong> of stay (Admitted {patient.admittedOn})</span>
            </div>
          </div>
        </div>

        {/* Discharge streak tracker right */}
        <div className="md:w-72">
          <StreakTracker streak={streak} />
        </div>
      </div>

      {/* Main Grid: Chart & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Temperature Line Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-wardTeal-700" />
                  Quarantine Temperature Log & Thermal Curve
                </h3>
                <p className="text-xs text-slate-500">
                  Target: 3 full consecutive calendar days below 38.0 °C fever threshold
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Afebrile (&lt;38°C)
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                  Fever (≥38°C)
                </span>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400 italic">
                No temperature readings recorded yet.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis
                      domain={[35.0, 42.0]}
                      ticks={[35, 36, 37, 38, 39, 40, 41]}
                      tick={{ fontSize: 11, fill: '#94A3B8' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                              <div className="font-bold text-slate-900">
                                Date: {data.date} at {data.time}
                              </div>
                              <div
                                className={`text-sm font-extrabold tabular-nums ${
                                  data.temp >= 38.0 ? 'text-red-600' : 'text-emerald-700'
                                }`}
                              >
                                {data.temp.toFixed(1)} °C {data.temp >= 38.0 ? '(Fever)' : '(Normal)'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Recorded by: {data.byName}
                              </div>
                              {data.corrected && (
                                <div className="text-[10px] text-amber-700 font-semibold">
                                  Corrected Reading
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Shaded afebrile safe zone (35.0 to 38.0 °C) */}
                    <ReferenceArea y1={35.0} y2={38.0} fill="#DCFCE7" fillOpacity={0.4} />
                    {/* Dashed Fever Threshold Line at 38.0 °C */}
                    <ReferenceLine
                      y={38.0}
                      stroke="#DC2626"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Fever Threshold 38.0 °C',
                        fill: '#DC2626',
                        fontSize: 10,
                        position: 'insideTopRight',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="temp"
                      stroke="#0F766E"
                      strokeWidth={2.5}
                      dot={({ cx, cy, payload }) => (
                        <circle
                          key={payload.date + payload.time}
                          cx={cx}
                          cy={cy}
                          r={payload.isCritical ? 6 : payload.isFever ? 5 : 4}
                          fill={payload.isCritical ? '#991B1B' : payload.isFever ? '#DC2626' : '#16A34A'}
                          stroke="#FFFFFF"
                          strokeWidth={2}
                        />
                      )}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Patient Clinical Audit Trail ({patient.auditLog.length} events)
            </h3>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {patient.auditLog.map((log, idx) => (
                <div key={idx} className="py-2.5 flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-wardTeal-600 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400 tabular-nums">
                        {log.timestamp.replace('T', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      By: <strong>{log.byName}</strong> ({log.role.toUpperCase()})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Today's Process Checklist & Visit Notes */}
        <div className="space-y-6">
          {/* Today's 2-Step Process Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-wardTeal-700" />
              Today's Facility Protocol Checklist
            </h3>

            <div className="space-y-3">
              {/* Step 1: Temperature */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  todayReading
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                    todayReading
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  1
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Nurse Temperature Reading
                  </div>
                  {todayReading ? (
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Completed: <strong>{todayReading.value.toFixed(1)} °C</strong> at {todayReading.time} by {todayReading.byName}.
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      Pending. Nurse must record morning temperature before doctor visit can proceed.
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Doctor Visit */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  todayVisit
                    ? 'bg-blue-50/60 border-blue-200'
                    : todayReading
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                    todayVisit
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  2
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Doctor Daily Clinical Visit
                  </div>
                  {todayVisit ? (
                    <div className="text-[11px] text-blue-900 mt-0.5">
                      Completed at {todayVisit.time} by {todayVisit.byName} ({todayVisit.decision}).
                    </div>
                  ) : todayReading ? (
                    <div className="text-[11px] text-blue-700 mt-0.5">
                      Unlocked and ready for doctor review.
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Locked: Awaiting Step 1 (Nurse temperature).
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Discharge Clearance */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  patient.status === 'discharged'
                    ? 'bg-teal-50 border-teal-300'
                    : patient.status === 'discharge_approved'
                    ? 'bg-amber-50 border-amber-300'
                    : isEligible
                    ? 'bg-teal-50/50 border-teal-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 ${
                    patient.status === 'discharged'
                      ? 'bg-wardTeal-700 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  3
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    Discharge & Bed Clearance
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    {patient.status === 'discharged'
                      ? 'Discharge finalized. Patient cured and bed vacated.'
                      : patient.status === 'discharge_approved'
                      ? 'Doctor approved. Waiting on Admin to finalize clearance.'
                      : isEligible
                      ? 'Patient reached 3-day fever-free streak. Doctor can approve.'
                      : 'Streak in progress (requires 3 full days).'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Visit Notes History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Doctor Clinical Notes ({patient.visits.length})
            </h3>

            {patient.visits.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No doctor notes recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {[...patient.visits].reverse().map((v, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{v.byName}</span>
                      <span className="text-[10px] text-slate-400 font-normal tabular-nums">
                        {v.date} {v.time}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">"{v.note}"</p>
                    <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                      Decision: {v.decision}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Role Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600 hidden sm:block">
            Logged in as: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Nurse Action */}
            {currentUser.role === 'nurse' && (
              <button
                onClick={() => {
                  if (todayReading) {
                    setDuplicateReadingInfo(todayReading);
                  } else {
                    setIsRecordModalOpen(true);
                  }
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-wardTeal-700 hover:bg-wardTeal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Thermometer className="w-4 h-4" />
                <span>{todayReading ? 'Correct Today\'s Temp' : 'Record Temperature'}</span>
              </button>
            )}

            {/* Doctor Action */}
            {currentUser.role === 'doctor' && (
              <button
                onClick={() => setIsVisitPanelOpen(true)}
                disabled={!todayReading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
                  todayReading
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
                title={!todayReading ? 'Blocked: Awaiting Nurse temperature reading' : undefined}
              >
                <Stethoscope className="w-4 h-4" />
                <span>{todayReading ? (todayVisit ? 'Update Daily Visit' : 'Conduct Daily Visit') : 'Awaiting Temperature'}</span>
              </button>
            )}

            {/* Admin Action */}
            {currentUser.role === 'admin' && patient.status === 'discharge_approved' && (
              <button
                onClick={() => {
                  completeDischarge(patient.id);
                  navigate('/admin/discharges');
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-wardTeal-700 hover:bg-wardTeal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Bed className="w-4 h-4" />
                <span>Finalize Discharge & Free Bed</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Record Modal */}
      {isRecordModalOpen && (
        <RecordTemperatureModal
          patient={patient}
          isOpen={true}
          onClose={() => setIsRecordModalOpen(false)}
          onDuplicateDetected={existing => setDuplicateReadingInfo(existing)}
        />
      )}

      {/* Duplicate Dialog */}
      {duplicateReadingInfo && (
        <DuplicateReadingDialog
          patient={patient}
          existingReading={duplicateReadingInfo}
          isOpen={true}
          onClose={() => setDuplicateReadingInfo(null)}
          onProceedToCorrection={handleProceedCorrection}
        />
      )}

      {/* Doctor Review Panel */}
      {isVisitPanelOpen && (
        <PatientReviewPanel
          patient={patient}
          isOpen={true}
          onClose={() => setIsVisitPanelOpen(false)}
        />
      )}
    </div>
  );
};
