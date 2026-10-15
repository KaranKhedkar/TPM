import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  getTodayReading,
  getTodayVisit,
  calculateStreak,
  isEligibleForDischarge,
} from '../lib/selectors';
import { Badge } from '../components/common/Badge';
import { PatientReviewPanel } from '../components/doctor/PatientReviewPanel';
import { Patient } from '../types';
import {
  Users,
  Search,
  Filter,
  Stethoscope,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const DoctorPatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, currentDate } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'admitted' | 'discharge_approved' | 'closed'>('all');
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = search.toLowerCase().trim();
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchRoom = p.roomId?.toLowerCase().includes(q);
        if (!matchName && !matchRoom) return false;
      }

      if (statusFilter === 'admitted') return p.status === 'admitted';
      if (statusFilter === 'discharge_approved') return p.status === 'discharge_approved';
      if (statusFilter === 'closed') return p.status === 'discharged' || p.status === 'deceased';
      return true;
    });
  }, [patients, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            All Quarantine Patients
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Complete census and clinical tracking overview
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, room..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {(
            [
              { id: 'all', label: 'All Patients' },
              { id: 'admitted', label: 'Admitted' },
              { id: 'discharge_approved', label: 'Approved Discharge' },
              { id: 'closed', label: 'Closed Cases' },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Admitted On</th>
                <th className="py-3 px-4">Today's Temp</th>
                <th className="py-3 px-4">Afebrile Streak</th>
                <th className="py-3 px-4">Doctor Visit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No patients matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  const todayReading = getTodayReading(patient, currentDate);
                  const todayVisit = getTodayVisit(patient, currentDate);
                  const streak = calculateStreak(patient, currentDate);
                  const isEligible = isEligibleForDischarge(patient, currentDate);

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {patient.roomId || <span className="text-slate-400 italic">None</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {patient.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {patient.gender}, {patient.age}y
                        </div>
                      </td>
                      <td className="py-3 px-4 tabular-nums">{patient.admittedOn}</td>
                      <td className="py-3 px-4">
                        {todayReading ? (
                          <span
                            className={`font-semibold tabular-nums ${
                              todayReading.value >= 38.0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {todayReading.value.toFixed(1)} °C
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold tabular-nums text-slate-800">
                          {streak} / 3 days
                        </span>
                        {isEligible && (
                          <span className="ml-1 text-[10px] font-bold text-wardTeal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                            Eligible
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {todayVisit ? (
                          <span className="text-emerald-700 font-medium">Done ({todayVisit.time})</span>
                        ) : todayReading ? (
                          <span className="text-blue-600 font-medium">Ready</span>
                        ) : (
                          <span className="text-slate-400">Awaiting temp</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {patient.status === 'discharge_approved' ? (
                          <Badge variant="discharge_approved" label="Discharge Pending" size="sm" />
                        ) : patient.status === 'discharged' ? (
                          <Badge variant="discharged" label="Cured" size="sm" />
                        ) : patient.status === 'deceased' ? (
                          <Badge variant="deceased" label="Deceased" size="sm" />
                        ) : isEligible ? (
                          <Badge variant="discharge_eligible" label="Eligible" size="sm" />
                        ) : (
                          <Badge variant="normal" label="Admitted" size="sm" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-medium"
                          >
                            View
                          </button>
                          {patient.status === 'admitted' && (
                            <button
                              onClick={() => setSelectedPatientForVisit(patient)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold flex items-center gap-1"
                            >
                              <Stethoscope className="w-3 h-3" />
                              <span>Visit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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
