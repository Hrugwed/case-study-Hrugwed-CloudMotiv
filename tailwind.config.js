/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b132b',
        muted: '#6b7280',
        highlight: '#fde68a'
      }
    }
  },
  plugins: []
}

