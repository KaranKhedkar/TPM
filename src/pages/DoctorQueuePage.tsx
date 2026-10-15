import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Patient } from '../types';
import {
  getTodayReading,
  getTodayVisit,
  calculateStreak,
  isEligibleForDischarge,
  isFever,
  isCritical,
} from '../lib/selectors';
import { Badge } from '../components/common/Badge';
import { PatientReviewPanel } from '../components/doctor/PatientReviewPanel';
import {
  Stethoscope,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const DoctorQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, currentDate } = useStore();

  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);

  // Filter admitted patients
  const admittedPatients = useMemo(
    () => patients.filter(p => p.status === 'admitted'),
    [patients]
  );

  // Groupings per Rule 6 & Screen 6:
  // (a) Eligible for discharge (streak >= 3)
  // (b) Fever / critical today (temp >= 38.0)
  // (c) Ready for visit (temp recorded < 38, streak < 3, not yet visited)
  // (d) Waiting on nurse (no temp recorded today)

  const { eligibleGroup, feverGroup, readyGroup, waitingGroup, visitedTodayCount } = useMemo(() => {
    const eligible: Patient[] = [];
    const fever: Patient[] = [];
    const ready: Patient[] = [];
    const waiting: Patient[] = [];
    let visitedCount = 0;

    admittedPatients.forEach(p => {
      const todayReading = getTodayReading(p, currentDate);
      const todayVisit = getTodayVisit(p, currentDate);

      if (todayVisit) {
        visitedCount++;
      }

      if (!todayReading) {
        waiting.push(p);
      } else if (isEligibleForDischarge(p, currentDate)) {
        eligible.push(p);
      } else if (isFever(todayReading.value)) {
        fever.push(p);
      } else {
        ready.push(p);
      }
    });

    return {
      eligibleGroup: eligible,
      feverGroup: fever,
      readyGroup: ready,
      waitingGroup: waiting,
      visitedTodayCount: visitedCount,
    };
  }, [admittedPatients, currentDate]);

  const criticalCount = admittedPatients.filter(p => {
    const r = getTodayReading(p, currentDate);
    return r && isCritical(r.value);
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Doctor Visit Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Prioritized clinical rounding queue for quarantine patients
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Visited Today
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {visitedTodayCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ {admittedPatients.length}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Daily clinical visits</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-wardTeal-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-wardTeal-600" />
            <span>Eligible for Discharge</span>
          </div>
          <div className="text-2xl font-black text-wardTeal-900 tabular-nums mt-1">
            {eligibleGroup.length}
          </div>
          <div className="text-[11px] text-wardTeal-700 mt-1">Afebrile for 3+ consecutive days</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-red-200 bg-red-50/20 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>Fever / Critical Today</span>
          </div>
          <div className="text-2xl font-black text-red-800 tabular-nums mt-1">
            {feverGroup.length}
          </div>
          <div className="text-[11px] text-red-600 mt-1">
            {criticalCount > 0 ? `${criticalCount} critical (≥40°C)` : 'Active fever monitoring'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Awaiting Temperature</span>
          </div>
          <div className="text-2xl font-black text-amber-600 tabular-nums mt-1">
            {waitingGroup.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Waiting on nurse rounds</div>
        </div>
      </div>

      {/* Prioritized Queue Groups */}
      <div className="space-y-6">
        {/* GROUP A: Eligible for Discharge */}
        <div className="bg-white rounded-2xl border border-teal-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-teal-50/80 border-b border-teal-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-600 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-teal-950">
                  Priority 1: Eligible for Discharge ({eligibleGroup.length})
                </h3>
                <p className="text-[11px] text-teal-800">
                  Patient afebrile for ≥ 3 consecutive days. Awaiting doctor's discharge approval.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full border border-teal-300">
              Discharge Candidate
            </span>
          </div>

          {eligibleGroup.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No patients currently eligible for discharge.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {eligibleGroup.map(patient => {
                const r = getTodayReading(patient, currentDate);
                const streak = calculateStreak(patient, currentDate);
                const hasVisit = !!getTodayVisit(patient, currentDate);

                return (
                  <div
                    key={patient.id}
                    className="p-4 hover:bg-teal-50/30 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-sm">
                        {patient.roomId}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="font-bold text-slate-900 hover:text-wardTeal-700 cursor-pointer"
                          >
                            {patient.name}
                          </span>
                          <Badge variant="discharge_eligible" label="Eligible (3/3 days)" size="sm" />
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{patient.gender}, {patient.age}y</span>
                          <span>•</span>
                          <span className="tabular-nums font-semibold text-emerald-700">
                            Today: {r ? `${r.value.toFixed(1)} °C (${r.time})` : 'Pending'}
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">Streak: {streak} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Chart
                      </button>
                      <button
                        onClick={() => setSelectedPatientForVisit(patient)}
                        className="px-4 py-2 bg-wardTeal-700 hover:bg-wardTeal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{hasVisit ? 'Review / Approve' : 'Approve Discharge'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GROUP B: Fever / Critical Today */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-red-50/70 border-b border-red-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-600 text-white rounded-lg">
                <Flame className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  Priority 2: Fever & Critical Today ({feverGroup.length})
                </h3>
                <p className="text-[11px] text-red-800">
                  Patients with active fever (≥38.0 °C) requiring clinical evaluation & antipyretics
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-red-800 bg-red-100 px-2.5 py-1 rounded-full border border-red-300">
              Needs Attention
            </span>
          </div>

          {feverGroup.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No patients with active fever today.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feverGroup.map(patient => {
                const r = getTodayReading(patient, currentDate);
                const hasVisit = !!getTodayVisit(patient, currentDate);

                return (
                  <div
                    key={patient.id}
                    className="p-4 hover:bg-red-50/20 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-red-100 text-red-900 flex items-center justify-center font-bold text-sm">
                        {patient.roomId}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="font-bold text-slate-900 hover:text-red-700 cursor-pointer"
                          >
                            {patient.name}
                          </span>
                          {r && isCritical(r.value) ? (
                            <Badge variant="critical" label={`${r.value.toFixed(1)} °C Critical`} size="sm" />
                          ) : (
                            <Badge variant="fever" label={`${r?.value.toFixed(1)} °C Fever`} size="sm" />
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{patient.gender}, {patient.age}y</span>
                          <span>•</span>
                          <span className="text-red-700 font-bold tabular-nums">
                            Logged at {r?.time} by {r?.byName}
                          </span>
                          {hasVisit && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-medium">Visited Today</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Chart
                      </button>
                      <button
                        onClick={() => setSelectedPatientForVisit(patient)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{hasVisit ? 'Update Visit' : 'Evaluate Patient'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GROUP C: Ready for Visit */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-600 text-white rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ready for Daily Visit ({readyGroup.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Temperature recorded by nurse today; ready for doctor's routine rounds
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Vitals Recorded
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {readyGroup.map(patient => {
              const r = getTodayReading(patient, currentDate);
              const streak = calculateStreak(patient, currentDate);
              const hasVisit = !!getTodayVisit(patient, currentDate);

              return (
                <div
                  key={patient.id}
                  className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
                      {patient.roomId}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="font-bold text-slate-900 hover:underline cursor-pointer"
                        >
                          {patient.name}
                        </span>
                        <Badge variant="normal" label={`${r?.value.toFixed(1)} °C`} size="sm" />
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Streak: {streak}d</span>
                        <span>•</span>
                        <span>Logged {r?.time}</span>
                        {hasVisit && (
                          <span className="text-emerald-700 font-semibold">• Visited</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPatientForVisit(patient)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{hasVisit ? 'Edit Visit' : 'Start Visit'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GROUP D: Waiting on Nurse (Rule 6) */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden opacity-85">
          <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-400 text-white rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-700">
                  Waiting on Nurse ({waitingGroup.length})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Doctor visit locked until nurse completes today's temperature reading
                </p>
              </div>
            </div>
            <Badge variant="doctor" label="Awaiting temperature" size="sm" />
          </div>

          <div className="divide-y divide-slate-200/60 max-h-64 overflow-y-auto">
            {waitingGroup.map(patient => (
              <div
                key={patient.id}
                className="p-3 flex items-center justify-between gap-4 text-xs text-slate-500"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-600 bg-slate-200 px-2 py-1 rounded">
                    {patient.roomId}
                  </span>
                  <span
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="font-medium text-slate-700 hover:underline cursor-pointer"
                  >
                    {patient.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="px-3 py-1.5 bg-slate-200 text-slate-400 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                    title="Disabled per Rule 6: Requires nurse reading first"
                  >
                    <span>Awaiting temperature</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedPatientForVisit && (
        <PatientReviewPanel
          patient={selectedPatientForVisit}
          isOpen={true}
          onClose={() => setSelectedPatientForVisit(null)}
        />
      )}
    </div>
  );
};
