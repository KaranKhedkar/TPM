import { Patient, TemperatureReading, DoctorVisit, ClosedCaseStats } from '../types';

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add or subtract days from a YYYY-MM-DD string
 */
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Get difference in days between two YYYY-MM-DD strings (date2 - date1)
 */
export function daysBetween(date1: string, date2: string): number {
  const p1 = date1.split('-').map(Number);
  const p2 = date2.split('-').map(Number);
  const d1 = new Date(p1[0], p1[1] - 1, p1[2]);
  const d2 = new Date(p2[0], p2[1] - 1, p2[2]);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Rule 2: Fever check
 * Fever is >= 38.0 °C. Critical is >= 40.0 °C.
 */
export function isFever(temp: number): boolean {
  return temp >= 38.0;
}

export function isCritical(temp: number): boolean {
  return temp >= 40.0;
}

/**
 * Get the effective reading for a specific date (takes the latest reading for that date)
 */
export function getReadingForDate(patient: Patient, dateStr: string): TemperatureReading | undefined {
  const matching = patient.readings.filter(r => r.date === dateStr);
  if (matching.length === 0) return undefined;
  return matching[matching.length - 1]; // latest reading
}

/**
 * Get today's reading for patient
 */
export function getTodayReading(patient: Patient, currentDate: string): TemperatureReading | undefined {
  return getReadingForDate(patient, currentDate);
}

/**
 * Get today's doctor visit for patient
 */
export function getTodayVisit(patient: Patient, currentDate: string): DoctorVisit | undefined {
  const matching = patient.visits.filter(v => v.date === currentDate);
  if (matching.length === 0) return undefined;
  return matching[matching.length - 1];
}

/**
 * Rule 5: No-fever streak calculation
 * = Number of consecutive completed days (counting backward from yesterday,
 * then including today if today's reading exists) each with a reading below 38.0 °C.
 * - A fever reading resets the streak to 0.
 * - A day with no reading breaks the streak.
 * - Today's pending reading does not break the streak but does not add to it.
 * - Eligible for discharge when the streak >= 3.
 */
export function calculateStreak(patient: Patient, currentDate: string): number {
  const todayReading = getTodayReading(patient, currentDate);

  let streak = 0;

  // Check today first
  if (todayReading) {
    if (isFever(todayReading.value)) {
      // Fever today immediately resets streak to 0
      return 0;
    } else {
      // Valid fever-free reading today counts as 1
      streak += 1;
    }
  }

  // Count backwards from yesterday (currentDate - 1 day)
  let dayOffset = -1;
  const admittedDate = patient.admittedOn;

  while (true) {
    const checkDate = addDays(currentDate, dayOffset);
    // Don't check before patient admission
    if (checkDate < admittedDate) {
      break;
    }

    const reading = getReadingForDate(patient, checkDate);
    if (!reading) {
      // Missing day breaks the streak
      break;
    }

    if (isFever(reading.value)) {
      // Fever resets the streak preceding it
      break;
    }

    // Fever-free day
    streak += 1;
    dayOffset -= 1;
  }

  return streak;
}

/**
 * Rule 5: Eligible for discharge when streak >= 3 and patient is admitted
 */
export function isEligibleForDischarge(patient: Patient, currentDate: string): boolean {
  if (patient.status !== 'admitted') return false;
  return calculateStreak(patient, currentDate) >= 3;
}

/**
 * Rule 11: Overdue temperature check
 * A patient whose temperature is still pending after 14:00 real wall-clock time
 * is shown as "Overdue" (red outline) instead of "Pending" (amber).
 */
export function isTemperatureOverdue(
  patient: Patient,
  currentDate: string,
  wallClockTime?: Date
): boolean {
  if (patient.status !== 'admitted') return false;
  const hasReading = !!getTodayReading(patient, currentDate);
  if (hasReading) return false;

  const now = wallClockTime || new Date();
  const currentHour = now.getHours();
  // Overdue if 14:00 (2 PM) or later
  return currentHour >= 14;
}

/**
 * Rule 6: Doctor visit rules
 * A visit can be marked complete ONLY IF today's temperature is recorded.
 */
export function canDoctorVisit(patient: Patient, currentDate: string): boolean {
  if (patient.status !== 'admitted') return false;
  const hasReading = !!getTodayReading(patient, currentDate);
  const hasVisit = !!getTodayVisit(patient, currentDate);
  return hasReading && !hasVisit;
}

/**
 * Status determination for patient today
 */
export type TodayPatientTaskState =
  | 'discharge_pending'
  | 'critical'
  | 'fever'
  | 'eligible'
  | 'waiting_on_nurse'
  | 'ready_for_doctor'
  | 'done_for_day'
  | 'overdue'
  | 'pending';

export function getTodayPatientTaskState(
  patient: Patient,
  currentDate: string,
  wallClockTime?: Date
): TodayPatientTaskState {
  if (patient.status === 'discharge_approved') {
    return 'discharge_pending';
  }

  const todayReading = getTodayReading(patient, currentDate);
  const todayVisit = getTodayVisit(patient, currentDate);
  const eligible = isEligibleForDischarge(patient, currentDate);

  if (todayReading) {
    if (isCritical(todayReading.value)) {
      return 'critical';
    }
    if (isFever(todayReading.value)) {
      return 'fever';
    }
    if (eligible) {
      return 'eligible';
    }
    if (todayVisit) {
      return 'done_for_day';
    }
    return 'ready_for_doctor';
  }

  // No temperature reading yet
  if (isTemperatureOverdue(patient, currentDate, wallClockTime)) {
    return 'overdue';
  }
  return 'pending';
}

/**
 * Rule 10: Mortality & Cure rate metrics
 * deceased / (cured + deceased) over all closed cases against 15% benchmark
 */
export function calculateMortalityMetrics(stats: ClosedCaseStats) {
  const totalClosed = stats.cured + stats.deceased;
  const mortalityRate = totalClosed > 0 ? (stats.deceased / totalClosed) * 100 : 0;
  const cureRate = totalClosed > 0 ? (stats.cured / totalClosed) * 100 : 0;
  const isMortalityExceeded = mortalityRate > 15.0;

  return {
    totalClosed,
    cured: stats.cured,
    deceased: stats.deceased,
    mortalityRate: Number(mortalityRate.toFixed(1)),
    cureRate: Number(cureRate.toFixed(1)),
    isMortalityExceeded,
    benchmarkMortality: 15.0,
    benchmarkCure: 85.0,
  };
}

/**
 * Calculate length of stay for a patient
 */
export function getLengthOfStay(patient: Patient, currentDate: string): number {
  const endDate = patient.closedOn || currentDate;
  return Math.max(1, daysBetween(patient.admittedOn, endDate) + 1);
}

/**
 * Get center-wide daily metrics
 */
export function getCenterMetrics(
  patients: Patient[],
  closedStats: ClosedCaseStats,
  currentDate: string,
  wallClockTime?: Date
) {
  const activePatients = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_approved');
  const occupancy = activePatients.length;
  const totalBeds = 74;
  const availableBeds = Math.max(0, totalBeds - occupancy);

  // Temperature compliance
  const admittedPatients = patients.filter(p => p.status === 'admitted');
  const tempsRecorded = admittedPatients.filter(p => !!getTodayReading(p, currentDate)).length;
  const tempsPending = admittedPatients.filter(p => !getTodayReading(p, currentDate)).length;
  const tempsOverdue = admittedPatients.filter(p => isTemperatureOverdue(p, currentDate, wallClockTime)).length;

  // Fevers today
  const feversToday = admittedPatients.filter(p => {
    const r = getTodayReading(p, currentDate);
    return r && isFever(r.value);
  }).length;

  const criticalToday = admittedPatients.filter(p => {
    const r = getTodayReading(p, currentDate);
    return r && isCritical(r.value);
  }).length;

  // Doctor visits
  const visitsCompleted = admittedPatients.filter(p => !!getTodayVisit(p, currentDate)).length;

  // Discharges
  const awaitingDischarge = patients.filter(p => p.status === 'discharge_approved').length;
  const eligibleForDischargeCount = admittedPatients.filter(p => isEligibleForDischarge(p, currentDate)).length;

  // Average length of stay
  const totalStayDays = activePatients.reduce((sum, p) => sum + getLengthOfStay(p, currentDate), 0);
  const avgLengthOfStay = activePatients.length > 0 ? (totalStayDays / activePatients.length).toFixed(1) : '0';

  const tempsRecordedPct = admittedPatients.length > 0
    ? Math.round((tempsRecorded / admittedPatients.length) * 100)
    : 0;

  const visitsCompletedPct = admittedPatients.length > 0
    ? Math.round((visitsCompleted / admittedPatients.length) * 100)
    : 0;

  const mortality = calculateMortalityMetrics(closedStats);

  return {
    occupancy,
    totalBeds,
    availableBeds,
    occupancyPct: Math.round((occupancy / totalBeds) * 100),
    tempsRecorded,
    tempsPending,
    tempsOverdue,
    feversToday,
    criticalToday,
    tempsRecordedPct,
    visitsCompleted,
    visitsCompletedPct,
    awaitingDischarge,
    eligibleForDischargeCount,
    avgLengthOfStay,
    mortality,
  };
}
