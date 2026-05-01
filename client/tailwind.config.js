/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgBase: 'var(--color-bg-base)',
        bgSurface: 'var(--color-bg-surface)',
        bgElevated: 'var(--color-bg-elevated)',
        borderBase: 'var(--color-border)',
        borderStrong: 'var(--color-border-strong)',
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        primarySubtle: 'var(--color-primary-subtle)',
        accent: 'var(--color-accent)',
        warn: 'var(--color-warn)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textMuted: 'var(--color-text-muted)',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
