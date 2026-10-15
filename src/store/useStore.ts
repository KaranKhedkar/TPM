import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Staff,
  Patient,
  ClosedCaseStats,
  Role,
  ToastMessage,
  AlertItem,
  TemperatureReading,
  DoctorVisit,
  AuditLogEntry,
} from '../types';
import {
  INITIAL_DEMO_DATE,
  INITIAL_STAFF,
  generateSeedPatients,
  generateSeedClosedStats,
} from '../data/seed';
import {
  addDays,
  isFever,
  isCritical,
  getTodayReading,
  calculateStreak,
  isEligibleForDischarge,
  isTemperatureOverdue,
  calculateMortalityMetrics,
} from '../lib/selectors';
import { runWardWatchSelfTests } from '../lib/selftest';

export function getWallClockTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getCurrentIsoTimestamp(currentDate: string): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${currentDate}T${hours}:${minutes}:${seconds}`;
}

interface WardWatchState {
  currentDate: string;
  currentUser: Staff;
  staff: Staff[];
  patients: Patient[];
  closedCaseStats: ClosedCaseStats;
  toasts: ToastMessage[];

  // Actions
  setCurrentUser: (user: Staff) => void;
  switchRole: (role: Role) => void;
  advanceDate: () => void;
  resetDemoData: () => void;

  // Temperature
  recordTemperature: (
    patientId: string,
    value: number,
    isCorrection?: boolean,
    reason?: string
  ) => { success: boolean; error?: string; isDuplicate?: boolean; existingReading?: TemperatureReading };

  // Doctor
  completeDoctorVisit: (
    patientId: string,
    note: string,
    decision: 'continue' | 'discharge' | 'death',
    causeOfDeath?: string
  ) => { success: boolean; error?: string };

  // Admin
  completeDischarge: (patientId: string) => { success: boolean; error?: string };
  admitPatient: (data: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    emergencyContact: string;
    roomId: string;
    initialSymptoms?: string;
  }) => { success: boolean; error?: string };

  // Staff management
  addStaff: (data: { name: string; email: string; role: Role }) => { success: boolean; error?: string };
  toggleStaffStatus: (staffId: string) => { success: boolean; error?: string };

  // UI helpers
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Derived selectors
  getAlertsForRole: (role: Role) => AlertItem[];
}

export const useStore = create<WardWatchState>()(
  persist(
    (set, get) => ({
      currentDate: INITIAL_DEMO_DATE,
      currentUser: INITIAL_STAFF[0], // Default: Nurse Priya Sharma
      staff: INITIAL_STAFF,
      patients: generateSeedPatients(INITIAL_DEMO_DATE),
      closedCaseStats: generateSeedClosedStats(INITIAL_DEMO_DATE),
      toasts: [],

      setCurrentUser: (user: Staff) => {
        set({ currentUser: user });
      },

      switchRole: (role: Role) => {
        const activeStaffOfRole = get().staff.find(s => s.role === role && s.active);
        if (activeStaffOfRole) {
          set({ currentUser: activeStaffOfRole });
          get().addToast({
            type: 'info',
            message: `Switched to ${activeStaffOfRole.name} (${role.toUpperCase()})`,
          });
        }
      },

      advanceDate: () => {
        const { currentDate, patients, closedCaseStats } = get();
        const nextDate = addDays(currentDate, 1);

        // Record history snapshot for previous day
        const activeCount = patients.filter(p => p.status === 'admitted' || p.status === 'discharge_approved').length;
        const recordedCount = patients.filter(p => p.status === 'admitted' && !!getTodayReading(p, currentDate)).length;
        const admittedCount = patients.filter(p => p.status === 'admitted').length;
        const recordedPct = admittedCount > 0 ? Math.round((recordedCount / admittedCount) * 100) : 0;

        const updatedHistory = [
          ...closedCaseStats.history,
          {
            date: currentDate,
            occupancy: activeCount,
            tempsRecordedPct: recordedPct,
            discharges: 0,
            deaths: 0,
          }
        ].slice(-14); // Keep last 14 days

        set({
          currentDate: nextDate,
          closedCaseStats: {
            ...closedCaseStats,
            history: updatedHistory,
          }
        });

        get().addToast({
          type: 'info',
          message: `Simulated date advanced to ${nextDate}. Pending rounds reset for new day.`,
        });
      },

      resetDemoData: () => {
        const freshPatients = generateSeedPatients(INITIAL_DEMO_DATE);
        const freshStats = generateSeedClosedStats(INITIAL_DEMO_DATE);
        set({
          currentDate: INITIAL_DEMO_DATE,
          currentUser: INITIAL_STAFF[0],
          staff: INITIAL_STAFF,
          patients: freshPatients,
          closedCaseStats: freshStats,
        });

        runWardWatchSelfTests();

        get().addToast({
          type: 'success',
          message: 'WardWatch demo data reset to initial baseline state (74 rooms occupied).',
        });
      },

      recordTemperature: (patientId, value, isCorrection = false, reason = '') => {
        const state = get();
        const { currentDate, currentUser, patients } = state;

        if (currentUser.role !== 'nurse') {
          return { success: false, error: 'Only nurses are authorized to record temperatures.' };
        }

        // Validate range 34.0 to 42.0
        if (typeof value !== 'number' || isNaN(value) || value < 34.0 || value > 42.0) {
          return { success: false, error: 'Enter a value between 34.0 and 42.0 °C.' };
        }

        const patientIndex = patients.findIndex(p => p.id === patientId);
        if (patientIndex === -1) {
          return { success: false, error: 'Patient not found.' };
        }

        const patient = patients[patientIndex];
        const existingReading = getTodayReading(patient, currentDate);

        // Rule 4: One reading per patient per calendar day
        if (existingReading && !isCorrection) {
          return {
            success: false,
            isDuplicate: true,
            existingReading,
            error: `Already recorded at ${existingReading.time} by ${existingReading.byName}: ${existingReading.value.toFixed(1)} °C.`,
          };
        }

        const time = getWallClockTimeString();
        const timestamp = getCurrentIsoTimestamp(currentDate);

        let updatedReadings: TemperatureReading[];
        let newAuditEntry: AuditLogEntry;

        if (isCorrection && existingReading) {
          if (!reason || reason.trim().length < 3) {
            return { success: false, error: 'Correction requires a reason (minimum 3 characters).' };
          }

          // Replace the day's value and keep previous in audit trail
          const prevValue = existingReading.value;
          updatedReadings = patient.readings.map(r => {
            if (r.date === currentDate) {
              return {
                ...r,
                value: Number(value.toFixed(1)),
                time,
                byId: currentUser.id,
                byName: currentUser.name,
                corrected: true,
                previousValue: prevValue,
                reason: reason.trim(),
              };
            }
            return r;
          });

          newAuditEntry = {
            action: 'Temperature Corrected',
            byUserId: currentUser.id,
            byName: currentUser.name,
            role: 'nurse',
            timestamp,
            details: `Corrected reading from ${prevValue.toFixed(1)} °C to ${value.toFixed(1)} °C. Reason: "${reason.trim()}"`,
          };
        } else {
          // New reading for today
          const newReading: TemperatureReading = {
            date: currentDate,
            value: Number(value.toFixed(1)),
            time,
            byId: currentUser.id,
            byName: currentUser.name,
          };
          updatedReadings = [...patient.readings, newReading];

          newAuditEntry = {
            action: 'Temperature Recorded',
            byUserId: currentUser.id,
            byName: currentUser.name,
            role: 'nurse',
            timestamp,
            details: `Recorded temperature: ${value.toFixed(1)} °C.`,
          };
        }

        const updatedPatients = [...patients];
        updatedPatients[patientIndex] = {
          ...patient,
          readings: updatedReadings,
          auditLog: [newAuditEntry, ...patient.auditLog],
        };

        set({ patients: updatedPatients });

        // Critical alert notification if >= 40.0
        if (isCritical(value)) {
          get().addToast({
            type: 'error',
            message: `CRITICAL: Patient ${patient.name} (${patient.roomId}) temperature is ${value.toFixed(1)} °C! Doctor notified.`,
          });
        } else {
          get().addToast({
            type: 'success',
            message: `Recorded ${value.toFixed(1)} °C for ${patient.name} (${patient.roomId}).`,
          });
        }

        return { success: true };
      },

      completeDoctorVisit: (patientId, note, decision, causeOfDeath) => {
        const state = get();
        const { currentDate, currentUser, patients, closedCaseStats } = state;

        if (currentUser.role !== 'doctor') {
          return { success: false, error: 'Only doctors are authorized to complete visits.' };
        }

        const patientIndex = patients.findIndex(p => p.id === patientId);
        if (patientIndex === -1) {
          return { success: false, error: 'Patient not found.' };
        }

        const patient = patients[patientIndex];
        const todayReading = getTodayReading(patient, currentDate);

        // Rule 6: Doctor visit rules: A visit can be marked complete ONLY IF today's temperature is recorded.
        if (!todayReading) {
          return { success: false, error: 'Awaiting temperature reading before visit can be completed.' };
        }

        if (!note || note.trim().length < 3) {
          return { success: false, error: 'Visit note is required (minimum 3 characters).' };
        }

        // Rule 6: Approve discharge only enabled if eligible
        if (decision === 'discharge') {
          const eligible = isEligibleForDischarge(patient, currentDate);
          if (!eligible) {
            return {
              success: false,
              error: 'Patient is not yet eligible for discharge. Requires 3 consecutive fever-free days.',
            };
          }
        }

        const time = getWallClockTimeString();
        const timestamp = getCurrentIsoTimestamp(currentDate);

        const newVisit: DoctorVisit = {
          date: currentDate,
          time,
          byId: currentUser.id,
          byName: currentUser.name,
          note: note.trim(),
          decision,
        };

        const updatedVisits = [...patient.visits, newVisit];
        const updatedPatients = [...patients];
        let updatedClosedStats = { ...closedCaseStats };

        if (decision === 'discharge') {
          // Patient status becomes discharge_approved
          const auditEntry: AuditLogEntry = {
            action: 'Discharge Approved',
            byUserId: currentUser.id,
            byName: currentUser.name,
            role: 'doctor',
            timestamp,
            details: `Doctor approved discharge after ${calculateStreak(patient, currentDate)} days afebrile. Note: "${note.trim()}". Pending Admin final discharge.`,
          };

          updatedPatients[patientIndex] = {
            ...patient,
            status: 'discharge_approved',
            dischargeApprovedAt: timestamp,
            visits: updatedVisits,
            auditLog: [auditEntry, ...patient.auditLog],
          };

          set({ patients: updatedPatients });

          get().addToast({
            type: 'success',
            message: `Discharge approved for ${patient.name} (${patient.roomId}). Sent to Admin discharge queue.`,
          });
        } else if (decision === 'death') {
          // Patient closed deceased, room freed
          const freedRoom = patient.roomId;
          const auditEntry: AuditLogEntry = {
            action: 'Death Recorded',
            byUserId: currentUser.id,
            byName: currentUser.name,
            role: 'doctor',
            timestamp,
            details: `Patient declared deceased. Cause / Notes: "${causeOfDeath?.trim() || note.trim()}". Room ${freedRoom} freed.`,
          };

          updatedPatients[patientIndex] = {
            ...patient,
            status: 'deceased',
            roomId: null,
            closedOn: currentDate,
            visits: updatedVisits,
            auditLog: [auditEntry, ...patient.auditLog],
          };

          updatedClosedStats = {
            ...closedCaseStats,
            deceased: closedCaseStats.deceased + 1,
          };

          set({
            patients: updatedPatients,
            closedCaseStats: updatedClosedStats,
          });

          // Check mortality threshold
          const mortality = calculateMortalityMetrics(updatedClosedStats);
          if (mortality.isMortalityExceeded) {
            get().addToast({
              type: 'error',
              message: `ALERT: Facility mortality rate (${mortality.mortalityRate}%) has exceeded the 15% benchmark!`,
            });
          } else {
            get().addToast({
              type: 'warning',
              message: `Death recorded for ${patient.name}. Room ${freedRoom} is now vacant.`,
            });
          }
        } else {
          // Continue treatment
          const auditEntry: AuditLogEntry = {
            action: 'Doctor Visit Completed',
            byUserId: currentUser.id,
            byName: currentUser.name,
            role: 'doctor',
            timestamp,
            details: `Visit completed. Clinical decision: Continue treatment. Note: "${note.trim()}"`,
          };

          updatedPatients[patientIndex] = {
            ...patient,
            visits: updatedVisits,
            auditLog: [auditEntry, ...patient.auditLog],
          };

          set({ patients: updatedPatients });

          get().addToast({
            type: 'success',
            message: `Visit completed for ${patient.name} (${patient.roomId}).`,
          });
        }

        return { success: true };
      },

      completeDischarge: (patientId) => {
        const state = get();
        const { currentDate, currentUser, patients, closedCaseStats } = state;

        if (currentUser.role !== 'admin') {
          return { success: false, error: 'Only administrators can finalize discharges and free beds.' };
        }

        const patientIndex = patients.findIndex(p => p.id === patientId);
        if (patientIndex === -1) {
          return { success: false, error: 'Patient not found.' };
        }

        const patient = patients[patientIndex];
        if (patient.status !== 'discharge_approved') {
          return { success: false, error: 'Patient has not been approved for discharge by a doctor.' };
        }

        const freedRoom = patient.roomId;
        const timestamp = getCurrentIsoTimestamp(currentDate);

        const auditEntry: AuditLogEntry = {
          action: 'Discharge Completed',
          byUserId: currentUser.id,
          byName: currentUser.name,
          role: 'admin',
          timestamp,
          details: `Final discharge completed by Admin. Patient cured. Room ${freedRoom} freed and available for new admissions.`,
        };

        const updatedPatients = [...patients];
        updatedPatients[patientIndex] = {
          ...patient,
          status: 'discharged',
          roomId: null,
          closedOn: currentDate,
          auditLog: [auditEntry, ...patient.auditLog],
        };

        const updatedClosedStats: ClosedCaseStats = {
          ...closedCaseStats,
          cured: closedCaseStats.cured + 1,
        };

        set({
          patients: updatedPatients,
          closedCaseStats: updatedClosedStats,
        });

        get().addToast({
          type: 'success',
          message: `Room ${freedRoom} is now vacant. Discharge completed for ${patient.name}.`,
        });

        return { success: true };
      },

      admitPatient: (data) => {
        const state = get();
        const { currentDate, currentUser, patients } = state;

        if (currentUser.role !== 'admin') {
          return { success: false, error: 'Only administrators can admit patients.' };
        }

        // Rule 9: Capacity: 74 rooms (R-01 to R-74). Admit blocked when occupancy is 74/74
        const activePatientsWithRooms = patients.filter(
          p => (p.status === 'admitted' || p.status === 'discharge_approved') && p.roomId !== null
        );

        if (activePatientsWithRooms.length >= 74) {
          return {
            success: false,
            error: 'Centre at full capacity (74/74). Discharge a patient to free a bed.',
          };
        }

        // Check if requested room is occupied
        const isOccupied = activePatientsWithRooms.some(p => p.roomId === data.roomId);
        if (isOccupied) {
          return { success: false, error: `Room ${data.roomId} is currently occupied.` };
        }

        const timestamp = getCurrentIsoTimestamp(currentDate);
        const newPatientId = `patient-${Date.now()}`;

        const newPatient: Patient = {
          id: newPatientId,
          name: data.name.trim(),
          age: data.age,
          gender: data.gender,
          phone: data.phone.trim(),
          emergencyContact: data.emergencyContact.trim(),
          admittedOn: currentDate,
          roomId: data.roomId,
          status: 'admitted',
          readings: [],
          visits: [],
          initialSymptoms: data.initialSymptoms?.trim() || 'Suspected viral fever and fatigue',
          auditLog: [
            {
              action: 'Admitted',
              byUserId: currentUser.id,
              byName: currentUser.name,
              role: 'admin',
              timestamp,
              details: `Admitted to room ${data.roomId} by Admin ${currentUser.name}. Symptoms: ${data.initialSymptoms?.trim() || 'Suspected fever'}.`,
            },
          ],
        };

        set({
          patients: [newPatient, ...patients],
        });

        get().addToast({
          type: 'success',
          message: `Patient ${newPatient.name} successfully admitted to ${data.roomId}.`,
        });

        return { success: true };
      },

      addStaff: (data) => {
        const { currentUser, staff } = get();
        if (currentUser.role !== 'admin') {
          return { success: false, error: 'Only administrators can manage staff.' };
        }

        const newStaff: Staff = {
          id: `staff-${Date.now()}`,
          name: data.name.trim(),
          email: data.email.trim(),
          role: data.role,
          active: true,
        };

        set({ staff: [...staff, newStaff] });

        get().addToast({
          type: 'success',
          message: `Added new staff member: ${newStaff.name} (${newStaff.role}).`,
        });

        return { success: true };
      },

      toggleStaffStatus: (staffId) => {
        const { currentUser, staff } = get();
        if (currentUser.role !== 'admin') {
          return { success: false, error: 'Only administrators can manage staff.' };
        }

        // Rule: An admin cannot deactivate themselves
        if (staffId === currentUser.id) {
          return { success: false, error: 'You cannot deactivate your own account.' };
        }

        const target = staff.find(s => s.id === staffId);
        if (!target) return { success: false, error: 'Staff member not found.' };

        const updated = staff.map(s => (s.id === staffId ? { ...s, active: !s.active } : s));
        set({ staff: updated });

        get().addToast({
          type: 'info',
          message: `${target.name} has been ${target.active ? 'deactivated' : 'reactivated'}.`,
        });

        return { success: true };
      },

      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        set(state => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        const duration = toast.duration || 4000;
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },

      removeToast: (id) => {
        set(state => ({
          toasts: state.toasts.filter(t => t.id !== id),
        }));
      },

      getAlertsForRole: (role: Role): AlertItem[] => {
        const { patients, currentDate, closedCaseStats } = get();
        const alerts: AlertItem[] = [];

        // 1. Critical & fever readings today
        patients.forEach(p => {
          if (p.status !== 'admitted') return;
          const r = getTodayReading(p, currentDate);
          if (r) {
            if (isCritical(r.value)) {
              alerts.push({
                id: `alert-crit-${p.id}`,
                type: 'critical_temp',
                severity: 'critical',
                title: `Critical Fever: ${r.value.toFixed(1)} °C`,
                message: `Patient ${p.name} in room ${p.roomId} has critical fever. Immediate doctor attention needed.`,
                timestamp: `${currentDate} ${r.time}`,
                patientId: p.id,
                roomId: p.roomId || '',
                roles: ['nurse', 'doctor', 'admin'],
                actionUrl: `/patients/${p.id}`,
              });
            } else if (isFever(r.value)) {
              alerts.push({
                id: `alert-fever-${p.id}`,
                type: 'fever_temp',
                severity: 'warning',
                title: `Fever Recorded: ${r.value.toFixed(1)} °C`,
                message: `${p.name} (${p.roomId}) has fever. Streak reset to 0.`,
                timestamp: `${currentDate} ${r.time}`,
                patientId: p.id,
                roomId: p.roomId || '',
                roles: ['doctor', 'admin'],
                actionUrl: `/patients/${p.id}`,
              });
            }
          }
        });

        // 2. Overdue temperature checks
        patients.forEach(p => {
          if (p.status === 'admitted' && isTemperatureOverdue(p, currentDate)) {
            alerts.push({
              id: `alert-overdue-${p.id}`,
              type: 'overdue_temp',
              severity: 'warning',
              title: `Overdue Reading: Room ${p.roomId}`,
              message: `Temperature check for ${p.name} is pending past 14:00 deadline.`,
              timestamp: `${currentDate} 14:00`,
              patientId: p.id,
              roomId: p.roomId || '',
              roles: ['nurse', 'admin'],
              actionUrl: `/patients/${p.id}`,
            });
          }
        });

        // 3. Eligible for discharge
        patients.forEach(p => {
          if (p.status === 'admitted' && isEligibleForDischarge(p, currentDate)) {
            const streak = calculateStreak(p, currentDate);
            alerts.push({
              id: `alert-elig-${p.id}`,
              type: 'eligible_discharge',
              severity: 'info',
              title: `Discharge Eligible: ${p.name}`,
              message: `Room ${p.roomId} has reached ${streak} consecutive days afebrile. Ready for doctor approval.`,
              timestamp: `${currentDate}`,
              patientId: p.id,
              roomId: p.roomId || '',
              roles: ['doctor'],
              actionUrl: `/patients/${p.id}`,
            });
          }
        });

        // 4. Discharges waiting on Admin
        patients.forEach(p => {
          if (p.status === 'discharge_approved') {
            alerts.push({
              id: `alert-pending-disc-${p.id}`,
              type: 'discharge_waiting',
              severity: 'warning',
              title: `Discharge Pending: Room ${p.roomId}`,
              message: `${p.name} discharge approved by doctor. Bed awaiting final Admin clearance.`,
              timestamp: p.dischargeApprovedAt || currentDate,
              patientId: p.id,
              roomId: p.roomId || '',
              roles: ['admin'],
              actionUrl: `/admin/discharges`,
            });
          }
        });

        // 5. Mortality benchmark alert
        const mortality = calculateMortalityMetrics(closedCaseStats);
        if (mortality.isMortalityExceeded) {
          alerts.push({
            id: 'alert-mortality-exceeded',
            type: 'mortality_alert',
            severity: 'critical',
            title: `Mortality Rate Alert: ${mortality.mortalityRate}%`,
            message: `Facility mortality rate (${mortality.mortalityRate}%) exceeds the 15.0% threshold benchmark (${mortality.deceased}/${mortality.totalClosed} cases).`,
            timestamp: currentDate,
            roles: ['admin', 'doctor'],
            actionUrl: `/admin/dashboard`,
          });
        }

        // Filter alerts relevant to the requesting role
        return alerts.filter(a => a.roles.includes(role));
      },
    }),
    {
      name: 'wardwatch_quarantine_storage_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: state => ({
        currentDate: state.currentDate,
        currentUser: state.currentUser,
        staff: state.staff,
        patients: state.patients,
        closedCaseStats: state.closedCaseStats,
      }),
    }
  )
);
