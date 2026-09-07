/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Neuro-UX Condominio
        admin: {
          dark: '#1E293B', // Azul Marino Profundo (Enfoque)
          slate: '#475569', // Gris Pizarra (Eficiencia)
        },
        resident: {
          sage: '#84A98C', // Verde Salvia (Calma)
          blue: '#3B82F6', // Azul Claro (Transparencia)
        },
        junta: {
          royal: '#1D4ED8', // Azul Rey (Autoridad)
          bronze: '#B45309', // Bronce (Toma de decisiones)
        },
        alert: '#C2410C', // Naranja Tostado (Urgencia sin agresi├│n)
      }
    },
  },
  plugins: [],
}
