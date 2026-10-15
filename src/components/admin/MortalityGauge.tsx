import React from 'react';
import { ClosedCaseStats } from '../../types';
import { calculateMortalityMetrics } from '../../lib/selectors';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  HeartPulse,
  UserCheck,
  UserX,
} from 'lucide-react';

interface MortalityGaugeProps {
  stats: ClosedCaseStats;
}

export const MortalityGauge: React.FC<MortalityGaugeProps> = ({ stats }) => {
  const metrics = calculateMortalityMetrics(stats);

  const markerPosition = 15; // 15% benchmark marker
  const currentRate = Math.min(100, Math.max(0, metrics.mortalityRate));

  return (
    <div className="space-y-3">
      {/* Red Alert Banner if exceeded */}
      {metrics.isMortalityExceeded && (
        <div className="p-4 bg-red-100 border-2 border-red-500 rounded-2xl text-red-950 flex items-start gap-3 animate-pulse">
          <div className="p-2 bg-red-600 text-white rounded-xl flex-shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-red-900 uppercase tracking-wide">
              Critical Warning: Benchmark Threshold Exceeded
            </h4>
            <p className="text-xs text-red-800 mt-1 font-medium leading-relaxed">
              Mortality rate <strong>{metrics.mortalityRate}%</strong> exceeds the facility maximum target benchmark of <strong>15.0%</strong> ({metrics.deceased} deaths across {metrics.totalClosed} closed cases). Immediate clinical review triggered.
            </p>
          </div>
        </div>
      )}

      {/* Main Metric Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          metrics.isMortalityExceeded
            ? 'bg-red-50/60 border-red-300 shadow-sm'
            : 'bg-white border-slate-200 shadow-2xs'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HeartPulse
                className={`w-4 h-4 ${
                  metrics.isMortalityExceeded ? 'text-red-600' : 'text-emerald-600'
                }`}
              />
              <span>Quarantine Clinical Outcome Benchmark</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">
              Mortality Rate vs 15% Benchmark
            </h3>
          </div>
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              metrics.isMortalityExceeded
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            {metrics.isMortalityExceeded ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Exceeds Target</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Within Benchmark</span>
              </>
            )}
          </div>
        </div>

        {/* Big Percentage Display */}
        <div className="flex items-baseline gap-4 mt-4">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-4xl sm:text-5xl font-black tabular-nums tracking-tight ${
                metrics.isMortalityExceeded ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {metrics.mortalityRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">mortality</span>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tabular-nums">
              {metrics.cureRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">cure rate (target 85%)</span>
          </div>
        </div>

        {/* Visual Benchmark Gauge / Bar */}
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
            <span>0% Ideal</span>
            <span className="text-amber-700 font-bold">15% Max Benchmark</span>
            <span>30% Extreme</span>
          </div>

          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5">
            {/* Color spectrum underlay: Green up to 15%, Red beyond */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.isMortalityExceeded ? 'bg-red-600' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, (currentRate / 30) * 100)}%` }}
            />

            {/* 15% marker line (at 50% of 30% scale) */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-slate-900 z-10 -ml-0.5"
              style={{ left: '50%' }}
              title="15.0% Benchmark Threshold"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Scaled to 30% facility envelope</span>
            <span className="font-semibold text-slate-700">
              Current: {metrics.deceased} deceased / {metrics.totalClosed} closed cases
            </span>
          </div>
        </div>

        {/* Counts Breakdown Strip */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Cured Cases</span>
            </div>
            <div className="text-xl font-black text-emerald-900 tabular-nums mt-0.5">
              {metrics.cured}
            </div>
            <div className="text-[10px] text-emerald-700">{metrics.cureRate}% of closed</div>
          </div>

          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-800 flex items-center justify-center gap-1">
              <UserX className="w-3.5 h-3.5" />
              <span>Deceased</span>
            </div>
            <div className="text-xl font-black text-red-900 tabular-nums mt-0.5">
              {metrics.deceased}
            </div>
            <div className="text-[10px] text-red-700">{metrics.mortalityRate}% of closed</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Closed Cases
            </div>
            <div className="text-xl font-black text-slate-800 tabular-nums mt-0.5">
              {metrics.totalClosed}
            </div>
            <div className="text-[10px] text-slate-500">100% evaluated</div>
          </div>
        </div>
      </div>
    </div>
  );
};
