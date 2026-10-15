import { Staff, Patient, ClosedCaseStats, DailyAggregate, AuditLogEntry, TemperatureReading, DoctorVisit } from '../types';
import { addDays } from '../lib/selectors';

export const INITIAL_DEMO_DATE = '2026-10-15';

export const INITIAL_STAFF: Staff[] = [
  {
    id: 'staff-nurse-1',
    name: 'Nurse Priya Sharma',
    role: 'nurse',
    email: 'priya.sharma@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-nurse-2',
    name: 'Nurse Rajesh Patel',
    role: 'nurse',
    email: 'rajesh.patel@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-nurse-3',
    name: 'Nurse Ananya Iyer',
    role: 'nurse',
    email: 'ananya.iyer@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-nurse-4',
    name: 'Nurse Vikram Rao',
    role: 'nurse',
    email: 'vikram.rao@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-doc-1',
    name: 'Dr. Siddharth Verma',
    role: 'doctor',
    email: 'siddharth.verma@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-doc-2',
    name: 'Dr. Meera Nambiar',
    role: 'doctor',
    email: 'meera.nambiar@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-doc-3',
    name: 'Dr. Amit Joshi',
    role: 'doctor',
    email: 'amit.joshi@wardwatch.org',
    active: true,
  },
  {
    id: 'staff-admin-1',
    name: 'Admin Sunita Reddy',
    role: 'admin',
    email: 'sunita.reddy@wardwatch.org',
    active: true,
  },
];

const FIRST_NAMES = [
  'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Ishaan', 'Sai', 'Riya',
  'Reyansh', 'Arjun', 'Rahul', 'Pooja', 'Sneha', 'Sanjay', 'Deepak', 'Kavita', 'Neha', 'Rohan',
  'Aditi', 'Alok', 'Tanvi', 'Manish', 'Bhavna', 'Gaurav', 'Shreya', 'Kiran', 'Naveen', 'Swati',
  'Pradeep', 'Preeti', 'Harsh', 'Isha', 'Varun', 'Meenakshi', 'Tarun', 'Divya', 'Suresh', 'Geeta',
  'Mohan', 'Lakshmi', 'Nikhil', 'Simran', 'Akash', 'Shruti', 'Vikas', 'Rashmi', 'Manoj', 'Deepa',
  'Ashok', 'Usha', 'Ramesh', 'Asha', 'Sunil', 'Anita', 'Dinesh', 'Rekha', 'Mahesh', 'Saroj',
  'Ajay', 'Kamla', 'Vinod', 'Shanti', 'Vijay', 'Pushpa', 'Satish', 'Savitri', 'Santosh', 'Vimla',
  'Rajendra', 'Sharda', 'Kailash', 'Maya'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Iyer', 'Rao', 'Nambiar', 'Joshi', 'Reddy', 'Gupta', 'Singh',
  'Kumar', 'Mehta', 'Nair', 'Deshmukh', 'Chatterjee', 'Bose', 'Mukherjee', 'Menon', 'Kulkarni', 'Bhat',
  'Chauhan', 'Pandey', 'Saxena', 'Mishra', 'Tiwari', 'Yadav', 'Malhotra', 'Kapoor', 'Khanna', 'Bansal',
  'Agarwal', 'Chopra', 'Pillai', 'Shetty', 'Hegde', 'Dhar', 'Dutta', 'Ghosh', 'Sen', 'Banerjee',
  'Sengupta', 'Chakraborty', 'Das', 'Roy', 'Barman', 'Sarkar', 'Biswas', 'Choudhury', 'Deb', 'Paul',
  'Majumdar', 'Saha', 'Mitra', 'Bhowmick', 'Ghosh', 'Nath', 'Kundu', 'De', 'Pramanik', 'Pal',
  'Basu', 'Karmakar', 'Ray', 'Guchait', 'Midya', 'Santra', 'Sasmal', 'Maity', 'Doloi', 'Manna',
  'Adhikary', 'Samanta', 'Jana', 'Giri'
];

/**
 * Generate 74 deterministic patients filling R-01 to R-74
 */
