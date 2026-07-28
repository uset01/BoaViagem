import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)"],
      },
      colors: {
        bg: "#F5F6F8",
        surface: "#FFFFFF",
        "surface-muted": "#EDEFF3",
        ink: "#14161A",
        "ink-secondary": "#6B7280",
        "ink-tertiary": "#9CA3AF",
        accent: "#2F6FED",
        success: "#17915A",
        "success-bg": "#E6F4EC",
        danger: "#D8483B",
        "danger-bg": "#FBEBE9",
        "warning-text": "#7A5A00",
        "warning-bg": "#FCF4DD",
        divider: "#E5E7EB",
      },
      backgroundImage: {
        "accent-gradient": "linear-gradient(135deg, #2F6FED 0%, #8B5CF6 100%)",
        "band-bottom-fade": "linear-gradient(180deg, transparent 0%, #F5F6F8 100%)",
      },
      boxShadow: {
        card: "0 12px 28px rgba(15, 23, 42, 0.06)",
        sheet: "0 -16px 40px rgba(15, 23, 42, 0.12)",
      },
      keyframes: {
        // "-a" and "-b" are identical; the components alternate between them
        // on every change so React always sees a new class name and the
        // animation restarts, instead of being a no-op on repeated triggers.
        "number-pulse-a": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "number-pulse-b": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "number-pulse-a": "number-pulse-a 180ms ease-out",
        "number-pulse-b": "number-pulse-b 180ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
