/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        primary: '#6750A4',
        'primary-container': '#EADDFF',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#21005D',
        secondary: '#625B71',
        'secondary-container': '#E8DEF8',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#1D192B',
        tertiary: '#7D5260',
        'tertiary-container': '#FFD8E4',
        'on-tertiary': '#FFFFFF',
        'on-tertiary-container': '#31111D',
        error: '#B3261E',
        'on-error': '#FFFFFF',
        'error-container': '#F9DEDC',
        'on-error-container': '#410E0B',
        background: '#FFFBFE',
        'on-background': '#1C1B1F',
        surface: '#FFFBFE',
        'on-surface': '#1C1B1F',
        'surface-variant': '#E7E0EC',
        'on-surface-variant': '#49454F',
        outline: '#79747E',
      }
    },
  },
  plugins: [],
}

