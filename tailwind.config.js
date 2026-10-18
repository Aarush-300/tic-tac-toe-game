/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        paper: {
          DEFAULT: '#F4F1EA',
          surface: '#FFFFFF',
          muted: '#EAE5D9',
          border: '#18181B',
        },
        ink: {
          DEFAULT: '#18181B',
          light: '#3F3F46',
          muted: '#71717A',
        },
        terracotta: {
          DEFAULT: '#E04F33',
          hover: '#C83E24',
          light: '#FDF2F0',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #18181B',
        'brutal-sm': '2px 2px 0px 0px #18181B',
        'brutal-lg': '6px 6px 0px 0px #18181B',
      },
      animation: {
        'draw-stroke': 'drawStroke 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stamp': 'stamp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        drawStroke: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        stamp: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
