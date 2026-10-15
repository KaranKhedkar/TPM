import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Staff, Role } from '../types';
import {
  ShieldAlert,
  Activity,
  Stethoscope,
  Shield,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Play,
  RotateCcw,
  Calendar,
} from 'lucide-react';

export const LoginWalkthroughPage: React.FC = () => {
  const navigate = useNavigate();
  const { staff, setCurrentUser, advanceDate, resetDemoData, currentDate } = useStore();

  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(true);

  const handleSelectStaff = (member: Staff) => {
    setCurrentUser(member);
    if (member.role === 'nurse') {
      navigate('/rounds');
    } else if (member.role === 'doctor') {
      navigate('/doctor/queue');
    } else {
      navigate('/admin/dashboard');
    }
  };

  const nurses = staff.filter(s => s.role === 'nurse' && s.active);
  const doctors = staff.filter(s => s.role === 'doctor' && s.active);
  const admins = staff.filter(s => s.role === 'admin' && s.active);

  const walkthroughSteps = [
    {
      step: '1',
      title: 'Nurse Records a Temperature',
      role: 'Nurse Priya Sharma',
      desc: 'Switch to Nurse role. Open Today\'s Rounds, tap "Record Temp" on room R-07 (pending), record 37.1 °C. The row immediately updates to Done and unlocks the doctor\'s visit queue.',
      targetRole: 'nurse',
      actionUrl: '/rounds',
    },
    {
      step: '2',
      title: 'Doctor Sees Visit Unlocked & Completes Visit',
      role: 'Dr. Siddharth Verma',
      desc: 'Switch to Doctor role. The patient now shows under "Ready for Visit" instead of "Waiting on nurse". Tap "Start Visit", enter notes, choose "Continue treatment", and save.',
      targetRole: 'doctor',
      actionUrl: '/doctor/queue',
    },
    {
      step: '3',
      title: 'Advance Simulated Date to Grow Streak',
      role: 'Any Role (Demo Controls)',
      desc: 'Click "Advance to Next Day" in the bottom-right Demo Controls panel. Watch pending rounds reset and fever-free streaks advance across all afebrile patients.',
      targetRole: null,
    },
    {
      step: '4',
      title: 'Doctor Approves Discharge for Eligible Patient',
      role: 'Dr. Siddharth Verma',
      desc: 'Patients with 3 fever-free days show a teal "Eligible for discharge" chip at the top of the queue. Open patient, select "Approve for Discharge", and complete visit. Patient transitions to discharge_approved.',
      targetRole: 'doctor',
      actionUrl: '/doctor/queue',
    },
    {
      step: '5',
      title: 'Admin Completes Discharge, Admits Patient & Checks Mortality',
      role: 'Admin Sunita Reddy',
      desc: 'Switch to Admin. Go to Discharge Queue, tap "Complete Discharge" to vacate the room (cured count increments). Go to Admissions to verify the room is vacant, admit a new patient, and inspect the Mortality vs Benchmark dashboard.',
      targetRole: 'admin',
      actionUrl: '/admin/dashboard',
    },
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-wardTeal-700 text-white shadow-md mb-1">
            <ShieldAlert className="w-8 h-8 text-teal-100" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            WardWatch
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Daily temperature-tracking and discharge-management application for a 74-bed virus quarantine and treatment facility.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200 tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-wardTeal-700" />
            <span>Simulated Baseline Date: {currentDate}</span>
          </div>
        </div>

        {/* Collapsible Demo Walkthrough Card */}
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setIsWalkthroughOpen(!isWalkthroughOpen)}
            className="w-full p-4 sm:p-5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-left hover:bg-teal-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="p-2 bg-wardTeal-700 text-white rounded-xl">
                <Sparkles className="w-5 h-5 text-teal-100" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-teal-950 flex items-center gap-2">
                  5-Step Reviewer Demo Walkthrough Script
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-200 text-teal-900">
                    Recommended
                  </span>
                </h3>
                <p className="text-xs text-teal-800">
                  Step-by-step verification script testing all business rules end-to-end
                </p>
              </div>
            </div>
            {isWalkthroughOpen ? (
              <ChevronUp className="w-5 h-5 text-wardTeal-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-wardTeal-700" />
            )}
          </button>

          {isWalkthroughOpen && (
            <div className="p-4 sm:p-5 space-y-3.5 divide-y divide-slate-100">
              {walkthroughSteps.map(item => (
                <div key={item.step} className="pt-3.5 first:pt-0 flex items-start gap-3.5 text-xs">
                  <div className="w-7 h-7 rounded-full bg-wardTeal-100 text-wardTeal-900 font-extrabold flex items-center justify-center flex-shrink-0 text-xs">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {item.role}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demo Accounts Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Select Demo Staff Profile (No Password Required)
            </h2>
            <p className="text-xs text-slate-500">
              Select any role to test role guards, permissions, and specialized workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nurse Column */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Nurses (Mobile-First)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Can record and correct temperatures. Mobile bottom nav with 48px touch targets.
              </p>
              <div className="space-y-2">
                {nurses.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleSelectStaff(n)}
                    className="w-full p-2.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all flex items-center justify-between shadow-2xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                        {n.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{n.email}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Doctor Column */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wide">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Doctors (Desktop Queue)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Conduct clinical visits, approve discharges (streak ≥ 3), and record deaths.
              </p>
              <div className="space-y-2">
                {doctors.map(d => (
                  <button
                    key={d.id}
                    onClick={() => handleSelectStaff(d)}
                    className="w-full p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex items-center justify-between shadow-2xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                        {d.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{d.email}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Column */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase tracking-wide">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Administrator (Operations)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Full facility dashboard, benchmark gauge, admit patients, and finalize discharges.
              </p>
              <div className="space-y-2">
                {admins.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleSelectStaff(a)}
                    className="w-full p-2.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all flex items-center justify-between shadow-2xs group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">
                        {a.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{a.email}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
