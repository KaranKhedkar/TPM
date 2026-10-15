/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        wardTeal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E', // primary teal
          800: '#115E59', // hover
          900: '#134E4A',
        },
        status: {
          normal: '#16A34A',
          normalBg: '#DCFCE7',
          pending: '#D97706',
          pendingBg: '#FEF3C7',
          fever: '#DC2626',
          feverBg: '#FEE2E2',
          critical: '#991B1B',
          criticalBg: '#FECACA',
          doctor: '#2563EB',
          doctorBg: '#DBEAFE',
          discharge: '#0F766E',
          dischargeBg: '#CCFBF1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
