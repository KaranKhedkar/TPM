# WardWatch

**WardWatch** is a clinical-modern daily temperature-tracking and discharge-management application designed for a 74-bed virus quarantine and treatment facility.

In high-pressure quarantine centers, manual paper logs lead to missed or duplicated temperatures, premature doctor rounds, delayed discharges, and blind spots around mortality targets. WardWatch enforces a strict, two-step daily clinical workflow:
1. **Exactly one nurse temperature reading per patient per calendar day.**
2. **Exactly one doctor visit per patient per day, unlocked only after today's temperature is recorded.**
3. **Discharge approval when a patient reaches 3 consecutive days afebrile (&lt; 38.0 °C), followed by Administrator bed release.**
4. **Active tracking against the 15% mortality ceiling and 85% cure benchmark.**

---

## 🌟 Demo Accounts

WardWatch includes 8 seeded staff profiles with 1-click login (no passwords required) and role switching from any screen:

| Staff Member | Role | Email | Responsibilities |
|---|---|---|---|
| **Nurse Priya Sharma** *(Default)* | Nurse | `priya.sharma@wardwatch.org` | Morning temperature rounds, correcting readings, viewing alerts |
| **Nurse Rajesh Patel** | Nurse | `rajesh.patel@wardwatch.org` | Secondary rounds & ward temperature logging |
| **Nurse Ananya Iyer** | Nurse | `ananya.iyer@wardwatch.org` | Temperature rounds |
| **Nurse Vikram Rao** | Nurse | `vikram.rao@wardwatch.org` | Temperature rounds |
| **Dr. Siddharth Verma** | Doctor | `siddharth.verma@wardwatch.org` | Prioritized visit queue, clinical notes, discharge approvals, death declaration |
| **Dr. Meera Nambiar** | Doctor | `meera.nambiar@wardwatch.org` | Clinical rounding & consultations |
| **Dr. Amit Joshi** | Doctor | `amit.joshi@wardwatch.org` | Clinical rounding & consultations |
| **Admin Sunita Reddy** | Admin | `sunita.reddy@wardwatch.org` | Facility dashboard, mortality benchmark gauge, admissions, bed release, staff management |

---

## 🚶 5-Step Reviewer Demo Walkthrough Script

A collapsible walkthrough guide is accessible directly on the Login screen and in the floating Demo Controls:

1. **Step 1: Nurse records a temperature**
   - Log in as **Nurse Priya Sharma** (lands on `/rounds`).
   - Find a pending patient (e.g. **Room R-07**).
   - Tap **Record Temp**. Notice the numeric steppers, quick presets (36.5, 37.0, 37.5, 38.0), and real-time color feedback.
   - Enter `37.1 °C` and click **Save Reading**.
   - The row immediately marks **Done** with a green chip and unlocks the doctor's visit queue.

2. **Step 2: Doctor completes visit**
   - Switch to **Dr. Siddharth Verma** via the top-right profile menu.
   - Open the **Visit Queue** (`/doctor/queue`).
   - Notice that the patient from Step 1 has moved from *"Waiting on nurse"* to *"Ready for Visit"*.
   - Tap **Start Visit**, enter notes (e.g. *"Afebrile, chest clear, vitals normal"*), keep *"Continue treatment"*, and click **Complete Visit**.

3. **Step 3: Advance the day to grow streak**
   - Click the bottom-right floating **Demo Controls** panel.
   - Tap **Advance to Next Day (+1d)**.
   - Notice the simulated date increments by 1 day, pending rounds reset facility-wide, and fever-free streaks advance.

4. **Step 4: Doctor approves discharge for an eligible patient**
   - In Doctor Visit Queue, inspect **Priority 1: Eligible for Discharge** (afebrile for ≥ 3 consecutive completed days).
   - Select an eligible patient, tap **Approve Discharge**, choose *"Approve for Discharge"*, and click **Complete Visit**.
   - Patient status transitions to `discharge_approved` and moves to the Admin Discharge Queue.