export function generateSeedPatients(baseDate: string = INITIAL_DEMO_DATE): Patient[] {
  const patients: Patient[] = [];

  for (let i = 1; i <= 74; i++) {
    const roomId = `R-${String(i).padStart(2, '0')}`;
    const id = `patient-${i}`;
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
    const name = `${firstName} ${lastName}`;
    const age = 12 + ((i * 7) % 68); // Ages between 12 and 80
    const gender: 'Male' | 'Female' = i % 2 === 0 ? 'Female' : 'Male';
    const phone = `+91 98${String(10000000 + i * 111111).slice(0, 8)}`;
    const emergencyContact = `+91 97${String(20000000 + i * 123456).slice(0, 8)}`;

    // Days admitted: 4 to 12 days ago
    const stayDays = 4 + (i % 9);
    const admittedOn = addDays(baseDate, -stayDays);

    const readings: TemperatureReading[] = [];
    const visits: DoctorVisit[] = [];
    const auditLog: AuditLogEntry[] = [
      {
        action: 'Admitted',
        byName: 'Admin Sunita Reddy',
        role: 'admin',
        timestamp: `${admittedOn}T10:00:00`,
        details: `Admitted to room ${roomId} with viral fever symptoms.`
      }
    ];

    let status: Patient['status'] = 'admitted';
    let dischargeApprovedAt: string | undefined = undefined;

    // Target distributions:
    // 3 patients already in discharge_approved status: R-10, R-25, R-40
    const isPreApprovedDischarge = i === 10 || i === 25 || i === 40;

    // Group allocations:
    // Rooms 1-14 (14 patients): Eligible streak >= 3
    //   - Rooms 1-6 (6 patients): has today's reading (normal ~36.7)
    //   - Rooms 7-14 (8 patients): today's reading pending
    // Rooms 15-26 (12 patients): Streak 1 or 2 (fever 2-3 days ago, improving)
    // Rooms 27-38 (12 patients): Fever today (2 >= 39.5, 1 critical >= 40.0)
    //   - Room 27: Critical 40.2 °C
    //   - Room 28: 39.6 °C
    //   - Room 29: 39.5 °C
    //   - Rooms 30-38: 38.2 to 38.8 °C
    // Rooms 39-66 (28 patients): Pending today's temperature
    // Rooms 67-74 (8 patients): Today recorded normal, some visited by doctor

    // Generate historical readings for past days: from admittedOn up to yesterday (day -1)
    for (let dayOffset = -stayDays + 1; dayOffset <= -1; dayOffset++) {
      const readingDate = addDays(baseDate, dayOffset);
      let temp = 37.1;

      if (i <= 14 || isPreApprovedDischarge) {
        // High streak: normal readings for at least the last 4 days
        if (dayOffset >= -4) {
          temp = 36.5 + ((i + dayOffset) % 5) * 0.1; // 36.5 - 36.9
        } else {
          temp = 38.2 + (i % 4) * 0.2;
        }
      } else if (i <= 26) {
        // Streak 1 or 2: had fever 2 days ago, normal yesterday
        if (dayOffset === -1) {
          temp = 36.8;
        } else if (dayOffset === -2 && i % 2 === 0) {
          temp = 36.9; // streak 2
        } else {
          temp = 38.3; // resets streak
        }
      } else if (i <= 38) {
        // Fever patients: prolonged fever
        temp = 38.1 + ((i * 3 + dayOffset) % 10) * 0.15;
      } else {
        // General patients
        temp = 36.8 + ((i + dayOffset) % 12) * 0.1;
      }

      const nurseIdx = (i + Math.abs(dayOffset)) % 4;
      const nurse = INITIAL_STAFF[nurseIdx];
      const readingTime = `09:${String(10 + ((i * 3) % 45)).padStart(2, '0')}`;

      readings.push({
        date: readingDate,
        value: Number(temp.toFixed(1)),
        time: readingTime,
        byId: nurse.id,
        byName: nurse.name,
      });

      // Add doctor visits for some past days
      if (dayOffset >= -2) {
        const docIdx = 4 + ((i + Math.abs(dayOffset)) % 3);
        const doc = INITIAL_STAFF[docIdx];
        visits.push({
          date: readingDate,
          time: `11:${String(15 + ((i * 2) % 40)).padStart(2, '0')}`,
          byId: doc.id,
          byName: doc.name,
          note: temp >= 38.0
            ? 'Patient febrile. Hydration and antipyretics continued.'
            : 'Patient stable, vitals regular. Continue quarantine protocol.',
          decision: 'continue',
        });
      }
    }

    // Now handle TODAY (baseDate)
    const nurseToday = INITIAL_STAFF[i % 4];
    const docToday = INITIAL_STAFF[4 + (i % 3)];

    if (isPreApprovedDischarge) {
      status = 'discharge_approved';
      // Approved 5 hours ago
      dischargeApprovedAt = `${baseDate}T11:30:00`;
      readings.push({
        date: baseDate,
        value: 36.6,
        time: '08:45',
        byId: nurseToday.id,
        byName: nurseToday.name,
      });
      visits.push({
        date: baseDate,
        time: '11:30',
        byId: docToday.id,
        byName: docToday.name,
        note: 'Patient completed 3+ days afebrile. Clinical condition clear. Approved for discharge.',
        decision: 'discharge',
      });
      auditLog.push({
        action: 'Discharge Approved',
        byName: docToday.name,
        role: 'doctor',
        timestamp: `${baseDate}T11:30:00`,
        details: 'Patient has been fever-free for 3 consecutive days. Discharge approved by doctor.'
      });
    } else if (i <= 6) {
      // Eligible with today recorded (normal)
      readings.push({
        date: baseDate,
        value: 36.6 + (i % 3) * 0.1,
        time: '09:15',
        byId: nurseToday.id,
        byName: nurseToday.name,
      });
      auditLog.push({
        action: 'Temperature Recorded',
        byName: nurseToday.name,
        role: 'nurse',
        timestamp: `${baseDate}T09:15:00`,
        details: `Recorded ${(36.6 + (i % 3) * 0.1).toFixed(1)} °C.`
      });
    } else if (i >= 27 && i <= 38) {
      // Fever today!
      let feverTemp = 38.4;
      if (i === 27) feverTemp = 40.2; // Critical!
      else if (i === 28) feverTemp = 39.6;
      else if (i === 29) feverTemp = 39.5;
      else feverTemp = 38.2 + (i % 6) * 0.1;

      readings.push({
        date: baseDate,
        value: Number(feverTemp.toFixed(1)),
        time: '09:40',
        byId: nurseToday.id,
        byName: nurseToday.name,
      });
      auditLog.push({
        action: 'Temperature Recorded',
        byName: nurseToday.name,
        role: 'nurse',
        timestamp: `${baseDate}T09:40:00`,
        details: `Recorded ${feverTemp.toFixed(1)} °C.${feverTemp >= 40.0 ? ' Critical fever alert!' : ''}`
      });

      // Doctor visit for critical patient
      if (i === 27) {
        visits.push({
          date: baseDate,
          time: '10:15',
          byId: docToday.id,
          byName: docToday.name,
          note: 'Emergency consult: High grade fever 40.2 °C. Administered IV paracetamol, cold sponging, placed on continuous monitoring.',
          decision: 'continue',
        });
        auditLog.push({
          action: 'Doctor Visit Completed',
          byName: docToday.name,
          role: 'doctor',
          timestamp: `${baseDate}T10:15:00`,
          details: 'Doctor completed urgent visit notes. Continued active intensive management.'
        });
      }
    } else if (i >= 60 && i <= 74) {
      // Done today (both temp and doctor visit)
      const val = 36.7 + (i % 5) * 0.1;
      readings.push({
        date: baseDate,
        value: Number(val.toFixed(1)),
        time: '08:50',
        byId: nurseToday.id,
        byName: nurseToday.name,
      });
      visits.push({
        date: baseDate,
        time: '11:10',
        byId: docToday.id,
        byName: docToday.name,
        note: 'Normal vitals, chest clear, no active complaints.',
        decision: 'continue',
      });
      auditLog.push({
        action: 'Temperature Recorded',
        byName: nurseToday.name,
        role: 'nurse',
        timestamp: `${baseDate}T08:50:00`,
        details: `Recorded ${val.toFixed(1)} °C.`
      });
      auditLog.push({
        action: 'Doctor Visit Completed',
        byName: docToday.name,
        role: 'doctor',
        timestamp: `${baseDate}T11:10:00`,
        details: 'Doctor completed daily visit.'
      });
    }

    // Remaining patients (rooms 7-26, 39-59) have pending temperatures for today!

    patients.push({
      id,
      name,
      age,
      gender,
      phone,
      emergencyContact,
      admittedOn,
      roomId,
      status,
      readings,
      visits,
      auditLog,
      dischargeApprovedAt,
      initialSymptoms: i % 3 === 0 ? 'Fever, cough, body ache' : 'High fever, chills, fatigue',
    });
  }

  return patients;
}

/**
 * 14-day aggregate history for charts & closed case stats
 */
export function generateSeedClosedStats(baseDate: string = INITIAL_DEMO_DATE): ClosedCaseStats {
  const history: DailyAggregate[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = addDays(baseDate, -i);
    history.push({
      date: d,
      occupancy: 70 + (i % 5),
      tempsRecordedPct: 92 + (i % 8),
      discharges: 2 + (i % 4),
      deaths: i === 4 || i === 9 ? 1 : 0,
    });
  }

  return {
    cured: 86,
    deceased: 14, // 14 / 100 = 14.0%
    history,
  };
}
