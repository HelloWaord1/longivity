/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#09090b',
          card: '#111113',
          hover: '#18181b',
        },
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
        },
        grade: {
          a: '#10b981',
          b: '#3b82f6',
          c: '#f59e0b',
          d: '#ef4444',
        },
        border: '#1c1c1e',
        primary: '#fafafa',
        secondary: '#a1a1aa',
        tertiary: '#52525b',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
