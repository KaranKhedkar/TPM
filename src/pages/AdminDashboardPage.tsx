import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getCenterMetrics, isCritical, isTemperatureOverdue } from '../lib/selectors';
import { MortalityGauge } from '../components/admin/MortalityGauge';
import { Badge } from '../components/common/Badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import {
  LayoutDashboard,
  Building,
  Bed,
  Thermometer,
  Stethoscope,
  Clock,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, closedCaseStats, currentDate } = useStore();

  const metrics = getCenterMetrics(patients, closedCaseStats, currentDate);

  // Identify needs attention items:
  // 1. Critical patients today
  // 2. Overdue temperatures
  // 3. Discharges approved waiting > 4 hours
  const criticalPatients = patients.filter(p => {
    const r = p.readings.find(x => x.date === currentDate);
    return p.status === 'admitted' && r && isCritical(r.value);
  });

  const overduePatients = patients.filter(
    p => p.status === 'admitted' && isTemperatureOverdue(p, currentDate)
  );

  const waitingDischarges = patients.filter(p => p.status === 'discharge_approved');

  // Chart data from 14-day history
  const chartData = closedCaseStats.history.map(h => ({
    date: h.date.slice(5), // 'MM-DD'
    compliance: h.tempsRecordedPct,
    discharges: h.discharges,
    deaths: h.deaths,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-purple-700" />
            Executive Facility Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time quarantine clinical monitoring, capacity, and benchmark oversight
          </p>
        </div>
      </div>

      {/* Top KPI Cards (Section 8 Screen 9) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Occupancy */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Occupancy Rate
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {metrics.occupancy}
            </span>
            <span className="text-xs text-slate-400">/ 74</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                metrics.occupancy >= 74 ? 'bg-red-600' : 'bg-purple-600'
              }`}
              style={{ width: `${metrics.occupancyPct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>{metrics.occupancyPct}% full</span>
            <span className="font-semibold text-emerald-600">{metrics.availableBeds} free</span>
          </div>
        </div>

        {/* Available Beds */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Beds Available
          </div>
          <div className="text-2xl font-black text-emerald-700 tabular-nums mt-1">
            {metrics.availableBeds}
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {metrics.availableBeds === 0 ? 'Full capacity' : 'Ready for admission'}
          </div>
        </div>

        {/* Temps Recorded Today % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Rounds Recorded
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
            {metrics.tempsRecordedPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {metrics.tempsRecorded} of {metrics.occupancy} patients
          </div>
        </div>

        {/* Doctor Visits Completed % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Visits Completed
          </div>
          <div className="text-2xl font-black text-blue-700 tabular-nums mt-1">
            {metrics.visitsCompletedPct}%
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            {metrics.visitsCompleted} visits done
          </div>
        </div>

        {/* Awaiting Discharge */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-wardTeal-800">
            Awaiting Discharge
          </div>
          <div className="text-2xl font-black text-wardTeal-900 tabular-nums mt-1">
            {metrics.awaitingDischarge}
          </div>
          <div className="text-[11px] text-wardTeal-700 mt-2">
            Approved by doctor
          </div>
        </div>

        {/* Average Length of Stay */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Avg Stay Length
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums mt-1">
            {metrics.avgLengthOfStay}
            <span className="text-xs font-semibold text-slate-400 ml-1">days</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Quarantine average
          </div>
        </div>
      </div>

      {/* Benchmark Metric Section */}
      <MortalityGauge stats={closedCaseStats} />

      {/* Charts & Needs Attention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 14-day Trend Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Temperature Compliance Trend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-wardTeal-700" />
                  14-Day Temperature Rounds Compliance Trend (%)
                </h3>
                <p className="text-xs text-slate-500">
                  Target is 100% daily temperature adherence
                </p>
              </div>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="compliance"
                    stroke="#0F766E"
                    strokeWidth={2.5}
                    dot={{ fill: '#0F766E', r: 3 }}
                    name="Compliance %"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Discharges & Outcomes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-blue-600" />
                  14-Day Discharges vs Deceased Cases
                </h3>
                <p className="text-xs text-slate-500">
                  Daily facility discharges (cured) compared with fatal outcomes
                </p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="discharges" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Cured Discharges" />
                  <Bar dataKey="deaths" fill="#EF4444" radius={[4, 4, 0, 0]} name="Deceased" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Needs Attention List */}
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between mb-3">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Needs Facility Attention
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold tabular-nums">
                {criticalPatients.length + overduePatients.length + waitingDischarges.length}
              </span>
            </h3>

            <div className="space-y-3">
              {/* Critical patients */}
              {criticalPatients.map(p => {
                const r = p.readings.find(x => x.date === currentDate);
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/patients/${p.id}`)}
                    className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs cursor-pointer hover:bg-red-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between font-bold text-red-900">
                      <span>Room {p.roomId} • {p.name}</span>
                      <span className="text-red-700 tabular-nums">{r?.value.toFixed(1)} °C</span>
                    </div>
                    <div className="text-[11px] text-red-700 mt-1">
                      Critical temperature threshold exceeded. Doctor emergency evaluation.
                    </div>
                  </div>
                );
              })}

              {/* Waiting Discharges */}
              {waitingDischarges.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate('/admin/discharges')}
                  className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs cursor-pointer hover:bg-teal-100/70 transition-colors"
                >
                  <div className="flex items-center justify-between font-bold text-teal-950">
                    <span>Room {p.roomId} • {p.name}</span>
                    <Badge variant="discharge_approved" label="Ready to Free Bed" size="sm" />
                  </div>
                  <div className="text-[11px] text-teal-800 mt-1">
                    Doctor approved discharge. Awaiting final Admin clearance.
                  </div>
                </div>
              ))}

              {/* Overdue temperatures */}
              {overduePatients.slice(0, 4).map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/patients/${p.id}`)}
                  className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs cursor-pointer hover:bg-amber-100/70 transition-colors"
                >
                  <div className="flex items-center justify-between font-bold text-amber-950">
                    <span>Room {p.roomId} • {p.name}</span>
                    <Badge variant="overdue" label="Overdue" size="sm" />
                  </div>
                  <div className="text-[11px] text-amber-800 mt-1">
                    Morning temperature pending past 14:00 deadline.
                  </div>
                </div>
              ))}

              {criticalPatients.length === 0 &&
                waitingDischarges.length === 0 &&
                overduePatients.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    All facility metrics are operating within normal operational parameters.
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
