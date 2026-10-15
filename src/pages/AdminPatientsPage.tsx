import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Badge } from '../components/common/Badge';
import { getLengthOfStay } from '../lib/selectors';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  UserX,
  Bed,
  ExternalLink,
} from 'lucide-react';

export const AdminPatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, currentDate } = useStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admitted' | 'discharge_approved' | 'cured' | 'deceased'>('all');

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const q = search.toLowerCase().trim();
      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchRoom = p.roomId?.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        if (!matchName && !matchRoom && !matchId) return false;
      }

      if (filter === 'admitted') return p.status === 'admitted';
      if (filter === 'discharge_approved') return p.status === 'discharge_approved';
      if (filter === 'cured') return p.status === 'discharged';
      if (filter === 'deceased') return p.status === 'deceased';
      return true;
    });
  }, [patients, search, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-700" />
            Complete Facility Patient Census
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active admissions, in-progress clearances, and closed case history
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, room ID (e.g. R-12)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs">
          {(
            [
              { id: 'all', label: `All (${patients.length})` },
              { id: 'admitted', label: 'Active Admitted' },
              { id: 'discharge_approved', label: 'Approved' },
              { id: 'cured', label: 'Cured & Discharged' },
              { id: 'deceased', label: 'Deceased' },
            ] as const
          ).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-purple-700 text-white font-semibold'
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
                <th className="py-3.5 px-4">Room</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Admitted On</th>
                <th className="py-3.5 px-4">Length of Stay</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Outcome / Status</th>
                <th className="py-3.5 px-4 text-right">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No patients found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(patient => {
                  const stayLength = getLengthOfStay(patient, currentDate);

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {patient.roomId ? (
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded">
                            {patient.roomId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None (Closed)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="font-bold text-slate-900 hover:text-purple-700 cursor-pointer text-sm"
                        >
                          {patient.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {patient.gender}, {patient.age}y
                        </div>
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">{patient.admittedOn}</td>
                      <td className="py-3.5 px-4 tabular-nums font-medium text-slate-700">
                        {stayLength} days
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {patient.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        {patient.status === 'discharge_approved' ? (
                          <Badge variant="discharge_approved" label="Discharge Pending" size="sm" />
                        ) : patient.status === 'discharged' ? (
                          <Badge variant="discharged" label="Cured & Closed" size="sm" />
                        ) : patient.status === 'deceased' ? (
                          <Badge variant="deceased" label="Deceased" size="sm" />
                        ) : (
                          <Badge variant="normal" label="Admitted" size="sm" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => navigate(`/patients/${patient.id}`)}
                          className="px-3 py-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
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
    </div>
  );
};
