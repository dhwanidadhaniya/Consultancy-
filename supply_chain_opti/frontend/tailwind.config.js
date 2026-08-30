/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#070B14",
          card: "#0E1626",
          cardHover: "#141F36",
          border: "rgba(255, 255, 255, 0.08)",
          borderGlow: "rgba(56, 189, 248, 0.25)",
          text: "#F1F5F9",
          muted: "#94A3B8",
          faint: "#64748B",
        },
        neon: {
          cyan: "#00F2FE",
          emerald: "#10B981",
          purple: "#8B5CF6",
          amber: "#F59E0B",
          rose: "#F43F5E",
          blue: "#3B82F6",
        },
        accent: {
          DEFAULT: "#00F2FE",
          soft: "rgba(0, 242, 254, 0.12)",
          bright: "#38BDF8",
        },
        alert: {
          DEFAULT: "#F43F5E",
          soft: "rgba(244, 63, 94, 0.15)",
        },
        good: {
          DEFAULT: "#10B981",
          soft: "rgba(16, 185, 129, 0.15)",
        },
      },
      fontFamily: {
        display: ["'Outfit'", "'Inter'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(0, 242, 254, 0.05)",
        "glow-cyan": "0 0 20px -3px rgba(0, 242, 254, 0.4)",
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.4)",
        "glow-purple": "0 0 20px -3px rgba(139, 92, 246, 0.4)",
        "glow-rose": "0 0 20px -3px rgba(244, 63, 94, 0.4)",
      },
      keyframes: {
        "border-beam": {
          "100%": { offsetDistance: "100%" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.05)" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "border-beam": "border-beam 6s linear infinite",
        shimmer: "shimmer 2.5s infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "radar-sweep": "radar-sweep 8s linear infinite",
        float: "float 4s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        glass: "16px",
      },
    },
  },
  plugins: [],
};
