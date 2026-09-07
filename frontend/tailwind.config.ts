import type { Config } from "tailwindcss";
export default {
  darkMode: ["class"], content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { background: "hsl(var(--background))", foreground: "hsl(var(--foreground))", primary: "hsl(var(--primary))", border: "hsl(var(--border))", muted: "hsl(var(--muted))" },
    fontFamily: { sans: ["var(--font-sans)"], mono: ["var(--font-mono)"] },
    animation: { "spin-slow": "spin 18s linear infinite", float: "float 6s ease-in-out infinite" },
    keyframes: { float: { "0%,100%": {transform:"translateY(0)"}, "50%": {transform:"translateY(-12px)"} } }
  }}, plugins: []
} satisfies Config;

