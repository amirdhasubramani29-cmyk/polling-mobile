/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
        "primary-dark": "#6d28d9",
        accent: "#a855f7",
        background: "#0f0f14",
        surface: "#1a1a24",
        "surface-2": "#22223a",
        border: "#2e2e4a",
        "text-primary": "#f0f0ff",
        "text-secondary": "#9090b0",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
