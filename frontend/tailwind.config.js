/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          teal: '#06b6d4',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          violet: '#8b5cf6',
        },
        dark: {
          primary: '#090d16',
          secondary: '#111827',
          surface: '#1e293b',
          border: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Kantumruy Pro"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        khmer: ['"Kantumruy Pro"', 'system-ui', 'sans-serif'],
        handwriting: ['"Caveat"', 'cursive', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 30px -10px rgba(0, 0, 0, 0.09), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
      }
    },
  },
  plugins: [],
}
