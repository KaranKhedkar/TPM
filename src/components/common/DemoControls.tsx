import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { runWardWatchSelfTests } from '../../lib/selftest';
import {
  Calendar,
  FastForward,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const DemoControls: React.FC = () => {
  const { currentDate, advanceDate, resetDemoData, currentUser } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; count: number } | null>(null);

  const handleRunTests = () => {
    const results = runWardWatchSelfTests();
    const passed = results.every(r => r.passed);
    setTestResults({ passed, count: results.length });
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-3 sm:right-4 z-40">
      {isOpen ? (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-4 w-72 sm:w-80 text-slate-800 transition-all animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-wardTeal-100 text-wardTeal-800 rounded-lg">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Demo Controls
                </h4>
                <p className="text-[11px] text-slate-500">Quarantine Simulation Engine</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Collapse demo panel"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Current Date Badge */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-wardTeal-700" />
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">
                  Simulated Date
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 tabular-nums">
                  {currentDate}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 tabular-nums">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Wall-clock linked</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={advanceDate}
              className="w-full flex items-center justify-center gap-2 bg-wardTeal-700 hover:bg-wardTeal-800 text-white font-medium text-xs sm:text-sm py-2.5 px-3 rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <FastForward className="w-4 h-4" />
              <span>Advance to Next Day (+1d)</span>
            </button>

            <button
              onClick={resetDemoData}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2 px-3 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data (74 rooms)</span>
            </button>
          </div>

          {/* Sanity test runner */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              onClick={handleRunTests}
              className="text-wardTeal-700 hover:text-wardTeal-800 font-medium flex items-center gap-1 underline underline-offset-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Run Rule Sanity Tests</span>
            </button>
            {testResults && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{testResults.count}/4 Passed</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold py-2 px-3 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-95 border border-slate-700 hover:border-slate-600"
          aria-label="Open demo controls"
        >
          <Sliders className="w-3.5 h-3.5 text-wardTeal-400" />
          <span>Demo Controls</span>
          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-wardTeal-300 tabular-nums">
            {currentDate}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
};
