/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic aliases — use `bg-app-*`, `text-app-*`, `border-app-*` in className strings.
        // Raw stone/amber/red/green scales are already in Tailwind defaults and can be used directly.
        app: {
          background:       '#fafaf9',  // stone-50  — page backgrounds
          surface:          '#ffffff',  // white     — cards, inputs
          'surface-alt':    '#f5f5f4',  // stone-100 — secondary surfaces
          primary:          '#44403c',  // stone-700 — primary actions, headings
          'primary-hover':  '#292524',  // stone-800
          accent:           '#f59e0b',  // amber-500 — CTAs, highlights, active states
          'accent-hover':   '#d97706',  // amber-600
          'accent-light':   '#fffbeb',  // amber-50  — tinted accent backgrounds
          'text-primary':   '#1c1917',  // stone-900 — body text
          'text-secondary': '#78716c',  // stone-500 — muted text
          'text-tertiary':  '#a8a29e',  // stone-400 — placeholder, disabled
          'text-inverse':   '#ffffff',  // white     — text on dark/accent backgrounds
          border:           '#e7e5e4',  // stone-200 — default borders
          'border-strong':  '#d6d3d1',  // stone-300 — emphasized borders
          danger:           '#ef4444',  // red-500
          'danger-light':   '#fef2f2',  // red-50
          success:          '#16a34a',  // green-600
          'success-light':  '#dcfce7',  // green-100
        },
      },
    },
  },
  plugins: [],
};