5. **Step 5: Admin completes discharge, admits new patient & verifies mortality**
   - Switch to **Admin Sunita Reddy**.
   - Open **Discharge Queue** (`/admin/discharges`). View the patient with the *"Waiting > 4 hrs"* highlight.
   - Tap **Complete Discharge** and confirm. A toast confirms *"Room R-xx is now vacant"* and cured count increments.
   - Navigate to **Admissions & Beds** (`/admin/admissions`). The 74-room interactive grid now shows the vacant room.
   - Tap **Admit Patient**, enter patient details, assign the newly freed room, and confirm admission.
   - Open the **Dashboard** (`/admin/dashboard`) to view the **Mortality vs 15% Benchmark** gauge, 14-day compliance trends, and capacity indicators.

---

## 📋 Business Rules Enforced

1. **Simulated Clock & Time Traveling:**
   - App-level `currentDate` stored in state (seeded to `2026-10-15`).
   - Floating collapsible Demo Controls allow advancing one day at a time or resetting all 74 rooms back to initial baseline data.
   - Real-world wall clock is combined with `currentDate` for accurate timestamps.
2. **Clinical Fever & Critical Thresholds:**
   - **Fever:** Temperature $\ge 38.0\ ^\circ\text{C}$. Resets the patient's fever-free streak to 0 immediately.
   - **Critical Fever:** Temperature $\ge 40.0\ ^\circ\text{C}$. Displays a deep red pulsing indicator and immediately notifies the doctor.
3. **Temperature Validation:**
   - Allowed range: $34.0\ ^\circ\text{C}$ to $42.0\ ^\circ\text{C}$ (values outside this range block saving with an inline error).
   - Temperatures $< 35.0\ ^\circ\text{C}$ trigger an amber warning (*"Unusually low. Re-check the thermometer"*) and require explicit confirmation.
   - Temperatures $\ge 40.0\ ^\circ\text{C}$ show an emergency doctor alert banner.
4. **Duplicate Prevention & Correction Audit:**
   - Only **one official reading per patient per calendar day**.
   - Attempting a duplicate reading opens a dialog displaying the existing reading time and recorder name.
   - Corrections require an explicit reason (minimum 3 characters) and preserve previous values in the patient audit trail.
5. **3-Day Fever-Free Discharge Streak:**
   - A patient becomes eligible for discharge when they have **3 consecutive completed calendar days** below $38.0\ ^\circ\text{C}$.
   - Fever resets the streak to 0. A day with no reading breaks the streak.
6. **Strict Clinical Visit Order:**
   - Doctor visits are **locked** until today's temperature is recorded by a nurse (displayed as *"Awaiting temperature"* and disabled).
   - Discharge decision is disabled unless the patient meets the 3-day afebrile criteria.
7. **Discharge Bed Release Flow:**
   - Two-step discharge: Doctor approves $\rightarrow$ Admin verifies and releases bed.
   - Completing discharge closes the case as `cured`, updates metrics, and frees the room.
8. **Death Declaration:**
   - Doctors can record deaths with mandatory cause/notes confirmation. Frees room immediately and closes case as `deceased`.
   - Recording 2 additional deaths pushes the facility mortality rate above the 15% benchmark, triggering a facility-wide red warning alert.
9. **Capacity Management:**
   - 74 rooms (`R-01` to `R-74`).
   - Admission is blocked when capacity is 74/74 with a warning banner: *"Centre at full capacity (74/74). Discharge a patient to free a bed."*
   - Once a bed is vacated, the admission dropdown only presents vacant rooms.
10. **Role Guarding & Permissions:**
    - Unauthorized navigation redirects the user to their designated home route with a toast: *"You don't have access to that page."*
11. **Dev Sanity Self-Tests (`src/lib/selftest.ts`):**
    - Automatically executes on boot and logs unit assertions in the browser console for Rules 2, 4, 5, and 10.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (custom clinical palette, accessible contrast, pulsing indicators)
- **Routing:** react-router-dom (HashRouter + `vercel.json` SPA rewrite for universal deep linking)
- **State & Storage:** Zustand with `localStorage` persistence (no external backend required)
- **Charts:** Recharts (14-day compliance curve, thermal chart with $38.0\ ^\circ\text{C}$ threshold reference line, outcome bars)
- **Icons:** Lucide React
- **Typography:** Inter (Google Fonts)

---

## 🚀 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

3. Verify production build:
   ```bash
   npm run build
   ```

---

## ☁️ Vercel Deployment Steps

1. Push or import the repository into GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"** $\rightarrow$ **"Import"**.
3. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Click **Deploy**.
5. Deep links and client routes will automatically resolve through the included [vercel.json](file:///e:/TPM/vercel.json) rewrite rule.
