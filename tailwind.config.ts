import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          light: "var(--primary-light)",
        },
        accent: "var(--accent)",
        violet: "var(--violet)",
        indigo: "var(--indigo)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        bg: {
          DEFAULT: "var(--bg)",
          2: "var(--bg-2)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        border: {
          DEFAULT: "var(--border)",
          bright: "var(--border-bright)",
        },
      },
      boxShadow: {
        glow:    "var(--glow)",
        "glow-sm": "var(--glow-sm)",
        "glow-lg": "var(--glow-lg)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(120,40,200,0.25) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 0% 50%, rgba(100,20,180,0.12) 0%, transparent 60%)",
      },
      animation: {
        "float-y":       "float-y 6s ease-in-out infinite",
        "float-y-rev":   "float-y-rev 7s ease-in-out infinite",
        "spin-slow":     "spin-slow 20s linear infinite",
        "pulse-glow":    "pulse-glow 2s ease-in-out infinite",
        "gradient-shift":"gradient-shift 6s ease infinite",
        "fade-in-up":    "fade-in-up 0.6s ease forwards",
        "badge-pop":     "badge-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        shimmer:         "shimmer 3s linear infinite",
      },
      keyframes: {
        "float-y": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%":      { transform: "translateY(-18px) rotate(3deg)" },
        },
        "float-y-rev": {
          "0%, 100%": { transform: "translateY(-10px) rotate(0deg)" },
          "50%":      { transform: "translateY(12px) rotate(-3deg)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%":      { opacity: "0.9", transform: "scale(1.05)" },
        },
        "gradient-shift": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "badge-pop": {
          "0%":   { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          to: { backgroundPosition: "200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
