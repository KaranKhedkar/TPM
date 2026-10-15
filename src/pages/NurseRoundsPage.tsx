import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Patient, TemperatureReading } from '../types';
import {
  getTodayReading,
  isTemperatureOverdue,
  isFever,
  isCritical,
  calculateStreak,
} from '../lib/selectors';
import { Badge } from '../components/common/Badge';
import { RecordTemperatureModal } from '../components/nurse/RecordTemperatureModal';
import { DuplicateReadingDialog } from '../components/nurse/DuplicateReadingDialog';
import {
  Search,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Bed,
  Sparkles,
} from 'lucide-react';

export const NurseRoundsPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, currentDate, recordTemperature } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'fever' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'room' | 'urgent'>('room');
  const [isDischargeGroupOpen, setIsDischargeGroupOpen] = useState(false);

  // Modal states
  const [selectedPatientForRecord, setSelectedPatientForRecord] = useState<Patient | null>(null);
  const [duplicateReadingInfo, setDuplicateReadingInfo] = useState<{
    patient: Patient;
    existingReading: TemperatureReading;
  } | null>(null);

  // Group active admitted vs discharge approved
  const admittedPatients = useMemo(
    () => patients.filter(p => p.status === 'admitted'),
    [patients]
  );

  const dischargeApprovedPatients = useMemo(
    () => patients.filter(p => p.status === 'discharge_approved'),
    [patients]
  );

  // Compute round progress metrics
  const totalRounds = admittedPatients.length;
  const recordedCount = admittedPatients.filter(p => !!getTodayReading(p, currentDate)).length;
  const pendingCount = admittedPatients.filter(p => !getTodayReading(p, currentDate)).length;
  const overdueCount = admittedPatients.filter(p => isTemperatureOverdue(p, currentDate)).length;
  const feverCount = admittedPatients.filter(p => {
    const r = getTodayReading(p, currentDate);
    return r && isFever(r.value);
  }).length;
  const progressPct = totalRounds > 0 ? Math.round((recordedCount / totalRounds) * 100) : 0;

  // Filter and sort active patients
  const filteredPatients = useMemo(() => {
    return admittedPatients.filter(p => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRoom = p.roomId?.toLowerCase().includes(query);
        if (!matchesName && !matchesRoom) return false;
      }

      const todayReading = getTodayReading(p, currentDate);
      const isOverdue = isTemperatureOverdue(p, currentDate);

      switch (filter) {
        case 'pending':
          return !todayReading;
        case 'overdue':
          return !todayReading && isOverdue;
        case 'fever':
          return todayReading && isFever(todayReading.value);
        case 'done':
          return !!todayReading;
        case 'all':
        default:
          return true;
      }
    });
  }, [admittedPatients, searchQuery, filter, currentDate]);

  const sortedPatients = useMemo(() => {
    return [...filteredPatients].sort((a, b) => {
      if (sortBy === 'room') {
        const roomA = a.roomId || '';
        const roomB = b.roomId || '';
        return roomA.localeCompare(roomB, undefined, { numeric: true });
      }

      // Sort by urgency:
      // 1. Critical fever today
      // 2. Overdue pending
      // 3. Regular fever today
      // 4. Pending
      // 5. Done
      const score = (p: Patient) => {
        const r = getTodayReading(p, currentDate);
        if (r && isCritical(r.value)) return 5;
        if (!r && isTemperatureOverdue(p, currentDate)) return 4;
        if (r && isFever(r.value)) return 3;
        if (!r) return 2;
        return 1;
      };

      return score(b) - score(a);
    });
  }, [filteredPatients, sortBy, currentDate]);

  const handleOpenRecord = (patient: Patient) => {
    const existingReading = getTodayReading(patient, currentDate);
    if (existingReading) {
      setDuplicateReadingInfo({
        patient,
        existingReading,
      });
    } else {
      setSelectedPatientForRecord(patient);
    }
  };

  const handleProceedCorrection = (reason: string, initialTemp: number) => {
    if (duplicateReadingInfo) {
      recordTemperature(duplicateReadingInfo.patient.id, initialTemp, true, reason);
      setDuplicateReadingInfo(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 pb-24 sm:pb-12">
      {/* Progress Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-wardTeal-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4" />
              Nurse Shift • Daily Temperature Rounds
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Today's Rounds Progress
            </h1>
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {recordedCount}
            </span>
            <span className="text-slate-400 font-medium text-sm">/ {totalRounds}</span>
            <span className="ml-2 text-xs font-bold text-wardTeal-800 bg-wardTeal-100 px-2 py-0.5 rounded-full">
              {progressPct}% Done
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mb-3.5">
          <div
            className="bg-wardTeal-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Quick KPI stats row */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Pending</div>
            <div className="text-base sm:text-lg font-bold text-amber-600 tabular-nums">
              {pendingCount}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Overdue</div>
            <div className="text-base sm:text-lg font-bold text-red-600 tabular-nums">
              {overdueCount}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Fever</div>
            <div className="text-base sm:text-lg font-bold text-red-600 tabular-nums">
              {feverCount}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Completed</div>
            <div className="text-base sm:text-lg font-bold text-emerald-600 tabular-nums">
              {recordedCount}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search room (e.g. R-04) or patient name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-wardTeal-600"
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortBy(sortBy === 'room' ? 'urgent' : 'room')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs whitespace-nowrap min-h-[44px]"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-wardTeal-700" />
            <span className="hidden sm:inline">Sort:</span>
            <span>{sortBy === 'room' ? 'Room Order' : 'Most Urgent'}</span>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(
            [
              { id: 'all', label: `All (${admittedPatients.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'overdue', label: `Overdue (${overdueCount})` },
              { id: 'fever', label: `Fever (${feverCount})` },
              { id: 'done', label: `Done (${recordedCount})` },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap min-h-[36px] ${
                filter === f.id
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-2.5">
        {sortedPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No patients matching filter</p>
            <p className="text-xs">Try clearing your search query or choosing another filter chip.</p>
          </div>
        ) : (
          sortedPatients.map(patient => {
            const todayReading = getTodayReading(patient, currentDate);
            const isOverdue = isTemperatureOverdue(patient, currentDate);
            const streak = calculateStreak(patient, currentDate);

            // Determine badge variant
            let badgeVariant: any = 'pending';
            let badgeLabel = 'Pending';

            if (todayReading) {
              if (isCritical(todayReading.value)) {
                badgeVariant = 'critical';
                badgeLabel = `${todayReading.value.toFixed(1)} °C Critical`;
              } else if (isFever(todayReading.value)) {
                badgeVariant = 'fever';
                badgeLabel = `${todayReading.value.toFixed(1)} °C Fever`;
              } else {
                badgeVariant = 'normal';
                badgeLabel = `${todayReading.value.toFixed(1)} °C Normal`;
              }
            } else if (isOverdue) {
              badgeVariant = 'overdue';
              badgeLabel = 'Overdue (>14:00)';
            }

            const isDone = !!todayReading;

            return (
              <div
                key={patient.id}
                className={`bg-white rounded-2xl border p-3.5 sm:p-4 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-sm ${
                  isOverdue && !isDone
                    ? 'border-red-300 bg-red-50/20'
                    : todayReading && isCritical(todayReading.value)
                    ? 'border-red-400 bg-red-50/30'
                    : 'border-slate-200'
                }`}
              >
                {/* Left: Room & Details */}
                <div
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="flex items-center gap-3 cursor-pointer group flex-1"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
                      isDone
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : isOverdue
                        ? 'bg-red-100 text-red-900 border border-red-300 ring-2 ring-red-400/30'
                        : 'bg-slate-100 text-slate-800 border border-slate-200 group-hover:bg-wardTeal-50 group-hover:text-wardTeal-900'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                      Room
                    </span>
                    <span className="text-sm font-extrabold leading-none mt-0.5">
                      {patient.roomId?.replace('R-', '')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate group-hover:text-wardTeal-700 transition-colors">
                        {patient.name}
                      </h3>
                      <Badge variant={badgeVariant} label={badgeLabel} size="sm" />
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>
                        {patient.gender}, {patient.age}y
                      </span>
                      <span>•</span>
                      <span className="tabular-nums font-medium">
                        Streak: {streak}d
                      </span>
                      {todayReading && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">
                            Logged {todayReading.time}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[48px] flex items-center justify-center"
                  >
                    View Chart
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenRecord(patient)}
                    className={`min-h-[48px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] ${
                      isDone
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-wardTeal-700 hover:bg-wardTeal-800 text-white shadow-sm'
                    }`}
                  >
                    <Thermometer className="w-4 h-4" />
                    <span>{isDone ? 'Correct Reading' : 'Record Temp'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collapsed Group: Discharge Pending Patients */}
      {dischargeApprovedPatients.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setIsDischargeGroupOpen(!isDischargeGroupOpen)}
            className="w-full flex items-center justify-between p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl text-left hover:bg-teal-100/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-wardTeal-800" />
              <span className="text-xs font-bold text-wardTeal-950">
                Discharge Pending Group ({dischargeApprovedPatients.length} patients)
              </span>
              <span className="text-[11px] text-wardTeal-700">
                • Awaiting Admin bed clearance (no nurse rounds required)
              </span>
            </div>
            {isDischargeGroupOpen ? (
              <ChevronUp className="w-4 h-4 text-wardTeal-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-wardTeal-700" />
            )}
          </button>

          {isDischargeGroupOpen && (
            <div className="mt-2 space-y-2 animate-in fade-in duration-150">
              {dischargeApprovedPatients.map(patient => (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="bg-white/80 rounded-xl border border-teal-200 p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-white"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-wardTeal-900 bg-teal-100 px-2 py-0.5 rounded">
                      {patient.roomId}
                    </span>
                    <span className="font-semibold text-slate-800">{patient.name}</span>
                  </div>
                  <Badge variant="discharge_approved" label="Approved for Discharge" size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Record Temperature Modal */}
      {selectedPatientForRecord && (
        <RecordTemperatureModal
          patient={selectedPatientForRecord}
          isOpen={true}
          onClose={() => setSelectedPatientForRecord(null)}
          onDuplicateDetected={existing => {
            setDuplicateReadingInfo({
              patient: selectedPatientForRecord,
              existingReading: existing,
            });
          }}
        />
      )}

      {/* Duplicate Reading Dialog (Rule 4) */}
      {duplicateReadingInfo && (
        <DuplicateReadingDialog
          patient={duplicateReadingInfo.patient}
          existingReading={duplicateReadingInfo.existingReading}
          isOpen={true}
          onClose={() => setDuplicateReadingInfo(null)}
          onProceedToCorrection={handleProceedCorrection}
        />
      )}
    </div>
  );
};
