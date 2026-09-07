/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agent: {
          bg: '#0F172A',
          text: '#F8FAFC',
          accent: '#3B82F6',
          cyan: '#06B6D4',
          border: '#1E293B',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
