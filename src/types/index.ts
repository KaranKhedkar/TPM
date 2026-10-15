export type Role = 'nurse' | 'doctor' | 'admin';

export interface Staff {
  id: string;
  name: string;
  role: Role;
  email: string;
  active: boolean;
}

export interface TemperatureReading {
  date: string; // ISO date 'YYYY-MM-DD'
  value: number; // 34.0 to 42.0 °C
  time: string; // 'HH:mm'
  byId: string;
  byName: string;
  corrected?: boolean;
  previousValue?: number;
  reason?: string;
}

export interface DoctorVisit {
  date: string; // ISO date 'YYYY-MM-DD'
  time: string; // 'HH:mm'
  byId: string;
  byName: string;
  note: string;
  decision: 'continue' | 'discharge' | 'death';
}

export interface AuditLogEntry {
  action: string;
  byUserId?: string;
  byName: string;
  role: Role;
  timestamp: string; // ISO string or formatted datetime
  details: string;
}

export type PatientStatus = 'admitted' | 'discharge_approved' | 'discharged' | 'deceased';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  emergencyContact: string;
  admittedOn: string; // 'YYYY-MM-DD'
  roomId: string | null; // e.g. 'R-01', null once closed
  status: PatientStatus;
  readings: TemperatureReading[];
  visits: DoctorVisit[];
  auditLog: AuditLogEntry[];
  dischargeApprovedAt?: string; // ISO string
  closedOn?: string; // ISO date 'YYYY-MM-DD'
  initialSymptoms?: string;
  notes?: string;
}

export interface DailyAggregate {
  date: string;
  occupancy: number;
  tempsRecordedPct: number;
  discharges: number;
  deaths: number;
}

export interface ClosedCaseStats {
  cured: number;
  deceased: number;
  history: DailyAggregate[];
}

export interface AlertItem {
  id: string;
  type: 'critical_temp' | 'fever_temp' | 'overdue_temp' | 'eligible_discharge' | 'discharge_waiting' | 'mortality_alert';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  patientId?: string;
  roomId?: string;
  roles: Role[]; // which roles should see this alert
  actionUrl?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
