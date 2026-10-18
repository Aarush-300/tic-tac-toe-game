/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#06b6d4',
          cyanGlow: '#22d3ee',
          pink: '#f43f5e',
          pinkGlow: '#fb7185',
          amber: '#f59e0b',
          emerald: '#10b981',
          purple: '#8b5cf6',
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pop': 'pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(16, 185, 129, 0.3)',
          },
          '50%': {
            transform: 'scale(1.03)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.9), inset 0 0 25px rgba(16, 185, 129, 0.5)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
