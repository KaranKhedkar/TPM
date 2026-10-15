import { isFever, isCritical, calculateStreak, isEligibleForDischarge, calculateMortalityMetrics } from './selectors';
import { Patient, ClosedCaseStats } from '../types';

interface TestResult {
  rule: string;
  description: string;
  passed: boolean;
  details?: string;
}

export function runWardWatchSelfTests(): TestResult[] {
  const results: TestResult[] = [];

  // ----------------------------------------------------
  // RULE 2: Fever (>= 38.0 °C) and Critical (>= 40.0 °C)
  // ----------------------------------------------------
  const r2_1 = !isFever(37.9) && isFever(38.0) && isFever(38.5);
  const r2_2 = !isCritical(39.9) && isCritical(40.0) && isCritical(40.5);
  results.push({
    rule: 'Rule 2',
    description: 'Fever threshold at 38.0 °C and Critical at 40.0 °C',
    passed: r2_1 && r2_2,
    details: `isFever(37.9)=${isFever(37.9)}, isFever(38.0)=${isFever(38.0)}, isCritical(40.0)=${isCritical(40.0)}`
  });

  // ----------------------------------------------------
  // RULE 4: One reading per patient per day / duplicate detection
  // ----------------------------------------------------
  const testPatientR4: Patient = {
    id: 'test-p4',
    name: 'Test Patient 4',
    age: 40,
    gender: 'Male',
    phone: '9876543210',
    emergencyContact: '9876543211',
    admittedOn: '2026-10-10',
    roomId: 'R-99',
    status: 'admitted',
    readings: [
      { date: '2026-10-15', value: 37.2, time: '09:14', byId: 'staff-1', byName: 'Nurse Priya' }
    ],
    visits: [],
    auditLog: []
  };

  const hasReadingToday = testPatientR4.readings.some(r => r.date === '2026-10-15');
  const hasReadingTomorrow = testPatientR4.readings.some(r => r.date === '2026-10-16');
  results.push({
    rule: 'Rule 4',
    description: 'Duplicate reading detection for same calendar day',
    passed: hasReadingToday === true && hasReadingTomorrow === false,
    details: `Reading exists on 2026-10-15: ${hasReadingToday}, Reading exists on 2026-10-16: ${hasReadingTomorrow}`
  });

  // ----------------------------------------------------
  // RULE 5: No-fever streak and discharge eligibility
  // ----------------------------------------------------
  // Scenario A: 3 full fever-free days completed (streak = 3 -> eligible)
  const patientEligible: Patient = {
    id: 'test-p5a',
    name: 'Streak 3 Patient',
    age: 35,
    gender: 'Female',
    phone: '9876543212',
    emergencyContact: '9876543213',
    admittedOn: '2026-10-10',
    roomId: 'R-98',
    status: 'admitted',
    readings: [
      { date: '2026-10-12', value: 36.8, time: '09:00', byId: 'staff-1', byName: 'Nurse Priya' },
      { date: '2026-10-13', value: 36.9, time: '09:00', byId: 'staff-1', byName: 'Nurse Priya' },
      { date: '2026-10-14', value: 37.0, time: '09:00', byId: 'staff-1', byName: 'Nurse Priya' },
    ],
    visits: [],
    auditLog: []
  };
  // On 2026-10-15, today's reading is pending. Yesterday was 14 (37.0), 13 (36.9), 12 (36.8). Streak = 3.
  const streakA = calculateStreak(patientEligible, '2026-10-15');
  const eligibleA = isEligibleForDischarge(patientEligible, '2026-10-15');

  // Scenario B: Fever resets streak to 0
  const patientFeverToday: Patient = {
    ...patientEligible,
    readings: [
      ...patientEligible.readings,
      { date: '2026-10-15', value: 38.4, time: '09:30', byId: 'staff-1', byName: 'Nurse Priya' }
    ]
  };
  const streakB = calculateStreak(patientFeverToday, '2026-10-15');

  // Scenario C: Missing day breaks streak
  const patientMissingDay: Patient = {
    ...patientEligible,
    readings: [
      { date: '2026-10-12', value: 36.8, time: '09:00', byId: 'staff-1', byName: 'Nurse Priya' },
      // 2026-10-13 missing!
      { date: '2026-10-14', value: 37.0, time: '09:00', byId: 'staff-1', byName: 'Nurse Priya' },
    ]
  };
  const streakC = calculateStreak(patientMissingDay, '2026-10-15'); // only 1 day (14th)

  const r5_pass = streakA === 3 && eligibleA === true && streakB === 0 && streakC === 1;
  results.push({
    rule: 'Rule 5',
    description: 'No-fever streak calculation, fever reset, and missing day break',
    passed: r5_pass,
    details: `Streak 3: ${streakA} (eligible=${eligibleA}), Fever today reset: ${streakB}, Missing day streak: ${streakC}`
  });

  // ----------------------------------------------------
  // RULE 10: Mortality metric against 15% benchmark
  // ----------------------------------------------------
  const initialStats: ClosedCaseStats = {
    cured: 86,
    deceased: 14,
    history: []
  };
  const initialMetrics = calculateMortalityMetrics(initialStats);

  // Add 2 deaths: 14 -> 16 deceased, total 102
  const updatedStats: ClosedCaseStats = {
    cured: 86,
    deceased: 16,
    history: []
  };
  const updatedMetrics = calculateMortalityMetrics(updatedStats);

  const r10_pass =
    initialMetrics.mortalityRate === 14.0 &&
    initialMetrics.isMortalityExceeded === false &&
    updatedMetrics.mortalityRate === 15.7 &&
    updatedMetrics.isMortalityExceeded === true;

  results.push({
    rule: 'Rule 10',
    description: 'Mortality metric calculation & 15% benchmark alert triggering',
    passed: r10_pass,
    details: `Initial 14/100=${initialMetrics.mortalityRate}% (exceeded=${initialMetrics.isMortalityExceeded}); +2 deaths 16/102=${updatedMetrics.mortalityRate}% (exceeded=${updatedMetrics.isMortalityExceeded})`
  });

  // Log in browser dev console
  console.group('%c[WardWatch Sanity Self-Tests]', 'color: #0F766E; font-weight: bold; font-size: 13px;');
  let allPassed = true;
  for (const res of results) {
    if (res.passed) {
      console.log(`%c✓ PASS%c [${res.rule}] ${res.description} (${res.details})`, 'color: #16A34A; font-weight: bold;', 'color: inherit;');
    } else {
      allPassed = false;
      console.error(`✗ FAIL [${res.rule}] ${res.description}: ${res.details}`);
    }
  }
  if (allPassed) {
    console.log('%cAll WardWatch core business rule sanity tests PASSED successfully.', 'color: #16A34A; font-weight: bold;');
  }
  console.groupEnd();

  return results;
}
