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
          bg: '#080C17', // Main very dark navy/black background
          panel: '#101626', // Slightly lighter for panels/cards
          border: '#1E293B', // Dark border color
          accent: '#3B82F6', // Vibrant blue for primary actions
          cyan: '#06B6D4', // Cyan neon accents
          text: '#F1F5F9', // Bright white/gray text
          muted: '#64748B', // Muted text for labels
          success: '#10B981', // Neon green for success
          warning: '#F59E0B', // Neon yellow/orange for warnings
          danger: '#EF4444' // Neon red for danger
        },
      }
    },
  },
  plugins: [],
}
