/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0b0f19",
        darkSurface: "#151d30",
        electricBlue: "#2563eb",
        normalGreen: "#10b981",
        warningAmber: "#f59e0b",
        highOrange: "#ea580c",
        criticalRed: "#dc2626",
        infoBlue: "#06b6d4",
        aiPurple: "#7c3aed"
      }
    },
  },
  plugins: [],
}
